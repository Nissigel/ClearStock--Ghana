# Architecture

## Shape of the system

```
Expo / React Native app  ──HTTPS──>  Spring Boot API  ──JDBC──>  Postgres (Neon)
                                            │
                                            ├──>  Paystack   (payments)
                                            ├──>  Arkesel    (SMS OTP)
                                            └──>  Gmail SMTP (email OTP)

        └──────────────────────────>  Cloudinary  (image hosting, direct upload)
```

Images do not pass through the backend. The app uploads straight to Cloudinary
with an unsigned preset and sends the resulting URL to the API. That keeps
image traffic off the free-tier server, which is slow and memory-limited.

## Mobile app

**Expo SDK 54, React Native 0.81, expo-router.**

Routing is by file path. The route groups carry the app's structure:

| Group | Who sees it |
|---|---|
| `app/(guest)/` | Anyone, before signing in — browse listings, onboarding |
| `app/(auth)/` | Phone entry, OTP, PIN creation, login |
| `app/(buyer)/` | Signed-in buyer: home, search, orders, chat, profile |
| `app/(seller)/` | Seller mode: dashboard, listings, requests, earnings |

Guests can browse freely. The gate is on the first real action — tapping buy or
message calls `handleRestrictedAction`, which prompts sign-in. Guests never see
the tab bar; that was a bug once, where pushing a tab route trapped them inside
the tab navigator.

**State** is split by lifetime:

- **React Query** owns anything from the server. Note that React Native does not
  refetch on window focus the way the web does, so screens that must be fresh
  use `refetchOnMount: 'always'` or `useFocusEffect`.
- **Zustand** owns local state: `authStore` (user, token, seller profile),
  `themeStore`, `modeStore` (buyer vs seller), `listingFilterStore`.

`authStore` is deliberately **not persisted**. That means a restart clears it,
so screens must not assume a field is populated — the seller profile tab fetches
the profile rather than trusting the store, otherwise a verified seller would be
told they were unverified.

**Theming** goes through `useTheme()` and the tokens in `src/constants/theme.ts`.
Components read `colors.*` rather than literal hex, so light and dark both work.
The brand green band (`BrandHeader`) is shared across home, search, messages and
orders so they stay uniform.

## Backend

**Spring Boot 3.5, JPA/Hibernate, Postgres, JWT auth.**

Packages are organised by feature, not by layer — `listings/`, `transactions/`,
`messaging/`, `seller/`, `user/`, `notifications/`, `reports/`. Each holds its
own entity, repository, service, controller and DTOs.

Entities: `User`, `SellerProfile`, `Listing`, `SavedListing`, `DealAlert`,
`PurchaseRequest`, `Transaction`, `TransactionEvidence`, `Review`,
`Conversation`, `Message`, `Notification`, `Report`, `OtpRecord`.

### Schema management is the main constraint

`spring.jpa.hibernate.ddl-auto=update` adds new columns automatically but will
**never relax an existing constraint**. Postgres also cannot add a `NOT NULL`
column to a table that already has rows.

This has broken production three separate times. The rule that came out of it:

> Every new column must be nullable. If an old column has a `NOT NULL` that no
> longer makes sense, drop the constraint explicitly at boot.

`ListingSchemaFix` does exactly that for three legacy listing columns, which had
been making every listing creation fail with a 500 when auto-discount was off.

## Decisions worth explaining

**Phone numbers are canonicalised to `0XXXXXXXXX`.** Ghanaian numbers get typed
as `0244…`, `+233244…` or `233244…`, and the same person was failing to log in
because sign-up stored one form and login looked up another. `PhoneUtil.normalize`
strips to digits, drops a leading `233`, and restores the leading zero.
`PhoneNumberCanonicalizer` rewrote the existing rows on boot, skipping collisions.

**Commission is deducted before the seller sees a figure.** ClearStock keeps 7%.
`SellerService` holds the rate in one constant and derives both held and cleared
buckets from it, so gross and net can never drift apart in the UI.

**Money clears in two stages.** A buyer's payment is held until they confirm
collection. Earnings therefore show *held* (paid but not yet collected) and
*cleared* (completed) separately, rather than one misleading total.

**Verification is its own endpoint, not part of the profile update.** Editing a
shop name should not send the shop back for review, and submitting identity
documents should not be able to quietly change the business details behind them.

**Ratings key on user id, not seller-profile id.** They are different numbers.
Confusing them made a buyer tapping one seller land on a different seller's
profile, showing listings that were not theirs.

## Recurring failure patterns

Three classes of bug accounted for most of the debugging on this project. They
are worth naming because they will recur.

1. **Contract gaps.** The app invented fallbacks for data the backend never
   sent — the inbox showed raw phone numbers and "No messages yet" because
   `ConversationResponse` only carried ids. The fix is always to send the data,
   not to improve the fallback.
2. **Schema updates against a populated live database.** See above.
3. **Duplicated UI drifting apart.** Two card components needed the same fix
   twice. `BrandHeader`, `QuickReplies` and `isListingUrgent` were extracted so
   the third time would only need fixing once.

A fourth, specific to Android: **custom fonts carry no weights.** Each weight is
a separate font file, `textDecorationLine` is dropped when a custom `fontFamily`
is applied, and a text run containing one uncommon glyph can be rendered
entirely by a fallback font. `Typography` maps `fontWeight` onto the right Inter
file to work around the first of these.
