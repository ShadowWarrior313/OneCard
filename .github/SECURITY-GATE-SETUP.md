# GitHub Actions Security Gate Setup

## Overview

The OneCard security gate automatically runs on every push and pull request to ensure:

1. ✅ **Security Scanner** — Runs `npm run security-check` (8 automated checks)
2. ✅ **Security Tests** — Runs `npm run test -- stripe` (50+ unit tests)
3. ✅ **Git Secrets** — Scans for exposed API keys in git history
4. ✅ **Environment Files** — Ensures `.env` files are never committed

---

## Workflow File Location

```
.github/workflows/security.yml
```

## How It Works

### Trigger Events

The workflow runs on:
- ✅ Every push to `main` or `develop` branches
- ✅ Every pull request to `main` or `develop` branches

### Concurrency

Only one security check runs per branch at a time (newer pushes cancel older checks).

### Jobs (Run in Parallel)

1. **security-check** (15 min timeout)
   - Installs Node 22 & dependencies
   - Runs `npm run security-check`
   - Reports results in GitHub summary

2. **security-tests** (15 min timeout)
   - Runs `npm run test -- stripe`
   - Verbose reporter for failures
   - Reports results in GitHub summary

3. **git-secrets** (10 min timeout)
   - Scans entire git history for secrets
   - Checks for: `sk_live_`, `sk_test_`, `whsec_`, AWS keys

4. **envfile-check** (5 min timeout)
   - Verifies no `.env*` files in git history
   - Confirms `.gitignore` has `.env` entries

5. **summary** (Final report)
   - Creates summary table of all checks
   - Fails if any check failed
   - Blocks merge if failed

---

## What Happens on Failure

If any check fails:

1. ❌ GitHub shows red X on PR/commit
2. ❌ PR cannot be merged (if branch protection is enabled)
3. ❌ Summary report shows which check failed
4. ✅ Developer fixes issue and pushes again
5. ✅ Workflow reruns automatically

### Example Failure Scenarios

**Security Scanner Fails:**
- Raw card field detected in code
- Real secret found in codebase
- Card data logged on payment routes

**Security Tests Fail:**
- Test case regression
- Guard not properly rejecting raw fields
- Rate limiting logic broken

**Git Secrets Fails:**
- Secret pattern found in git history
- Previously committed credential

**Environment Files Fail:**
- `.env` or `.env.local` committed to repo
- `.gitignore` missing `.env` entries

---

## Local Development

You can run these checks locally **before** pushing:

```bash
# Run all security checks
npm run security-check

# Run security tests
npm run test -- stripe

# Check for secrets in git history
git log --all -S "sk_live_" | head  # Should be empty
git log --all -S "sk_test_" | head  # Should be empty

# Verify .env files
grep "\.env" .gitignore  # Should show .env entries
git status --ignored | grep .env  # Should show ignored files
```

---

## Setting Up Branch Protection (Optional but Recommended)

To require security gate to pass before merging:

1. Go to **GitHub Repo → Settings → Branches**
2. Click **Add rule** under "Branch protection rules"
3. Branch name pattern: `main` (or `develop`)
4. Enable:
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require the "summary" job to succeed**
5. Enable:
   - ✅ **Dismiss stale pull request approvals when new commits are pushed**
6. Click **Create**

---

## Viewing Workflow Results

### In GitHub

1. Go to **Actions** tab in your repo
2. Click on **"Security Gate"** workflow
3. Click on the specific run
4. View detailed logs for each job

### In Pull Request

1. Scroll to bottom of PR
2. Click **Details** next to security check result
3. View logs and summary

### In Commit

1. Click the ✅ or ❌ icon next to commit
2. Click **Details** next to the workflow
3. View results

---

## Customization

### Changing Branches

Edit `.github/workflows/security.yml`:

```yaml
on:
  push:
    branches:
      - main
      - develop          # Add/remove branches here
      - staging
```

### Changing Timeouts

Edit timeouts for each job:

```yaml
timeout-minutes: 15    # Change for specific job
```

### Skipping a Job

Comment out a job in the workflow file:

```yaml
# security-tests:      # Commented out, won't run
#   name: Security Unit Tests
#   ...
```

### Changing Node Version

Edit Node version in setup step:

```yaml
node-version: '22'     # Change to '20' or '18' if needed
```

---

## Troubleshooting

### Workflow Won't Start

**Issue:** Workflow file doesn't appear in GitHub Actions tab

**Fix:**
1. Ensure `.github/workflows/security.yml` is committed
2. Wait 5-10 seconds for GitHub to index
3. Push a new commit to trigger it

### "Node version not found"

**Issue:** Node 22 not available in GitHub Actions

**Fix:** Change to Node 20:
```yaml
node-version: '20'
```

### "git secrets: command not found"

**Issue:** git-secrets installation failed

**Fix:** Check GitHub Actions logs for error, or use simpler pattern check instead

### Timeout Exceeded

**Issue:** Job takes longer than timeout

**Fix:** Increase timeout:
```yaml
timeout-minutes: 30    # Increase from 15
```

---

## Performance

Typical CI/CD run times:

- **Security Scanner:** 2–5 minutes
- **Security Tests:** 1–3 minutes
- **Git Secrets:** 2–4 minutes
- **Environment Files:** <1 minute
- **Summary:** <1 minute

**Total:** ~10 minutes for all checks

---

## Future Enhancements

Consider adding:

1. **Linting** — `npm run lint` (code style)
2. **Type Checking** — `npm run typecheck` (TypeScript)
3. **Build Check** — `npm run build` (production build)
4. **Code Coverage** — Security tests coverage report
5. **Slack Notification** — Notify team on failure
6. **Scheduled Runs** — Weekly full security scan

---

## References

- **GitHub Actions Docs:** https://docs.github.com/actions
- **Branch Protection:** https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- **Security Best Practices:** https://docs.github.com/code-security
- **OneCard Security Docs:** See `SECURITY-RUNBOOK.md`

---

## Support

If the security gate fails:

1. **Read the error message** in GitHub Actions logs
2. **Check the relevant security doc:**
   - Security Scanner → `SECURITY-AUDIT.md`
   - Security Tests → `SECURITY-TESTING-GUIDE.md`
   - Git Secrets → Environment setup
3. **Fix locally and test:**
   ```bash
   npm run security-check     # Test locally first
   npm run test -- stripe     # Test locally first
   ```
4. **Push fix** — Workflow reruns automatically

---

**Workflow created:** 2026-05-31  
**Status:** ✅ Ready to use  
**Last updated:** 2026-05-31
