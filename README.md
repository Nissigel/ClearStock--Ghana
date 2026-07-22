# ClearStock Ghana

A marketplace for surplus and near-expiry stock. Ghanaian traders lose money when
goods pass their sell-by window; ClearStock lets a seller list that stock at a
discount, and lets buyers find it before it becomes waste.

The app has two modes in one account. The same person can browse and buy as a
buyer, then switch to seller mode to list their own stock.

## What's in this repository

| Path | What it is |
|---|---|
| `app/` | Screens, routed by file path via expo-router |
| `src/` | Components, API clients, stores, hooks, types, theme |
| `assets/` | Icons, splash, onboarding images; `brand/` holds the shareable logo files |
| `admin/` | Admin dashboard — React + Vite web app for staff |
| `backend/` | Spring Boot API (lives on the `dev` branch) |
| `docs/` | Architecture, API reference, demo script |

Branches: the mobile app is developed on `sdk54-downgrade`, the backend on `dev`.

## Running the app

Requires Node 18+ and the Expo Go app on an Android phone.

```bash
npm install
npm start
```

Scan the QR code with Expo Go. The app talks to the deployed backend by default,
so you do not need to run the backend to use it.

**First request after an idle period is slow.** The backend is on Render's free
tier, which sleeps after about 15 minutes of no traffic and takes 30-60 seconds
to wake. The client timeout is set to 120 seconds for this reason — a slow login
is usually a cold start, not a failure.

## Running the backend

Only needed if you are changing the API.

```bash
cd backend
export JAVA_HOME="C:/Users/NISSIGEL/.jdks/ms-25.0.3"   # adjust to your JDK 21+
./mvnw spring-boot:run
```

The backend reads its secrets from environment variables. Nothing sensitive
should be committed — see the table below.

| Variable | Purpose | Required |
|---|---|---|
| `DB_URL` | Postgres connection string (Neon) | Has a default |
| `DB_USERNAME` | Database user | Has a default |
| `DB_PASSWORD` | Database password | **Yes** |
| `JWT_SECRET` | Signing key for auth tokens | **Yes** |
| `MAIL_USERNAME` | Gmail account for email OTP | Has a default |
| `MAIL_PASSWORD` | Gmail app password | **Yes** |
| `PAYSTACK_SECRET_KEY` | Payment processing | **Yes** |
| `ARKESEL_API_KEY` | SMS OTP delivery | Optional |
| `ARKESEL_SENDER_ID` | SMS sender name | Optional |

Frontend configuration lives in `src/config/env.ts` — the API base URL and the
Cloudinary upload credentials used for listing and document photos.

## Building the APK

Builds run on Expo's servers, not locally:

```bash
npx eas-cli build --platform android --profile preview
```

The `preview` profile produces an installable APK. `production` produces an app
bundle for the Play Store. When the build finishes, EAS prints a download link.

The APK is around 87 MB. Most of that is native libraries for four CPU
architectures bundled into one file. Code and resource shrinking (R8) is enabled
in `app.json`; it saves roughly 10%. Shipping a single architecture would save
much more but would refuse to install on older 32-bit phones.

## Known limitations

These are real and worth being honest about rather than discovering during a demo.

- **Seller payouts are not automated.** The earnings screen calculates what a
  seller is owed after ClearStock's 7% commission, but the actual transfer is
  manual. `paidOut` is always zero.
- **Admin payouts are recorded, not sent.** The Payments screen shows the escrow
  position and what each seller is owed, but no money moves through it.
- **Email OTP does not send from the deployed backend.** Render's free tier
  blocks outbound SMTP. The credentials are correct; the connection times out.
  SMS OTP via Arkesel works when `ARKESEL_API_KEY` is set.
- **The database schema is managed by Hibernate `ddl-auto=update`.** It adds
  columns but never relaxes existing constraints, which has caused production
  failures before. New columns must be nullable.
- **Secrets were committed to git history** early in the project and the
  database password has not yet been rotated.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — how the system fits together and why
- [API reference](docs/API.md) — every endpoint
- [Demo script](docs/DEMO-SCRIPT.md) — walkthrough for the presentation
- [Admin dashboard](admin/README.md) — running it, and creating the first admin
