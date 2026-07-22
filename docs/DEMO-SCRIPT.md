# Demo Script

A walkthrough for presenting ClearStock Ghana. Roughly 10-12 minutes.

Two things to show: the **phone app** for buyers and sellers, and the **admin
dashboard** at https://clearstock-admin.vercel.app for staff. Have both ready.

## Before you start

**Wake the backend.** Open the app or the dashboard 2-3 minutes before you
present. Render's free tier sleeps after 15 minutes idle and the first request
takes 30-60 seconds. A cold start during a live demo looks like a broken app.

Checklist:

- [ ] Backend awake (open the dashboard and let the stats load)
- [ ] Phone charged, screen timeout set long, notifications silenced
- [ ] Signed out on the phone, so you can show the guest experience first
- [ ] Dashboard already signed in on the laptop, on the Verifications tab
- [ ] A second account ready if you want to show buyer and seller live
- [ ] At least one active listing, one pending purchase request, one completed
      transaction — so no screen is empty
- [ ] **One seller with verification pending**, so there is something real to
      approve in front of the room
- [ ] Screen mirroring tested for both the phone and the laptop

**Have a fallback.** If the network fails, screenshots of each step below will
save the presentation.

---

## 1. The problem (30 seconds, before touching the phone)

Traders carrying stock that is near expiry face a choice: sell it fast at a
discount, or write it off. There is no organised way to reach buyers quickly, so
a lot of it becomes waste — lost income for the trader and lost food.

ClearStock connects that surplus stock to buyers looking for a discount, before
the deadline passes.

## 2. Guest browsing — no account needed

Open the app cold.

- The home screen shows real listings **without signing in**. Lowering the
  barrier matters: a trader who must create an account before seeing anything
  will not bother.
- Point out a listing where the price is **red** — that means urgent: expiry
  within 21 days, or clearance ending within 3 days. Ordinary prices are black.
  Colour carries meaning rather than decoration.
- Show the stock bar on a low-stock listing.
- Tap **Buy** or **Message**. The app prompts sign-in. Browsing is free; acting
  requires an account.

## 3. Sign up

- Enter a phone number. Any common Ghanaian format works — `0244…`, `+233244…`
  or `233244…` all resolve to the same account. Mention this: it was a real bug,
  where people could not log back in because sign-up and login disagreed about
  the format.
- Receive the OTP by SMS, verify, create a PIN.
- You land on profile setup, where the name is captured — so buyers and sellers
  see a person, not a phone number.

> **If asked about email OTP:** it is implemented, but Render's free tier blocks
> outbound SMTP, so email delivery fails from the deployed server. SMS works.
> Being straight about this is better than having it fail on stage.

## 4. Buying

- Browse or search. Show the filters.
- Open a listing: photos, price, discount, expiry, seller, rating.
- Send a **purchase request** with a quantity. Note the seller's phone number is
  **not** shown yet — contact details are only revealed once the seller accepts.
  That is deliberate privacy design.
- Show the chat. Point out the **quick replies**: one-tap messages so a user who
  is not comfortable typing English can still negotiate. This came from thinking
  about who actually uses the app.

## 5. Selling — switch modes

From the profile, **Switch to Seller Mode**. Same account, different mode.

- **Dashboard**: active listings, incoming requests, recovery figures.
- **Create a listing**: photos, price, quantity, expiry date, and the automatic
  discount schedule — the price steps down as expiry approaches, without the
  seller having to do anything.
- **Incoming requests**: accept or decline. Declining opens a chat with the
  buyer, so it is a conversation rather than a silent rejection.

## 6. Money

Open **Earnings**. This is the part most marketplace demos skip.

- Money is held until the buyer confirms collection, so earnings show **held**
  and **cleared** separately rather than one misleading total.
- ClearStock deducts **7% commission**, shown explicitly. The seller sees what
  they will actually receive.

> **Be honest if asked:** payouts are calculated but not yet automated. The
> transfer is manual, and `paidOut` currently reads zero.

## 7. Trust and verification

Open **Profile → Verification**.

- A seller submits their Ghana Card number and a photo, plus optional business
  registration. The shop moves to **Under review**.
- Buyers see a verified badge, so they know who they are dealing with.
- Sellers can trade before verifying — you do not block someone from earning
  while paperwork is pending — but verification is always reachable afterwards.

## 8. The admin dashboard — the other half of trust

Switch to the laptop: **https://clearstock-admin.vercel.app**

This is a separate web app, not part of the phone app. Staff sign in with an
email and a password; traders sign in with a phone number and a PIN. They are
different tables in the database, so a trader can never reach it.

Show these three, in this order:

**Verifications** → open the application the seller just submitted. The Ghana
Card photo and number are there. Approve it.

**Then switch back to the phone.** The seller now has a notification saying
their shop is verified, and a buyer opening one of their listings sees the
verified badge next to the seller's name. That loop — submit, review, approve,
notify — is the single strongest thing to demonstrate.

**Payments** → the escrow position: money held, money released, ClearStock's
7% commission, and what sellers are owed. This is where "how does the money
work" gets a concrete answer rather than a diagram.

**Audit logs** → every admin action, who did it and why. Say why this exists:
a tool that can suspend somebody's livelihood needs to be answerable.

> **Be honest if asked:** payouts are still settled manually. The dashboard
> shows what is owed, not what has been sent.

## 9. Impact — close here

Open **Recovery Impact**. Cedis recovered, goods rescued, waste avoided.

This is the argument for the whole project: every completed transaction is stock
that earned money instead of becoming waste. Close on this number rather than on
a feature.

---

## Likely questions

**How do you make money?** 7% commission on each completed sale, deducted before
the seller is paid. Visible in the earnings screen.

**What stops fake sellers?** Ghana Card verification, reviewed by staff in the
admin dashboard, with a visible badge on the seller's shop and every listing.
Plus ratings and reviews tied to completed transactions, and reporting with a
moderation queue behind it.

**Why can't buyers see phone numbers immediately?** Privacy. Contact details are
released only after the seller accepts a request, which also stops sellers being
harvested for their numbers.

**What if the buyer never collects?** Money stays held. It only clears when
collection is confirmed by OTP, and evidence can be attached to a transaction.

**How does the discount work?** The seller sets a schedule when listing — a
percentage step and an interval. The price falls automatically as expiry nears,
so stock keeps moving without the seller monitoring it.

**Does it work offline?** No. It needs a connection.

**Who reviews the verifications?** Staff, in the admin dashboard. There are two
roles: an admin handles verifications, users, listings and reports; a super
admin also creates and disables other admin accounts. Every action is recorded
in the audit log.

**What would you build next?** In order: automated seller payouts, push
notifications on the phone, and email delivery (blocked today by the free
hosting tier, which does not allow outbound mail).

**What was the hardest part?** Worth answering concretely — the phone number
format bug, or the database schema constraint that broke listing creation in
production three times. Specific beats vague.
