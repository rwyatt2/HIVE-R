# Authentication

HIVE-R supports two authentication methods.

## API Key Authentication

For server-to-server communication, use an API key.

### Setup

Set the environment variable:

```bash
HIVE_API_KEY=your-secret-key
```

### Usage

Include the key in requests:

```bash
curl -X POST http://localhost:3000/chat \
  -H "X-API-Key: your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

---

## User Authentication (JWT)

For user-facing applications, use JWT tokens.

### Registration

```bash
POST /auth/register
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "abc123...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Login

```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Using Access Tokens

Include in the Authorization header:

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbG..."
```

### Token Refresh

Access tokens expire after 15 minutes. Use the refresh token to get new ones:

```bash
POST /auth/refresh
{
  "refreshToken": "abc123..."
}
```

### Logout

Invalidate the refresh token:

```bash
POST /auth/logout
{
  "refreshToken": "abc123..."
}
```

---

## Token Storage

### Browser (HIVE-R Studio)

Tokens are stored in `localStorage`:

```javascript
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', refreshToken);
```

### Security Considerations

- Access tokens: Short-lived (15 min), stored in memory
- Refresh tokens: Longer-lived (7 days), stored securely
- Always use HTTPS in production

---

## Protected Endpoints

These endpoints require authentication:

| Endpoint | Auth Type |
|----------|-----------|
| `PUT /agents/config/:name` | JWT |
| `POST /agents/config/:name/reset` | JWT |
| `GET /auth/me` | JWT |
| All endpoints (if HIVE_API_KEY set) | API Key |
