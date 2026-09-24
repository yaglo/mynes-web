#!/bin/sh
# Publish the render media as the media branch and deploy the site.
#
# The renders (assets/hero and assets/renders) are not in main's history:
# main ignores them, and the media branch holds them as one commit with no
# parent. Each publish replaces that commit, so a new set of renders does not
# add to the repository what the last set weighed. The Pages workflow on main
# checks the branch out beside the pages and deploys both.
#
# Usage: tools/publish_media.sh [--no-push]
#   --no-push  write the local media branch only
#
# GitHub Pages refuses a site over 1 GB, so media over 900 MB are refused
# here, leaving room for the pages.
set -eu
cd "$(git rev-parse --show-toplevel)"

push=1
case "${1:-}" in
  --no-push) push=0 ;;
  "") ;;
  *) echo "usage: tools/publish_media.sh [--no-push]" >&2; exit 2 ;;
esac

dirs="assets/hero assets/renders"
for d in $dirs; do
  [ -d "$d" ] || { echo "publish_media: $d is missing" >&2; exit 1; }
done

kb=$(du -sk $dirs | awk '{s += $1} END {print s}')
if [ "$kb" -gt 921600 ]; then
  echo "publish_media: the media weigh $((kb / 1024)) MB; GitHub Pages takes 1 GB for the whole site" >&2
  exit 1
fi

index=$(mktemp "${TMPDIR:-/tmp}/media-index.XXXXXX")
trap 'rm -f "$index"' EXIT
rm -f "$index"
# The directories are ignored on main, hence --force; Finder's files stay out.
GIT_INDEX_FILE=$index git add --force -- $dirs ':(exclude,glob)**/.DS_Store'
tree=$(GIT_INDEX_FILE=$index git write-tree)
files=$(GIT_INDEX_FILE=$index git ls-files | wc -l | tr -d ' ')
commit=$(git commit-tree "$tree" -m "Render media for main at $(git rev-parse --short HEAD)" \
  -m "$files files, $((kb / 1024)) MB. Replaced on every publish by tools/publish_media.sh.")
git update-ref refs/heads/media "$commit"
echo "media branch: $(git rev-parse --short "$commit"), $files files, $((kb / 1024)) MB"

[ "$push" = 1 ] || exit 0
git push --force origin media
if command -v gh >/dev/null 2>&1; then
  gh workflow run pages.yml --ref main
  echo "deploy started: gh run list --workflow pages.yml"
else
  echo "deploy: run the Pages workflow on main from the Actions tab"
fi
