#!/bin/sh
set -e
if [ "$VERCEL_PROJECT_ID" = "prj_B8e86wMkdWPTrlNo7bve4YQfynLL" ]; then
  rm -rf .vercel/control-build .next
  mkdir -p .vercel/control-build
  cp -R control-room/. .vercel/control-build/
  cd .vercel/control-build
  ../../node_modules/.bin/next build
  cp -R .next ../../.next
else
  next build
fi
