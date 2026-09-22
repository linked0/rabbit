# 2026-07-02 — rabbit history

Source: no task/design doc — ad-hoc rename requested in chat (repo "task" → "rabbit").

### Repo rename: task → rabbit (GitHub + local)
- Renamed GitHub repo `linked0/task` → `linked0/rabbit` via `gh repo rename` (old URLs redirect).
- Updated `origin` to the clean URL `https://github.com/linked0/rabbit.git` — the previous URL had a
  `github_pat_...` token embedded in plaintext; auth now goes through the gh credential helper.
  The old token was exposed in `.git/config` and should be revoked on GitHub.
- Renamed local folder `/Users/jay/work/task` → `/Users/jay/work/rabbit`; fetch/tracking verified.
