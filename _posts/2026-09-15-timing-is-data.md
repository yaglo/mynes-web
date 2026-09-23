---
layout: "post"
title: "Part 1: The 6502 timing DSL"
date: "2026-09-15"
updated: "2026-09-22"
series: 1
slug: "timing-is-data"
permalink: "/blog/timing-is-data/"
teaser: "The MyNES 6502 core is generated from a declarative DSL that gives the bus operation of every cycle of all 256 opcodes."
description: "The MyNES 6502 core is generated from a declarative DSL that gives the bus operation of every cycle of all 256 opcodes."
source: "docs/blog/01-timing-is-data.md"
---

Updated 2026-09-22: the Results section gives the current AccuracyCoin result and retracts the earlier 119 of 138.

The MyNES 6502 core is generated from a declarative DSL that gives the bus operation of every cycle. This part describes the DSL, the compiler that turns it into C, and the bugs that the design rules out.

## Cycle timing in a hand-written 6502 core

A 6502 core written by hand in C covers 256 opcodes across 13 addressing modes, with conditional extra cycles for page boundary crossings and taken branches. Each cycle performs exactly one bus operation: a read, a write or a dummy read. The address and timing of that operation decide interrupt recognition, DMA interaction and PPU synchronization. One wrong cycle can stay hidden until a test ROM checks a case such as a DMC sample fetch landing on the fourth cycle of an INC instruction.

The bugs in such a core are bookkeeping errors, for example:

- a dummy read left out of a read-modify-write (RMW) instruction;
- a page-crossing penalty that is off by one cycle;
- the double write that RMW instructions perform on the chip (the old value, then the new value), skipped because it looks redundant;
- a CLI instruction that clears the interrupt flag immediately, where the 6502 clears it after a one-instruction delay.

Each is a one-line mistake in one of many nearly identical switch cases, and it stays invisible until a game relies on the exact timing.

The usual designs put the timing specification inside the implementation. FCEUX uses a large switch with manual cycle counting, Nestopia uses per-instruction functions with cycle tables, and other cores execute whole instructions and apply fixups. In each of them, what happens on cycle 3 is written as imperative code. When the specification is code, nothing in its structure prevents a miscounted cycle.

## Timing follows the addressing mode

The timing of 6502 instructions follows regular patterns set by the addressing mode. Every absolute-indexed read instruction does the same thing:

1. Fetch low address byte, increment PC
2. Fetch high address byte, add index to low byte, latch carry
3. Read from (possibly wrong) effective address
4. If carry was set, fix high byte, re-read from correct address

This holds for `LDA abs,X`, `AND abs,X` and `ADC abs,X`. The only difference between them is what the instruction does with the byte it read. The bus access pattern, which is the timing, is data that can be described once and reused.

With the timing written as structured data, a compiler can check that every cycle has exactly one bus operation, remove manual cycle counting and generate the repetitive C.

## The 4 layers of the DSL

The DSL in `src/cpu/nes6502.dsl` describes all 256 opcodes in 4 layers of S-expressions. A Chicken Scheme compiler reads it and generates C.

### Cycle macros (`defcycle`)

Layer 1 names single-cycle patterns for common bus operations:

```scheme
(defcycle fetch-adl       (fetch adl pc))
(defcycle fetch-adh       (fetch adh pc))
(defcycle read-to-dl      (read dl ad))
(defcycle fixup-page-read (read dl ad) (adc8-from-pagecross adh adh))
(defcycle write-nz-dl     (write ad dl) (nz dl))
```

`(fetch-adl)` anywhere in a state body expands to one clock cycle that reads from PC into the address low latch and increments PC. The DSL uses 20 of these macros for the common patterns: operand fetches, reads from the effective address, result writes and dummy reads that pad the timing.

### Addressing-mode templates (`template`)

Layer 2 composes cycle macros into multi-cycle patterns with parameters:

```scheme
(template read-abs (op reg)
  (fetch-adl)
  (fetch-adh)
  (cycle (read dl ad) (op reg dl)))

(template rmw-zp (op)
  (fetch-zp-addr)
  (read-to-dl)
  (cycle (write ad dl) (op dl))
  (write-nz-dl))
```

`read-abs` takes an operation and a register as parameters. When the template is instantiated, `op` and `reg` are substituted as text. The template defines the bus access pattern, and the parameters define what happens to the data.

The `when` construct handles instructions of variable length:

```scheme
(template read-abx (op reg)
  (fetch-adl)
  (fetch-adh-add-x)
  (cycle (read dl ad) (op reg dl))
  (when page-cross
    (cycle (adc8-from-pagecross adh adh) (read dl ad) (op reg dl))))
```

The third cycle performs the operation on the assumption that no page was crossed. Without a page cross, the instruction ends after 4 cycles. If the indexed add carried, the read used the wrong high byte, so a fourth cycle fixes the address and reads again. This matches the 6502, where the penalty cycle is a conditional extra bus access with its own behavior.

### Instruction states (`state`)

Layer 3 instantiates templates with specific operations. The 8 LDA addressing variants are 8 one-line states:

```scheme
(state lda-imm (read-imm load-nz a))
(state lda-zp  (read-zp  load-nz a))
(state lda-zpx (read-zpx load-nz a))
(state lda-abs (read-abs load-nz a))
(state lda-abx (read-abx load-nz a))
(state lda-aby (read-aby load-nz a))
(state lda-izx (read-izx load-nz a))
(state lda-izy (read-izy load-nz a))
```

Written by hand, each variant takes 4 to 8 switch cases with manual bus reads, flag updates and cycle transitions. The DSL version leaves no place for an off-by-one cycle or a forgotten dummy read.

### Opcode table (`opcode`)

Layer 4 maps opcode bytes to states:

```scheme
(opcode #xA9 lda-imm)
(opcode #xA5 lda-zp)
(opcode #xAD lda-abs)
```

The compiler builds a 256-entry lookup table from these lines.

## Branches

The branch template shows how `when` blocks compile to conditional microcode jumps:

```scheme
(template branch-if (cond)
  (cycle (fetch dl pc) (branch-decide cond dl))
  (when branch-taken
    (cycle (dummy pc) (branch-update-pcl dl)))
  (when page-cross
    (cycle (dummy pc) (branch-correct-pch dl))))
```

All 8 branch instructions are one-word definitions, and 6 of them are shown here:

```scheme
(state bpl (branch-if (not n)))
(state bmi (branch-if n))
(state bcc (branch-if (not c)))
(state bcs (branch-if c))
(state bne (branch-if (not z)))
(state beq (branch-if z))
```

The compiler generates this C for BPL (cases 440 to 442 of `cpu_gen.c`):

```c
case 440: /* bpl */
    cpu->DL = cpu->mem_read(cpu, cpu->PC);
    cpu->PC = (cpu->PC + 1) & 0xFFFF;
    if (!((cpu->P & 0x80))) {
        cpu->branch_taken = 1;
        uint16_t _np = (cpu->PC + (int8_t)cpu->DL) & 0xFFFF;
        cpu->page_cross = ((cpu->PC & 0xFF00) != (_np & 0xFF00));
    } else { cpu->branch_taken = 0; cpu->page_cross = 0; }
    if (cpu->branch_taken) { cpu->uPC = 441; return; }
    cpu->uPC = 0; return;
case 441: /* bpl when branch-taken */
    (void)cpu->mem_read(cpu, cpu->PC);
    cpu->PC = (cpu->PC & 0xFF00) | ((cpu->PC + (int8_t)cpu->DL) & 0xFF);
    if (cpu->page_cross) { cpu->uPC = 442; return; }
    cpu->uPC = 0; return;
case 442: /* bpl when page-cross */
    (void)cpu->mem_read(cpu, cpu->PC);
    if ((int8_t)cpu->DL < 0) cpu->PC = (cpu->PC - 0x100) & 0xFFFF;
    else cpu->PC = (cpu->PC + 0x100) & 0xFFFF;
    cpu->uPC = 0; return;
```

The 3 cases give the 3 possible cycle counts:

- Not taken, 2 cycles: case 440 reads the offset, decides not to branch and jumps to uPC 0.
- Taken on the same page, 3 cycles: case 440 sets `branch_taken` and moves to 441. Case 441 updates PCL only, finds no page cross and jumps to 0.
- Taken across a page, 4 cycles: case 441 finds a page cross and moves to 442, which fixes PCH.

The generated code has no cycle counter and no rule such as "add 1 if taken, add 1 more if page cross". The variable timing comes from the structure of the conditional microcode.

## NMI handler and the datasheet timing diagram

The NMI handler in the DSL follows the timing diagram in the 6502 datasheet:

```scheme
(state nmi-handler
  (cycle (dummy pc))                                          ;; T1: internal
  (cycle (write sp pch) (sp-1))                               ;; T2: push PCH
  (cycle (write sp pcl) (sp-1))                               ;; T3: push PCL
  (cycle (prep-push-p nmi) (write sp dl) (sp-1))              ;; T4: push P
  (cycle (set-flag i) (snapshot-i) (read adl vec-nmi-lo))     ;; T5: read vector lo
  (cycle (read adh vec-nmi-hi) (mov pcl adl) (mov pch adh))   ;; T6: read vector hi
  (goto fetch))
```

Each line maps 1:1 to a row in the timing diagram. The bus operation, the register changes and the cycle boundary sit on the same line, so the DSL and the datasheet can be checked against each other row by row.

## Unofficial opcodes built from official ones

The unofficial opcode DCP (decrement memory, then compare) is an RMW instruction. In the DSL, its core is DEC followed by CMP:

```scheme
(state dcp-zp
  (fetch-zp-addr) (read-to-dl)
  (cycle (write ad dl) (dec dl))
  (cycle (write ad dl) (cmp a dl)))
```

The first write puts back the original value after the decrement happens internally. The second write puts back the decremented result. RMW instructions on the chip do the same: they write the unmodified value, perform the operation, then write the result. The DSL shows both writes as separate cycles.

The 7 DCP addressing variants follow one pattern: the setup cycles of the addressing mode, then the DEC+CMP write pair.

```scheme
(state dcp-zp  (fetch-zp-addr) (read-to-dl) ...)
(state dcp-zpx (fetch-zp-addr) (dummy-add-x) (read-to-dl) ...)
(state dcp-abs (fetch-adl) (fetch-adh) (read-to-dl) ...)
(state dcp-abx (fetch-adl) (fetch-adh-add-x) (fixup-page-read) (read-to-dl) ...)
```

ISC (INC + SBC), SLO (ASL + ORA), RLA (ROL + AND), SRE (LSR + EOR) and RRA (ROR + ADC) are built the same way. Each combines 2 official operations, and the DSL shows the composition.

## The compiler

The compiler is 904 lines of Chicken Scheme and works in 3 steps.

Template expansion is text substitution. For `(read-abs load-nz a)`, the compiler looks up the `read-abs` template, substitutes `load-nz` for `op` and `a` for `reg`, then expands nested templates recursively. The result is a flat sequence of `(cycle ...)` forms.

uPC assignment is sequential. The compiler walks the states in definition order and gives each state a contiguous range of case labels. The `fetch` state is always case 0.

`when` blocks compile to conditional jumps. The cycle before a `when` block tests the condition. If it holds, the next step is the first case of the `when` block; otherwise the jump skips all consecutive `when` blocks and goes to uPC 0. Variable-timing instructions work this way without a runtime cycle counter.

## Results

The 1,401 lines of DSL generate 5,300 lines of C containing 834 microcode steps. The generated `cpu_gen.c` is one switch statement over the 834 steps, which compiles to a jump table.

MyNES passes {{ site.data.facts.tests.passed }} of {{ site.data.facts.tests.total }} tests in the current bundled AccuracyCoin ROM, with no failures and no unrun tests at the default CPU/PPU alignment. The 119 of 138 result that this post gave before described an older implementation and fixture. The [AccuracyCoin fixture revision](https://github.com/yaglo/mynes/blob/master/tests/accuracy_coin/UPSTREAM.md) and the [MyNES testing guide](https://github.com/yaglo/mynes/blob/master/docs/architecture/testing.md) give the details.

A timing bug is usually fixed with a one-line change to the DSL, such as adding a missing `(snapshot-i)`, reordering operations within a cycle or adding a `(when page-cross ...)` block. The C code regenerates automatically, and the DSL remains the only place where the timing is specified.

The DSL rules out 4 kinds of bugs: miscounted cycles, forgotten dummy reads, wrong RMW write sequences and misplaced flag updates. Correctness composes through the templates: if a template is right, every instruction that uses it is right, so each addressing mode is verified once for all of its opcodes.
