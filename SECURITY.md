# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.x.x (latest) | ✅ Active security updates |
| < 1.0.0 | ❌ No longer supported |

## Reporting a Vulnerability

If you discover a security vulnerability in HIVE-R, please report it responsibly.

### 🔒 Private Disclosure

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please use one of these methods:

1. **GitHub Security Advisories** (preferred):
   Go to [Security Advisories](https://github.com/rwyatt2/HIVE-R/security/advisories/new) and create a new advisory.

2. **Email**: Send details to the maintainer directly.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

| Action | Timeframe |
|---|---|
| Acknowledge report | Within 48 hours |
| Initial assessment | Within 1 week |
| Fix released | Within 30 days (critical: ASAP) |

## Security Practices

### Automated Scanning

HIVE-R runs these security checks automatically:

| Scanner | What it checks | When |
|---|---|---|
| **CodeQL** | Code vulnerabilities (SQLi, XSS, etc.) | Every push/PR + daily |
| **npm audit** | Known dependency vulnerabilities | Every push/PR + daily |
| **Gitleaks** | Accidentally committed secrets | Every push/PR |
| **Trivy** | Docker image OS/library CVEs | Every push/PR + daily |
| **License checker** | Copyleft/incompatible licenses | Every push/PR |
| **Dependabot** | Outdated dependencies | Weekly auto-PRs |

### Development Practices

- All secrets stored in environment variables (never committed)
- JWT authentication with short-lived access tokens
- Rate limiting on all API endpoints
- Input validation with Zod schemas
- Parameterized SQL queries (no string interpolation)
- Non-root Docker container user
- Security headers (CSP, X-Frame-Options, etc.)

## Acknowledgments

We appreciate responsible disclosure and will credit reporters in our changelog (unless anonymity is requested).
