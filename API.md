# GivTrade Management API (v1)

Read-only access to deposit transactions for your CRM / FXBO integration.

- **Base URL:** `https://deposit.giv.trade`
- **Auth:** `Authorization: Bearer <API_KEY>` (create/revoke keys in Admin → **API Keys**)
- **Format:** JSON · all timestamps are **UTC** (ISO-8601, `Z`)
- **Access:** read-only (no writes possible with these keys)

---

## GET /api/v1/transactions

List deposit transactions, newest first.

### Query parameters

| Param | Type | Notes |
|---|---|---|
| `from` | ISO date/datetime | Filter on **created** date, inclusive. e.g. `2026-11-01` |
| `to` | ISO date/datetime | Filter on created date, inclusive. Max range **92 days** |
| `status` | string | Comma-separated. One or more of the statuses below |
| `limit` | int | 1–100, default **50** |
| `cursor` | string | `next_cursor` from the previous page |

### Status values

| `status` | Meaning | `paid` | `credited` |
|---|---|---|---|
| `pending` | Awaiting payment | false | false |
| `processing` | Paid on the PSP, crediting to MT5 | **true** | false |
| `completed` | Paid **and** credited to the MT5 account | **true** | **true** |
| `credit_failed` | Paid, but MT5 crediting failed (needs attention) | **true** | false |
| `failed` | Payment failed / expired | false | false |

### Response

```json
{
  "data": [
    {
      "id": "cmr2ap...",
      "reference": "PSP-C5340D60",
      "mt5_account": "210553",
      "amount": 250.0,
      "fee": 0.0,
      "currency": "USD",
      "status": "completed",
      "paid": true,
      "credited": true,
      "whish_payment_id": "8782831482",
      "mt5_deal_id": "123456",
      "created_at": "2026-11-16T10:00:00.000Z",
      "updated_at": "2026-11-16T10:00:12.000Z"
    }
  ],
  "page": { "limit": 50, "has_more": true, "next_cursor": "cmr2ap..." }
}
```

### Paging

Pass the previous response's `next_cursor` back as `cursor` until `has_more` is `false`:

```
GET /api/v1/transactions?limit=100
GET /api/v1/transactions?limit=100&cursor=<next_cursor>
```

Cursor paging is stable — rows won't be skipped or duplicated if data changes mid-sync.

---

## Examples

```bash
# Completed deposits in November
curl -H "Authorization: Bearer $KEY" \
  "https://deposit.giv.trade/api/v1/transactions?status=completed&from=2026-11-01&to=2026-11-30"

# Everything still in progress or needing attention
curl -H "Authorization: Bearer $KEY" \
  "https://deposit.giv.trade/api/v1/transactions?status=processing,credit_failed"
```

---

## Errors

| HTTP | When |
|---|---|
| `400` | Bad `status`, bad date, or range > 92 days (message explains) |
| `401` | Missing, invalid, or revoked key |
| `429` | Rate limit or too many concurrent requests — see `Retry-After` |

## Rate limits

Per key (defaults; tunable server-side via `API_RATE_RPM` / `API_MAX_CONCURRENT`):

- **60 requests / minute**
- **5 concurrent requests**

Every response includes `X-RateLimit-Limit` and `X-RateLimit-Remaining`. On `429`, wait the seconds in `Retry-After`. Prefer **paging through once** over many parallel calls.

## Security notes

- Keys are stored only as a SHA-256 hash — the plaintext is shown **once** at creation.
- Revoking a key in the admin takes effect immediately.
- Always call over HTTPS; never embed a key in client-side/browser code.
