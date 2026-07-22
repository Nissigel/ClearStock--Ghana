# ClearStock Ghana — Frontend↔Backend Integration Audit

Backend: `https://clearstock-ghana.onrender.com` (Spring Boot, branch `dev`)
Frontend: `feature/frontend` branch (Expo SDK 54 after downgrade)
All backend responses: `{ success, message, data }` — frontend already reads `response.data.data` correctly. ✅
Auth: `Authorization: Bearer <token>` — frontend axios interceptor already does this. ✅

## Step 0 — Config (verify first)
- `src/config/env.ts` has `API_BASE_URL: 'http://localhost:8080/api/v1'`.
- The backend repo code has NO `/api/v1` prefix in controllers. Check `application.properties`
  (local, gitignored) for `server.servlet.context-path`. If not set, the correct base URL is
  `https://clearstock-ghana.onrender.com` with NO `/api/v1` suffix.
- Change `API_BASE_URL` accordingly and set `USE_MOCK: false` (do this LAST, after path fixes).

## Path mismatches to fix in frontend (frontend → correct backend endpoint)

1. **Archive listing** — frontend: `POST /listings/{id}/archive`
   → backend has no archive endpoint. Use `DELETE /listings/{id}` (soft-behavior per backend),
   or remove the archive action from UI if delete semantics don't fit.

2. **Seller incoming requests** — frontend: `GET /seller/purchase-requests`
   → backend: `GET /purchase-requests/incoming`

3. **Accept/decline purchase request** — frontend: `POST /seller/purchase-requests/{id}/{action}`
   → backend has NO accept endpoint. Decline = `PUT /purchase-requests/{id}/decline`.
   **Accept = `POST /transactions`** with the purchase request info (this creates the transaction —
   that IS the accept flow by design). Split the frontend function into two.

4. **Seller transactions list** — frontend: `GET /seller/transactions`
   → backend: `GET /transactions` (role-aware; returns the caller's transactions).

5. **Update transaction status** — frontend: `PUT /seller/transactions/{id}/status`
   → backend: `PUT /transactions/{id}/status`, and the request body field is
   **`transactionStatus`** (not `status`). Status order enforced by backend:
   payment must be `PAYMENT_SUCCESSFUL` before `READY_FOR_COLLECTION`;
   `POST /transactions/{id}/verify-otp` completes the transaction.

6. **Seller rating** — frontend: `GET /sellers/{sellerId}/rating`
   → backend: `GET /seller/{sellerId}/rating` (singular `seller`).

7. **Seller reviews** — frontend: `GET /sellers/{sellerId}/reviews`
   → backend: `GET /reviews/user/{userId}` (reviews are keyed by user, not seller).
   Check what ID the screen has available and map accordingly.

8. **Send message** — frontend: `POST /conversations/{conversationId}/messages`
   → backend: `POST /messages` with `conversationId` in the request body.
   (`GET /conversations/{id}/messages` is correct as-is.)

## Backend endpoints the frontend never calls (screens exist — wire them up)
- `POST /auth/forgot-pin` (forgot-pin screen exists — verify it calls this, not reset-pin directly)
- `POST /seller/become` (become-seller screen)
- `GET/PUT /seller/profile` (seller-profile screen)
- `GET /seller/recovery-dashboard` (seller dashboard screen)
- `PUT /user/profile`, `PUT /user/email`, `PUT /user/notifications` (edit-profile, notification-preferences screens)
- `POST/GET/PUT/DELETE /deal-alerts` (deal-alerts screen)
- `POST /conversations` and `GET /conversations/listing/{listingId}` (starting a chat from a listing)
- `POST /transactions/{id}/evidence`
- `GET /listings/urgent` (could power the "Flash Deals Ending Soon" banner)

## Response-shape verification checklist (compare TS types vs Java DTOs)
For each of these, confirm field names in `src/types/*.ts` match the backend DTO JSON:
- AuthResponse: frontend expects `data.tempToken` from verify-otp, and token fields from login/create-pin
- Listing fields (price/discount naming, expiry date field, urgencyScore, seller info nesting)
- PurchaseRequest, Transaction (esp. status enum values), Conversation/Message, Notification

## Test accounts (against live backend)
- Seller: `0244000003` / PIN `1234` (userId 6, sellerId 5)
- Buyer: `0244000010` / PIN `1234` (userId 12)

## Recommended order
1. Fix the 8 path mismatches (mocks still on — nothing breaks).
2. Verify base URL / context path; set `API_BASE_URL` to the live Render URL.
3. Flip `USE_MOCK: false` for AUTH ONLY first if possible; test login with the seller account.
4. Flip remaining mocks off; walk the full flow: browse → purchase request → seller accepts
   (POST /transactions) → payment (Paystack sandbox) → status updates → collection OTP → review.
5. Fix type/shape mismatches as they surface (watch Metro logs and network errors).
