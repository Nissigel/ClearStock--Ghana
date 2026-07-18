# API Reference

Base URL: `https://clearstock-ghana.onrender.com`

All responses are wrapped:

```json
{ "success": true, "message": "…", "data": { } }
```

Every endpoint except `/auth/*` requires `Authorization: Bearer <token>`.
Tokens are JWTs valid for 24 hours.

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
