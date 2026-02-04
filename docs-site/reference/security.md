# Security

Security considerations for deploying and using HIVE-R.

## Authentication

### API Key

Set `HIVE_API_KEY` to require authentication on all endpoints:

```bash
HIVE_API_KEY=your-secret-key-min-32-chars
```

### JWT Tokens

User authentication uses:
- **Access tokens**: 15-minute expiry, HS256 algorithm
- **Refresh tokens**: 7-day expiry, stored in database
- **Passwords**: SHA-256 with random salt (via Node.js crypto)

## Workspace Isolation

Agents can only access files within the designated workspace:

```bash
WORKSPACE_PATH=./workspace
```

File operations are sandboxed:
- No access above workspace root
- No symbolic link following outside workspace
- Path traversal attacks blocked

## Rate Limiting

Default limits:
- 100 requests/minute per IP
- 10 concurrent connections
- Configurable via environment

```bash
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

## Input Validation

All inputs are validated:
- Message length limits
- Thread ID format validation
- JSON schema validation on bodies

## LLM Security

### Prompt Injection Prevention

- System prompts are isolated
- User input is clearly delineated
- Agents have limited tool access

### Output Sanitization

- Generated code is validated
- No arbitrary code execution
- SQL queries use parameterized statements

## Network Security

### CORS

CORS is enabled with configurable origins:

```bash
CORS_ORIGIN=https://yourdomain.com
```

### HTTPS

Always use HTTPS in production. Example with nginx:

```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

## Database Security

SQLite database should be:
- Outside the web root
- Backed up regularly
- Encrypted at rest (optional)

```bash
DATABASE_PATH=/secure/path/hive.db
```

## Secrets Management

Never commit secrets. Use environment variables:

```bash
# .env (gitignored)
OPENAI_API_KEY=sk-...
JWT_SECRET=your-jwt-secret
HIVE_API_KEY=your-api-key
```

## Audit Logging

Enable detailed logging for security audits:

```bash
LOG_LEVEL=info
LOG_FORMAT=json
```

Logged events:
- Authentication attempts
- API access
- Agent executions
- Error conditions

## Security Checklist

- [ ] Set strong `HIVE_API_KEY`
- [ ] Set strong `JWT_SECRET`
- [ ] Enable HTTPS
- [ ] Configure CORS origins
- [ ] Set rate limits
- [ ] Enable logging
- [ ] Regular backups
- [ ] Keep dependencies updated
