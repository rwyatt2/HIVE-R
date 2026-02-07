# Git History Cleanup: `.env` Removal

**Date:** 2026-02-07  
**Performed by:** Security Agent  
**Severity:** Critical — real API keys were exposed in git history

---

## Incident Summary

The `.env` file containing real API keys was committed to the repository starting at
commit `86ce3dc` ("cfb"). Although `.gitignore` was later updated to exclude `.env`,
the file remained tracked and its contents persisted in git history across **7 commits**.

### Exposed Secrets

| Variable | Type | Risk |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key (`sk-proj-…`) | High — billing/abuse |
| `LANGCHAIN_API_KEY` | LangSmith key (`lsv2_pt_…`) | Medium — trace access |
| `GITHUB_TOKEN` | GitHub PAT (`github_pat_…`) | High — repo access |
| `HIVE_API_KEY` | HIVE internal key | Medium — API access |

---

## Remediation Steps Executed

### 1. Captured before-state

```bash
git log --all --oneline -- '.env'
# Output:
# 7b6a951 Ignore .env and update environment variables
# 699e377 Remove API keys and tokens from .env
# 9c4ad1e Add dotenv test; silence dotenv output
# 86ce3dc cfb
```

### 2. Backed up working `.env`

```bash
cp .env /tmp/.env.backup
```

### 3. Installed git-filter-repo

```bash
pip3 install git-filter-repo
```

### 4. Rewrote git history

```bash
git filter-repo --invert-paths --path .env --force
```

This rewrote all 31 commits, removing `.env` from every one. The remote `origin`
was automatically removed by `git-filter-repo` (expected behavior).

### 5. Restored working `.env` and re-added remote

```bash
cp /tmp/.env.backup .env
git remote add origin https://github.com/rwyatt2/HIVE-R.git
```

### 6. Verified cleanup

```bash
# No commits reference .env
git log --all --oneline -- '.env'
# (empty output ✓)

# .env is not tracked
git ls-files .env
# (empty output ✓)

# .env is properly ignored
git check-ignore .env
# .env ✓
```

### 7. Updated `.gitignore`

- Removed duplicate `.env` entry (was listed at both line 4 and line 52)
- Confirmed `.env`, `.env.local`, `.env.*.local` are all ignored

### 8. Updated `.env.example`

Added missing placeholder variables:
- `CHROMA_HOST` / `CHROMA_PORT` (Semantic Memory)
- `DATABASE_URL`
- `STRIPE_*` keys (commented out, for Billing phase)

### 9. Force-pushed cleaned history

```bash
git push origin --force --all
```

---

## Required Follow-Up Actions

> **⚠️ All exposed keys must be rotated immediately.**

| Key | Rotation Steps |
|---|---|
| `OPENAI_API_KEY` | [Revoke at OpenAI dashboard](https://platform.openai.com/api-keys) → generate new key |
| `LANGCHAIN_API_KEY` | [Revoke at LangSmith](https://smith.langchain.com/settings) → generate new key |
| `GITHUB_TOKEN` | [Revoke at GitHub](https://github.com/settings/tokens) → generate new PAT |
| `HIVE_API_KEY` | Regenerate via your key generation process |

After rotating, update your local `.env` with the new values.

---

## Prevention Measures

1. **`.gitignore` is configured** — `.env` and variants are listed at the top
2. **`.env.example` is maintained** — safe placeholders for documentation
3. **Pre-commit hook (recommended)** — consider adding a hook to prevent secrets:
   ```bash
   # .git/hooks/pre-commit
   if git diff --cached --name-only | grep -q '\.env$'; then
     echo "ERROR: Attempting to commit .env file!"
     exit 1
   fi
   ```
