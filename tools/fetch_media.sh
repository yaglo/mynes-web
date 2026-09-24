#!/bin/sh
# Put the published render media (the media branch) into assets/, for a local
# build of the site. Files already there with the same names are replaced;
# nothing else is removed.
#
# Usage: tools/fetch_media.sh
set -eu
cd "$(git rev-parse --show-toplevel)"
git fetch --depth 1 origin media
git archive FETCH_HEAD assets | tar -x -f - -C .
echo "media from $(git rev-parse --short FETCH_HEAD) in assets/hero and assets/renders"
