# ClearStock Ghana — Admin Dashboard

Staff web app for reviewing seller verifications, moderating listings, handling
reports and managing admin accounts. React + TypeScript, built with Vite.

Separate from the mobile app on purpose: admins sign in with an **email and
password**, traders sign in with a **phone number and PIN**, and they are
different tables in the database.

## Running it

```bash
cd admin
npm install
npm run dev
```

Opens on http://localhost:5173 and talks to the deployed backend by default.
To point somewhere else, copy `.env.example` to `.env` and set
`VITE_API_BASE_URL`.

## Creating the first admin

There is no sign-up screen — that would let anybody make themselves an admin.
The first account is seeded by the backend on boot from environment variables.

In the Render dashboard, on the backend service, add:

| Variable | Value |
|---|---|
| `SUPER_ADMIN_EMAIL` | the email the super admin will sign in with |
| `SUPER_ADMIN_PASSWORD` | a strong password — set it here, nowhere else |
| `SUPER_ADMIN_NAME` | the person's name, shown in the sidebar |

Restart the service. On boot it creates the super admin if one does not exist
already. It never overwrites an existing account, so changing these later will
not reset anyone's password — and the password never appears in the code, in
git, or in a SQL script.

The super admin then creates everyone else from the **Admins** screen.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, import the repo and set the **root directory** to `admin`.
3. Add an environment variable `VITE_API_BASE_URL` =
   `https://clearstock-ghana.onrender.com`.
4. Deploy. You get a URL like `clearstock-admin.vercel.app`.
5. **Then add that URL to the backend**, or every request will be blocked by
   the browser: set `ADMIN_CORS_ORIGINS` on the Render service to
   `https://<your-app>.vercel.app` and restart.

Step 5 is easy to forget and the failure looks like a mysterious network error
rather than a permissions problem.

`vercel.json` already routes every path back to `index.html`, which a
single-page app needs — without it, refreshing on `/users` would 404.

## Roles

- **Admin** — verifications, users, listings, reports, audit logs.
- **Super admin** — all of the above, plus the Admins screen.

The Admins nav item is hidden from ordinary admins, and the server independently
rejects them: hiding a link is not access control.

## What every action records

Approving, rejecting, suspending, archiving, dismissing and admin management all
write to the audit log with who did it, what they did it to, and the reason.
The **Audit logs** screen shows the last 200, filterable by type and by admin.
