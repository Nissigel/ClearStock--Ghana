# Backend environment variables

Secrets are **not** committed. `application.properties` reads them from the
environment. Set these on Render (Dashboard → the service → Environment) and,
for local runs, in your IDE run configuration or a local override file
(`application-local.properties`, which is git-ignored).

## Required (the app will not start without these)

| Variable              | What it is                                   |
|-----------------------|----------------------------------------------|
| `DB_PASSWORD`         | Neon PostgreSQL password                     |
| `JWT_SECRET`          | Signing secret for auth tokens (any long random string) |
| `MAIL_PASSWORD`       | Gmail app password for the SMTP sender       |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (`sk_test_…` / `sk_live_…`) |

## Optional (have sensible defaults)

| Variable            | Default                                  | Purpose |
|---------------------|------------------------------------------|---------|
| `DB_URL`            | the Neon JDBC URL in `application.properties` | Override the database URL |
| `DB_USERNAME`       | `neondb_owner`                            | Database user |
| `MAIL_USERNAME`     | `clearstock101@gmail.com`                 | SMTP sender address |
| `ARKESEL_API_KEY`   | *(unset → SMS disabled)*                  | Enables real SMS OTPs (see below) |
| `ARKESEL_SENDER_ID` | `ClearStock`                              | Registered SMS sender ID |

> ⚠️ The previous values of the required secrets were committed to git history,
> so they are considered compromised. **Rotate each one** in its provider
> dashboard and set the new value as the env var above.
