# Deploying to `deposit.givtrade.com`

Runbook for a fresh server. The whole stack is Docker: **Postgres + Next.js app + Caddy**
(automatic HTTPS) + a small **sweeper** container that reconciles payments.

MT5 is reached in-process over the MetaQuotes **WebAPI** (`src/lib/mt5-webapi.ts`) — there is
**no separate gateway service** to deploy. The `gateway/` folder in this repo is legacy and unused.

---

## 1. Before you touch the server

| Item | Value |
|---|---|
| Domain | `deposit.givtrade.com` |
| DNS | `A` record → the server's public IPv4 (and `AAAA` if you have IPv6) |
| Ports | **80** and **443** open and **free** — Caddy binds them for the TLS challenge |
| Server | Any Linux box with Docker Engine + Compose v2. 2 vCPU / 2 GB RAM is plenty |

Check DNS has actually propagated before deploying — Caddy's certificate request fails if
the domain doesn't yet resolve to this machine:

```bash
dig +short deposit.givtrade.com     # must print this server's IP
```

---

## 2. Deploy

```bash
git clone https://github.com/Aliam-eng/PSP-Portal.git
cd PSP-Portal
./deploy.sh deposit.givtrade.com ops@givtrade.com
```

That single command:

1. Generates `AUTH_SECRET`, `POSTGRES_PASSWORD`, `CRON_SECRET` and an initial admin password,
   writing them to `.env` (**gitignored — never commit it**).
2. Builds and starts `db`, `web`, `caddy` and `sweeper`.
3. Runs `prisma migrate deploy`, then seeds the initial admin.
4. Caddy issues the Let's Encrypt certificate on the first request.

It prints the admin email and password at the end. **Save them** — the password is only shown
on the first deploy.

### If the server already runs nginx/Apache on 80/443

```bash
./deploy.sh deposit.givtrade.com --behind-proxy --port=8090
```

The app then listens on `127.0.0.1:8090` only, and the script prints a ready-made nginx or
Caddy block to paste into your existing proxy.

### Re-deploying later

```bash
git pull && ./deploy.sh deposit.givtrade.com ops@givtrade.com
```

Existing secrets and the admin password are read back out of `.env` and preserved. Migrations
apply automatically. The database volume (`psp_pgdata`) is untouched.

---

## 3. Configure the app (once, in the browser)

Sign in at `https://deposit.givtrade.com/login` with the admin credentials the script printed,
then **change the password immediately** in *Settings → Account*.

In *Admin → Settings*:

- **Rival** — paste the company key (`tsk_...`), tick *Enabled*, *Test connection*.
- **MT5 WebAPI** — host, manager login, password. Test it.
- **Minimum deposit** — this is what drives the `$50` floor on the deposit form.
- **Webhook secret** — generate one here, then paste the same value into Rival.

In the **Rival dashboard**, set the webhook URL to:

```
https://deposit.givtrade.com/api/webhooks/rival
```

The success/failure redirect URLs are built automatically from `APP_BASE_URL`, which
`deploy.sh` sets to `https://deposit.givtrade.com`. Nothing to configure by hand.

**In MT5 Administrator**, whitelist the server's public IP for the WebAPI manager account.
This is the single most common cause of deposits reaching `PAID` but never crediting.

---

## 4. Verify before announcing the domain

```bash
# 1. TLS is live and valid
curl -sI https://deposit.givtrade.com/deposit | head -1        # expect: HTTP/2 200

# 2. The PWA manifest serves
curl -s https://deposit.givtrade.com/manifest.webmanifest | head -3

# 3. The sweep endpoint rejects unauthenticated callers
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  https://deposit.givtrade.com/api/sweep                       # expect: 403

# 4. ...and accepts the secret
source .env
curl -s -X POST -H "x-cron-secret: $CRON_SECRET" \
  https://deposit.givtrade.com/api/sweep                       # expect: {"ok":true,...}
```

Then do **one real end-to-end deposit** for the minimum amount and confirm it reaches
`CREDITED` in *Admin → Transactions*. Nothing else proves the Rival key, the MT5 whitelist
and the redirect URLs are all correct at the same time.

---

## 5. Operating it

```bash
docker compose -f docker-compose.prod.yml logs -f web       # app logs
docker compose -f docker-compose.prod.yml logs -f sweeper   # reconciliation
docker compose -f docker-compose.prod.yml ps                # health
docker compose -f docker-compose.prod.yml down              # stop
```

**Reconciliation.** Rival does not reliably call back, so the `sweeper` container POSTs to
`/api/sweep` every 5 minutes over the internal Docker network, authenticated with
`CRON_SECRET`. This is what rescues payments where the customer closed the tab before being
redirected back. If deposits sit in `PAID` or `CREDIT_FAILED`, check the sweeper's logs first.

**Database backup** — there is no automatic backup. Add one:

```bash
docker exec psp-db pg_dump -U psp psp_portal | gzip > psp-$(date +%F).sql.gz
```

Put that in the host's crontab and ship the file off the machine. Restoring from nothing is
the one failure this stack cannot recover from on its own.

---

## Notes and known gaps

- **`RUN_SEED=true` stays set** across re-deploys. The seed is written to skip an admin that
  already exists, so it will not reset a changed password — but it does run on every boot.
- **No healthcheck on `web`.** Compose will restart a crashed container but cannot detect one
  that is running yet failing requests.
- **Secrets live only in `.env` on the server.** They are generated, not stored anywhere else.
  If that file is lost, sessions break (`AUTH_SECRET`) and the database becomes unreachable
  (`POSTGRES_PASSWORD`). Back it up somewhere safe, separately from the database dump.
- **The repo currently has no CI.** Pushing to GitHub deploys nothing; a deploy is always the
  manual `./deploy.sh` above.
