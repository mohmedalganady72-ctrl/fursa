# Platform audit - 2026-09-20

## Scope

This pass targets authentication/session handling, application integrity, opportunity discovery, profiles, messaging, and dashboard queries. It is not a guarantee that every workflow or external integration is free of defects. Changes are local and have not been deployed by this audit.

## Corrections

- Logout sends a nonempty JSON payload (`disableRedirect: true`). The sign-out endpoint rejected an empty request body with `Invalid JSON in request body`. The UI now provides an actionable Arabic error instead of exposing that response.
- Protected API routes use a shared session guard: JSON 401 for missing sessions, 403 for restricted accounts, and 503 for session infrastructure failure. Database details are not returned to clients by this guard.
- Session refresh reads the current database role as well as restriction state. Restricted administrators are redirected out of the admin layout.
- Email login normalizes email casing and surrounding whitespace. Role initialization has a bounded request timeout.
- Application creation, initial history, duplicate checks, and daily-limit checks share a transaction. Opportunity and applicant row locks serialize competing submissions. Daily limits use Riyadh's day boundary.
- Submission validates opportunity type, opening time, organization eligibility, required resumes, and resume path ownership.
- Opportunity discovery applies field filters, eligibility and date filters, actual application counts for popularity sorting, and deterministic ordering. Applicant results have previous/next pagination; malformed query filters fall back to defaults.
- Applicant profile and selected fields are saved atomically. Initial organization creation saves its logo and join request in the same transaction.
- A notification failure after saving a chat message no longer incorrectly reports the saved message as failed. Realtime events refresh authorized message data instead of treating raw database event fields as UI messages. Refresh requests are bounded to one in flight and cancelled on cleanup.
- Message reports verify conversation membership. Conversation creation validates identifiers and organization eligibility. Resume parsing rejects traversal paths and malformed request bodies.
- Admin trends aggregate counts in SQL instead of transferring individual application timestamps, using Riyadh date boundaries. No production performance benchmark has been claimed.

## Verification

- `npm test`: 27 tests passed across 6 files.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed, including all 41 static pages. A transient TLS network failure retried successfully during compilation.
- `npx playwright test tests/e2e/audit-regressions.spec.ts --project=chromium --retries=0`: 3 tests passed.
- Browser coverage checks private API JSON responses and actual admin logout, dashboard re-entry denial, and destination 401 after logout.
- Database coverage checks required/foreign resume rejection, opportunity type mismatch, and two simultaneous submissions resulting in exactly one application and one initial history record.
- Test cleanup closes test opportunities and restricts temporary accounts rather than deleting append-only audit history. Failed first-run fixtures were retired as well.

## Remaining verification and limitations

- Google/Firebase interactive sign-in, verification email delivery, SMS, and session persistence across browser restarts need separate end-to-end verification with controlled provider accounts.
- Vercel deployment, trusted origins, production cookies, and intermittent database connection resets need production logs and deployment verification. A single pool connection is not, by itself, evidence of a deadlock.
- Tests use the configured database. Use a dedicated test database for future runs; audit records are deliberately retained.
- Full visual/mobile regression, external notification delivery, scoring policy correctness, and durable notification retries are outside the verified coverage of this pass.
- Some handlers still need broader malformed-input tests. The shared session guard is not a replacement for route-specific authorization.
