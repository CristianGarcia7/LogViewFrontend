# Stats Endpoint Spec — request for Backend

The frontend now renders a log **Overview** (status distribution, requests-over-time,
top paths, summary cards) computed **client-side from the loaded log window** (the
last N lines fetched from `GET /logs`).

That is enough to ship, but it has one honest limitation: the charts only reflect the
lines currently loaded, **not the full history**. To get accurate metrics over a real
time range (e.g. "last 24h"), we need the backend to aggregate server-side.

This document specifies the endpoint we'd like. The response shape is intentionally
aligned with the frontend's existing types (`src/lib/logStats.ts`) so the UI can swap
its data source with near-zero rework.

---

## Endpoint

```
GET /logs/stats
```

### Query parameters

| Param       | Type     | Required | Notes                                                        |
|-------------|----------|----------|--------------------------------------------------------------|
| `projectId` | string   | yes      | Same as `GET /logs` (UUID).                                  |
| `logType`   | enum     | yes      | `access` \| `error`.                                         |
| `range`     | enum     | no       | `1h` \| `6h` \| `24h` \| `7d`. Default `24h`.                |
| `text`      | string   | no       | Same free-text filter semantics as `GET /logs`.             |
| `statusCode`| string   | no       | Access logs only. Filter before aggregating.                 |
| `level`     | enum     | no       | Error logs only. `error`\|`warn`\|`notice`\|`info`.          |
| `buckets`   | number   | no       | Number of time buckets for the timeseries. Default `24`.    |

Auth: same Bearer token / project-access rules as `GET /logs`.

---

## Response — `200 OK`

```jsonc
{
  "range": "24h",
  "fetchedAt": "2026-06-26T22:00:00.000Z",

  // Headline numbers over the FULL range (not a sampled window)
  "summary": {
    "total": 48213,          // total lines matched
    "errorCount": 412,       // 5xx (access) | error-level (error logs)
    "errorRate": 0.0085,     // errorCount / total, 0..1
    "warnCount": 1320,       // 4xx (access) | warn-level (error logs)
    "uniquePaths": 173       // access logs only; 0 for error logs
  },

  // Status code distribution — access logs. Empty array for error logs.
  "statusDistribution": [
    { "key": "2xx", "label": "2xx Success",  "count": 45100, "tone": "ok" },
    { "key": "3xx", "label": "3xx Redirect", "count": 1381,  "tone": "info" },
    { "key": "4xx", "label": "4xx Client",   "count": 1320,  "tone": "warn" },
    { "key": "5xx", "label": "5xx Server",   "count": 412,   "tone": "error" }
  ],

  // Level distribution — error logs. Empty array for access logs.
  "levelDistribution": [
    { "key": "error",  "label": "Error",  "count": 412, "tone": "error" },
    { "key": "warn",   "label": "Warn",   "count": 980, "tone": "warn" },
    { "key": "notice", "label": "Notice", "count": 120, "tone": "info" },
    { "key": "info",   "label": "Info",   "count": 88,  "tone": "ok" }
  ],

  // Requests over time — ordered oldest → newest, length = `buckets`
  "timeseries": [
    { "label": "22:00", "count": 1820 },
    { "label": "23:00", "count": 1654 }
    // …
  ],

  // Top request paths — access logs. Empty array for error logs.
  "topPaths": [
    { "label": "/api/v1/users", "count": 8123 },
    { "label": "/health",       "count": 6500 }
  ]
}
```

### Field contract notes

- `tone` is a UI hint already understood by the frontend: `ok | info | warn | error | neutral`.
  If backend prefers not to emit it, the frontend can derive it from `key` — but emitting
  it keeps the client dumb. Either is fine; tell us which.
- `errorRate` is a fraction (0..1), not a percentage. The UI multiplies by 100.
- `timeseries` must be **pre-bucketed and ordered**; the UI does not re-bucket server data.
- Empty arrays (not `null`) for the dimensions that don't apply to the requested `logType`.

---

## Errors

Mirror `GET /logs` semantics so the existing error mapping keeps working:

| Status | Meaning (frontend message)                                  |
|--------|-------------------------------------------------------------|
| 403    | No access to this project's logs.                           |
| 404    | Project not found.                                          |
| 502    | Upstream log source failed while aggregating.               |
| 503    | Project server unreachable.                                 |
| 504    | Aggregation timed out (suggest a smaller range).            |

---

## Frontend integration (once this ships)

1. Add `getLogStats(params)` to `src/api/` returning the response above.
2. In `LogStatsPanel`, swap the `useMemo` over `logStats.ts` for the fetched payload —
   the segment/bucket/ranked-item shapes already match, so the chart components are untouched.
3. Keep the client-side compute as the fallback when the endpoint is unavailable
   (graceful degradation per the brand's 3-state rule).
