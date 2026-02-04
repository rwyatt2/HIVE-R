# HIVE-R Deployment Guide

This directory contains everything needed to deploy HIVE-R to production.

## Files

| File | Purpose |
|------|---------|
| `nginx.conf` | Nginx reverse proxy configuration |
| `Dockerfile` | Multi-stage Docker build |
| `docker-compose.yml` | Full stack deployment |

## Quick Deploy with Docker

### 1. Set Environment Variables

```bash
cp .env.example .env
# Edit .env with your values:
# - OPENAI_API_KEY (required)
# - JWT_SECRET (recommended)
# - HIVE_API_KEY (optional)
```

### 2. Build and Run

```bash
docker-compose up -d --build
```

### 3. Set Up SSL

```bash
# Initial certificate
docker-compose --profile ssl run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d hive-r.com -d www.hive-r.com

# Restart nginx
docker-compose restart nginx
```

## Manual Deployment

### 1. Build All

```bash
./scripts/build-all.sh
```

### 2. Copy to Server

```bash
rsync -avz dist-deploy/ user@server:/var/www/hive-r/
```

### 3. Configure Nginx

```bash
sudo cp nginx.conf /etc/nginx/sites-available/hive-r
sudo ln -s /etc/nginx/sites-available/hive-r /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Start Backend

```bash
cd /var/www/hive-r/server
npm install --production
pm2 start dist/index.js --name hive-r
```

## Routing

| Path | Destination |
|------|-------------|
| `/` | Landing page |
| `/app` | HIVE-R Studio |
| `/docs` | Documentation |
| `/demo` | Demo mode UI |
| `/chat/*` | API (proxied) |
| `/auth/*` | API (proxied) |
| `/demo/session` | API (proxied) |
| `/demo/chat` | API (proxied) |

## SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d hive-r.com -d www.hive-r.com

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

## Verification

```bash
# Check nginx config
nginx -t

# Check backend health
curl https://hive-r.com/health

# Check static files
curl -I https://hive-r.com/
curl -I https://hive-r.com/app/
curl -I https://hive-r.com/docs/
```

## Troubleshooting

### 502 Bad Gateway
- Check if backend is running: `pm2 status` or `docker-compose logs hive-r`
- Verify port 3000 is accessible: `curl http://localhost:3000/health`

### Static Files Not Loading
- Check file permissions: `ls -la /var/www/hive-r/`
- Verify nginx alias paths match your file structure

### SSL Issues
- Check certificate: `sudo certbot certificates`
- Renew manually: `sudo certbot renew`
