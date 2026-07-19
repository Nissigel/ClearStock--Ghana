# API Reference

Base URL: `https://clearstock-ghana.onrender.com`

All responses are wrapped:

```json
{ "success": true, "message": "…", "data": { } }
```

Most endpoints require `Authorization: Bearer <token>`. Tokens are JWTs valid
for 24 hours.

**Public, no token needed** — everything a guest sees while deciding whether to
sign up:

- `/auth/*`
- `GET /listings/**`
- `GET /seller/{id}/rating` and `GET /reviews/user/{id}` — a seller's rating is
  the main trust signal, so it must be readable before sign-up. Writing a
  review still needs an account.
- `/payments/*` (Paystack callbacks)

**Cold starts:** the first request after ~15 minutes of inactivity can take 30-60
seconds while Render wakes the server. This is not an error.

---

## Auth — `/auth`

| Method | Path | Purpose |
|---|---|---|
| POST | `/send-otp` | Send a one-time code to a phone or email |
| POST | `/verify-otp` | Exchange the code for a verification token |
| POST | `/create-pin` | Set the PIN and complete sign-up |
| POST | `/login` | Phone number + PIN, returns a JWT |
| POST | `/forgot-pin` | Start PIN recovery |
| POST | `/reset-pin` | Set a new PIN after recovery |

Phone numbers are accepted in any common Ghanaian format and normalised to
`0XXXXXXXXX` before lookup.

## User — `/user`

| Method | Path | Purpose |
|---|---|---|
| GET | `/profile` | The signed-in user |
| PUT | `/profile` | Update name, photo, region, city |
| PUT | `/email` | Change email address |
| PUT | `/notifications` | Notification preferences |
| PUT | `/pin` | Change PIN |
| PUT | `/phone` | Change phone number |

## Seller — `/seller`

| Method | Path | Purpose |
|---|---|---|
| POST | `/become` | Create a seller profile |
| GET | `/profile` | The signed-in user's shop (404 if they have none) |
| PUT | `/profile` | Update shop name, hub, description |
| POST | `/verification` | Submit identity documents for review |
| GET | `/earnings` | Held and cleared money, after 7% commission |
| GET | `/recovery-dashboard` | Waste-recovery impact figures |
| GET | `/{sellerId}/rating` | A seller's average rating |

`GET /profile` returning **404 is normal** for buyer-only accounts, not an error.

### `POST /seller/verification`

```json
{
  "ghanaCardNumber": "GHA-000000000-0",
  "ghanaCardPhotoUrl": "https://res.cloudinary.com/…",
  "businessRegUrl": "https://res.cloudinary.com/…"
}
```

`businessRegUrl` is optional — individual sellers have none. Submitting moves
the shop to `PENDING` and clears any previous rejection reason. Returns 400 if
the shop is already `VERIFIED`.

Statuses: `UNVERIFIED` → `PENDING` → `VERIFIED` or `REJECTED`. A rejected seller
can fix the problem and resubmit.

## Listings

| Method | Path | Purpose |
|---|---|---|
| POST | `/listings` | Create a listing |
| GET | `/listings` | Browse, with filters |
| GET | `/listings/urgent` | Listings nearing expiry |
| GET | `/listings/{id}` | One listing |
| PUT | `/listings/{id}` | Update |
| DELETE | `/listings/{id}` | Soft delete |
| DELETE | `/listings/{id}/permanent` | Hard delete |
| PUT | `/listings/{id}/repost` | Relist an expired listing |
| GET | `/seller/listings` | The signed-in seller's own listings |
| POST | `/listings/recalculate-urgency` | Recompute urgency flags |

A listing counts as urgent when expiry is 21 days away or less, or clearance
ends within 3 days, and it is still `ACTIVE`. The app applies the same rule
client-side in `src/utils/urgency.ts` to colour prices red.

## Saved listings & deal alerts

| Method | Path | Purpose |
|---|---|---|
| POST | `/saved-listings` | Save a listing |
| GET | `/saved-listings` | List saved |
| DELETE | `/saved-listings/{listingId}` | Unsave |
| POST | `/deal-alerts` | Create an alert |
| GET | `/deal-alerts` | List alerts |
| PUT | `/deal-alerts/{id}` | Update |
| DELETE | `/deal-alerts/{id}` | Delete |

## Purchase requests — `/purchase-requests`

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Buyer requests to buy |
| GET | `/` | Buyer's own requests |
| GET | `/incoming` | Seller's incoming requests |
| GET | `/{id}` | One request |
| PUT | `/{id}/cancel` | Buyer cancels |
| PUT | `/{id}/decline` | Seller declines |

Declining opens a conversation with the buyer, so the seller can explain rather
than leaving a silent rejection.

## Transactions — `/transactions`

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Create from an accepted request |
| GET | `/` | The user's transactions, as buyer or seller |
| GET | `/{id}` | One transaction |
| PUT | `/{id}/status` | Advance the status |
| POST | `/{id}/verify-otp` | Confirm collection with a code |
| POST | `/{id}/evidence` | Attach proof of handover |

## Payments — `/payments`

| Method | Path | Purpose |
|---|---|---|
| POST | `/initiate` | Start a Paystack payment |
| GET | `/verify/{reference}` | Verify by reference |
| GET | `/{transactionId}` | Payment state for a transaction |
| POST | `/webhook` | Paystack callback |

## Messaging

| Method | Path | Purpose |
|---|---|---|
| POST | `/conversations` | Start a conversation |
| GET | `/conversations` | Inbox |
| GET | `/conversations/listing/{listingId}` | Conversations about a listing |
| GET | `/conversations/{id}` | One conversation |
| DELETE | `/conversations/{id}` | Delete |
| POST | `/messages` | Send |
| GET | `/conversations/{id}/messages` | Message history |
| PUT | `/messages/{id}` | Edit |
| DELETE | `/messages/{id}` | Delete |

Conversations return the other party's **display name** — the shop name where
there is one, otherwise the person's name, never the raw phone number. A
seller's phone number is only revealed after a purchase request is accepted.

## Reviews — `/reviews`

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Leave a review for a completed transaction |
| GET | `/user/{userId}` | Reviews for a user |

Reviews key on **user id**, not seller-profile id.

## Notifications — `/notifications`

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | List |
| GET | `/unread-count` | Badge count |
| PUT | `/{id}/read` | Mark read |
| PUT | `/{id}/unread` | Mark unread |
| PUT | `/read-all` | Mark all read |

## Reports — `/reports`

| Method | Path | Purpose |
|---|---|---|
| POST | `/` | Report a listing or user |
| GET | `/` | List reports |

---

## Admin — `/admin`

Used only by the [admin dashboard](../admin/README.md). Staff authenticate
separately from traders: **email and password**, not phone and PIN, against the
`admins` table. The token carries a `purpose: ADMIN` claim, so a trader's token
can never reach these routes and vice versa.

Everything under `/admin` requires the `ADMIN` role. Everything under
`/admin/admins` additionally requires `SUPER_ADMIN`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Email + password, returns an admin JWT |
| GET | `/auth/me` | The signed-in admin (used to validate a stored token) |
| PUT | `/auth/password` | Change your own password |
| GET | `/stats` | Dashboard counters |
| GET | `/verifications` | Applications, optionally `?status=PENDING` |
| GET | `/verifications/{id}` | One application with its documents |
| PUT | `/verifications/{id}/approve` | Verify the shop |
| PUT | `/verifications/{id}/reject` | Reject — a reason is **required** |
| GET | `/users` | All accounts |
| PUT | `/users/{id}/suspend` | Suspend — blocks login |
| PUT | `/users/{id}/reactivate` | Restore access |
| GET | `/listings` | All listings |
| GET | `/listings/{id}` | One listing |
| PUT | `/listings/{id}/suspend` | Hide from the marketplace — reason required |
| PUT | `/listings/{id}/archive` | Archive |
| PUT | `/listings/{id}/restore` | Make active again |
| GET | `/payments` | Escrow totals and every payment |
| GET | `/reviews` | Every review left on the platform |
| GET | `/reports` | Complaint queue |
| GET | `/reports/{id}` | One complaint, with others about the same target |
| PUT | `/reports/{id}/action` | Mark resolved |
| PUT | `/reports/{id}/dismiss` | Close with no action |
| GET | `/audit-logs` | Last 200 admin actions |
| GET | `/admins` | Staff accounts *(super admin)* |
| POST | `/admins` | Create a staff account *(super admin)* |
| PUT | `/admins/{id}/disable` | Disable *(super admin)* |
| PUT | `/admins/{id}/enable` | Enable *(super admin)* |
| PUT | `/admins/{id}/role?role=` | Change role *(super admin)* |

### Escrow

`GET /admin/payments` returns each transaction with an `escrowState`:

| State | Meaning |
|---|---|
| `UNPAID` | The buyer has not paid |
| `HELD` | Paid, but the buyer has not confirmed collection — ClearStock holds it |
| `RELEASED` | Collection confirmed, owed to the seller less commission |
| `CANCELLED` | The transaction fell through |

Commission is 7%, shared with the seller earnings code so the two cannot drift
apart. Payouts are recorded, not sent — no money moves through this endpoint.

### Every action is audited

Approving, rejecting, suspending, archiving, dismissing and staff management all
write an audit entry with the admin, the target and the reason, and notify the
person affected.
