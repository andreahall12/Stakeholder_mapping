# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. Email details to the project maintainer with the subject "Security: stakeholder-tool".
3. Include steps to reproduce, impact assessment, and any suggested fixes.

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix release**: Within 30 days for critical/high severity

## Security Measures

This project implements the following security controls:

- Input validation on all user inputs (go-playground/validator)
- Parameterized SQL queries (no string concatenation)
- Auto-escaped HTML output (Templ templates)
- CSRF protection on all web forms
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Dependency vulnerability scanning (govulncheck)
- Static security analysis (gosec)
- Structured audit logging

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
| < 1.0   | No        |
