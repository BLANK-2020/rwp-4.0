#!/bin/bash

# Get the absolute path to the clean-secrets.sh script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEAN_SCRIPT="${SCRIPT_DIR}/clean-secrets.sh"

# Make sure the script exists and is executable
if [ ! -x "$CLEAN_SCRIPT" ]; then
  echo "Error: $CLEAN_SCRIPT does not exist or is not executable"
  exit 1
fi

# Get the current branch
current_branch=$(git symbolic-ref --short HEAD)
echo "Current branch: $current_branch"

# If we're already on main-backup, switch to main
if [ "$current_branch" = "main-backup" ]; then
  git checkout -f main
  current_branch="main"
fi

# If we're on main, delete main-backup if it exists and recreate it
if [ "$current_branch" = "main" ]; then
  git branch -D main-backup 2>/dev/null || true
  git branch -m main-backup
  git checkout -b main
fi

# Create a temporary script that will be used by filter-branch
cat > /tmp/filter-script.sh << INNEREOF
#!/bin/bash
"$CLEAN_SCRIPT"
INNEREOF
chmod +x /tmp/filter-script.sh

# Use filter-branch to rewrite history
export FILTER_BRANCH_SQUELCH_WARNING=1
git filter-branch --force --tree-filter "/tmp/filter-script.sh" --prune-empty HEAD

# Show the result
echo "Filter-branch completed. You can now force push with:"
echo "git push -f origin $current_branch"
