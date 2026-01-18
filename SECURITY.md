# Security Notes

## Overview

DappForge takes security seriously. This document outlines the security measures implemented in the system.

## Secrets Isolation

### Environment Variables

- All sensitive configuration (API keys, private keys) must be provided via environment variables
- The `.env` file is gitignored and should never be committed
- Generated projects include `.env.example` files with placeholder values
- Secret values are marked with `secret: true` in the plugin output schema

### Runtime Secrets

- Private keys are never logged or included in error messages
- Secrets are not stored in the database or file system
- Memory is cleared after secret operations where possible

## Template Injection Safety

### Input Validation

All user inputs are validated using Zod schemas before processing:

```typescript
// All configs are validated against strict schemas
const config = StylusContractConfig.parse(node.config);
```

### Template Engine Safety

The template engine used for code generation:

- Does NOT support arbitrary code execution
- Uses a limited set of operations (variable substitution, loops, conditionals)
- Escapes special characters in user-provided values
- Validates template syntax before rendering

### Safe Code Generation

- Generated code is formatted and linted before output
- No `eval()` or dynamic code execution is used
- User-provided code snippets are sandboxed in specific sections

## Rate Limiting

### API Endpoints

```typescript
// Rate limits are applied at the API level
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});
```

### Generation Limits

- Maximum nodes per blueprint: 50
- Maximum edges per blueprint: 100
- Maximum file size for generated files: 1MB
- Generation timeout: 5 minutes

### GitHub API Limits

- Respects GitHub API rate limits
- Implements exponential backoff for retries
- Caches authentication tokens appropriately

## Audit Logging

### What is Logged

All significant operations are logged with:

- Timestamp
- Action type (repo_create, commit, pr_create, auth)
- Actor (user or system)
- Target resource
- Success/failure status
- Error messages (sanitized)

### What is NOT Logged

- Private keys or secrets
- Full request/response bodies
- User session tokens
- Internal implementation details

### Log Storage

- Logs are stored for 90 days
- Logs are immutable once written
- Access to logs is restricted

## Plugin Security

### Signed Plugins Only

```typescript
// Only pre-approved plugins can be registered
const registry = new PluginRegistry([
  'stylus-contract',
  'x402-paywall-api',
  'erc8004-agent-runtime',
  'repo-quality-gates',
]);
```

### No Arbitrary Code

- Users cannot upload custom plugins
- All plugins are reviewed and signed
- Plugin code runs in a controlled environment

## Network Security

### HTTPS Only

- All production traffic uses HTTPS
- HSTS headers are enabled
- Certificate pinning for critical endpoints

### CORS Configuration

```typescript
// CORS is configured to allow only trusted origins
fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});
```

## GitHub App Security

### Minimal Permissions

The GitHub App requests only necessary permissions:

- `contents: write` - For creating/updating files
- `pull_requests: write` - For creating PRs
- `metadata: read` - For repository information

### Installation Scope

- Users control which repositories the app can access
- The app cannot access repositories outside its installation scope

## Dependency Security

### Regular Audits

```bash
# Run dependency audit
pnpm audit
```

### Automated Scanning

- Dependabot/Renovate for dependency updates
- GitHub security advisories monitoring
- Trivy scans in CI pipeline

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** open a public GitHub issue
2. Email security@dappforge.dev with details
3. Include steps to reproduce if possible
4. Allow 90 days for fix before public disclosure

## Security Checklist for Deployment

- [ ] All secrets are in environment variables
- [ ] `.env` files are not in version control
- [ ] HTTPS is enabled
- [ ] Rate limiting is configured
- [ ] CORS origins are restricted
- [ ] Audit logging is enabled
- [ ] Dependencies are up to date
- [ ] Security scanning is enabled in CI

