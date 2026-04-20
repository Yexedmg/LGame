---
description: Deploy changes to GitHub Pages — pushes all files to the GitHub repo
---

# Deploy to GitHub Pages

This workflow commits and pushes all changes in the CGame project to GitHub, which auto-deploys via GitHub Pages.

## Steps

// turbo-all

1. Stage all changed files:
```bash
cd /Users/yordifaith/PycharmProjects/CGame && git add -A
```

2. Commit with a descriptive message (include current date):
```bash
cd /Users/yordifaith/PycharmProjects/CGame && git commit -m "Update $(date '+%Y-%m-%d %H:%M')"
```

3. Push to GitHub:
```bash
cd /Users/yordifaith/PycharmProjects/CGame && git push origin main
```

4. Confirm deployment: Tell the user their changes are live. GitHub Pages typically takes 1-2 minutes to rebuild. Their site will be available at their GitHub Pages URL.
