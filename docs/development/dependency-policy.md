# Dependency Update Policy

## Update Schedule

| Type | Frequency | Auto-merge |
|------|-----------|------------|
| Patch | Immediate | ✅ Yes |
| Minor (dev) | Weekly | ✅ Yes |
| Minor (prod) | Weekly | ❌ Review |
| Major | Manual | ❌ Review |
| Security | Immediate | ✅ Yes |

## Commands

```bash
# Audit
npm run audit
./scripts/audit-dependencies.sh

# Update
npm update                    # Safe patch/minor
npm outdated                  # Check versions
npx npm-check -u              # Interactive
```

## Security Response

| Severity | Timeline |
|----------|----------|
| Critical/High | Immediate |
| Moderate | 7 days |
| Low | 30 days |

## Testing Requirements

Before merging updates:
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] E2E tests pass
- [ ] No new TypeScript errors

## Rollback

```bash
git revert <commit>
# or
mv package.json.backup package.json
npm install
```
