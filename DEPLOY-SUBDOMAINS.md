# Chataffy subdomain deployment

## URLs

| Portal | Host | Purpose |
|--------|------|---------|
| Marketing | `chataffy.com` | Landing page (`/`) |
| Dashboard | `dashboard.chataffy.com` | Client login, app, widget embed |
| Agent | `agent.chataffy.com` | Agent login & inbox |

Old paths under `/chataffy/cahtaffy_fe/*` return **301** to the correct host (production only).

## Frontend env (see `.env.portal.example`)

```env
APP_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_MARKETING_URL=https://chataffy.com/
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.chataffy.com/
NEXT_PUBLIC_AGENT_URL=https://agent.chataffy.com/
NEXT_PUBLIC_APP_URL=https://dashboard.chataffy.com/
```

## Backend env

```env
AUTH_COOKIE_DOMAIN=.chataffy.com
CORS_ORIGINS=https://chataffy.com,https://www.chataffy.com,https://dashboard.chataffy.com,https://agent.chataffy.com
CLIENT_URL=https://dashboard.chataffy.com/
AGENT_URL=https://agent.chataffy.com/
SHOPIFY_APP_LOAD_URL=https://dashboard.chataffy.com/
BASE_URL=https://chataffy.com/
```

## Nginx

Full config lives in the backend repo: `new-backend/nginx/nginx.conf`.

On each **backend** deploy, `new-backend/server.sh` will:

1. Copy `nginx/nginx.conf` → `/etc/nginx/sites-available/default`
2. Run `sudo nginx -t`
3. Run `sudo systemctl reload nginx`

### One-time (EC2, before first subdomain go-live)

1. **DNS** — point `dashboard.chataffy.com` and `agent.chataffy.com` to the same IP as `chataffy.com`.

2. **SSL** — certificate must include all hostnames:

```bash
sudo certbot certonly --nginx \
  -d chataffy.com -d www.chataffy.com \
  -d dashboard.chataffy.com -d agent.chataffy.com
```

3. Set production `.env` on server (frontend + backend) as above.

### Deploy order

1. Run `new-backend/server.sh` (pulls backend, restarts PM2 `backend`, updates nginx).
2. Run `new-frontend/cahtaffy_fe/server.sh` (builds Next.js, restarts PM2 `frontend`).

### Manual nginx update (without full deploy)

```bash
sudo cp /var/www/html/chataffy/chataffy/nginx/nginx.conf /etc/nginx/sites-available/default
sudo nginx -t && sudo systemctl reload nginx
```

See also `new-backend/nginx/README.md`.

## After deploy

1. Update Google OAuth authorized origins for `dashboard.chataffy.com`.
2. Update Shopify app URLs to `dashboard.chataffy.com`.
3. Re-copy widget embed snippets (they should use `dashboard.chataffy.com`).
4. Update `chataffy-superadmin` `VITE_FRONTEND_URL` if used.

## Smoke tests

```bash
curl -I https://chataffy.com/
curl -I https://dashboard.chataffy.com/login
curl -I https://agent.chataffy.com/agent-login
curl -I https://chataffy.com/chataffy/cahtaffy_fe/login   # expect 301 to dashboard
```
