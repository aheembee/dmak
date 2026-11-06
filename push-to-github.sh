#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# D_MAK MUSIC — push this folder to https://github.com/aheembee/dmak
# Usage:  ./push-to-github.sh [branch]
# ---------------------------------------------------------------------------
set -euo pipefail

REMOTE_URL="https://github.com/aheembee/dmak.git"
BRANCH="${1:-main}"
NAME="D_MAK Music"
EMAIL="web@dmakmusic.com"

cd "$(dirname "$0")"

command -v git >/dev/null || { echo "git is not installed."; exit 1; }

if [ ! -d .git ]; then
  echo "→ initialising repository"
  git init -b "$BRANCH" >/dev/null
fi

# make sure secrets never get committed
if [ -f .env ] && ! grep -qxF '.env' .gitignore 2>/dev/null; then
  echo ".env" >> .gitignore
fi

git add -A

if git diff --cached --quiet; then
  echo "→ nothing new to commit"
else
  git -c user.name="$NAME" -c user.email="$EMAIL" \
      commit -m "D_MAK MUSIC — official artist website" >/dev/null
  echo "→ committed"
fi

git branch -M "$BRANCH"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi
echo "→ remote: $REMOTE_URL"

# warn if a secret ever slipped into the index
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "!! .env is tracked — remove it before pushing:  git rm --cached .env"
  exit 1
fi

echo "→ pushing $BRANCH (Git will ask for your username + a personal access token)"
git push -u origin "$BRANCH"

echo
echo "Done. Next: Netlify → Add new site → Import from GitHub → aheembee/dmak"
echo "Then set ADMIN_TOKEN (and optionally CONTACT_WEBHOOK_URL) in Netlify env vars."
echo "Full guide: PUSH-TO-GITHUB.md"
