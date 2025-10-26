# PowerShell script to untrack sensitive files from git and commit the .gitignore
# Run this in repository root. It will:
# 1. Remove tracked sensitive files from the index (git rm --cached)
# 2. Commit the removal and .gitignore
# 3. Recommend how to purge secrets from history

$filesToUntrack = @('.env', '.env.local')

Write-Host "This will untrack: $($filesToUntrack -join ', ')" -ForegroundColor Yellow

foreach ($f in $filesToUntrack) {
    if (Test-Path $f) {
        Write-Host "Untracking $f" -ForegroundColor Cyan
        git rm --cached $f
    } else {
        Write-Host "$f not found; skipping" -ForegroundColor DarkGray
    }
}

Write-Host "Committing .gitignore and removals..." -ForegroundColor Cyan
git add .gitignore
git commit -m "chore: add .gitignore and untrack sensitive env files"

Write-Host "Done. If these files were previously committed, consider purging them from history:" -ForegroundColor Yellow
Write-Host "  - Use 'git filter-repo' or the BFG Repo-Cleaner to remove secrets from Git history." -ForegroundColor White
Write-Host "Examples: https://rtyley.github.io/bfg-repo-cleaner/ and https://github.com/newren/git-filter-repo" -ForegroundColor White
