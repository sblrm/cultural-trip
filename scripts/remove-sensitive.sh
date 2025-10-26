#!/bin/sh
# Bash script to untrack sensitive files and commit .gitignore
set -e
FILES='.env .env.local'

echo "Untracking: $FILES"
for f in $FILES; do
  if [ -f "$f" ]; then
    git rm --cached "$f" || true
    echo "Untracked $f"
  else
    echo "$f not found; skipping"
  fi
done

git add .gitignore
git commit -m "chore: add .gitignore and untrack sensitive env files" || true

echo "Done. To purge secrets from history, use 'git filter-repo' or BFG Repo-Cleaner:" 
 echo "  https://rtyley.github.io/bfg-repo-cleaner/"
 echo "  https://github.com/newren/git-filter-repo"
