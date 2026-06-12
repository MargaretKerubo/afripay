# ✅ AfriPay — Acceptance Criteria

## MVP Scope

This document defines the pass/fail acceptance criteria for AfriPay's MVP features.

---

## 1. Authentication

| ID | Criteria | Pass Condition |
|----|----------|----------------|
| AC-01 | User can register with email and password | Account is created; JWT token returned |
| AC-02 | User can log in with valid credentials | JWT token returned; user redirected to dashboard |
| AC-03 | Invalid credentials are rejected | 401 response with error message |
| AC-04 | Protected routes require valid JWT | Requests without valid token return 401 |
| AC-05 | Tokens expire after defined TTL | Expired tokens are rejected |

---

## 2. Wallet Management

| ID | Criteria | Pass Condition |
|----|----------|----------------|
| AC-06 | Each user has a Lightning wallet on registration | Wallet record created in DB with LND node association |
| AC-07 | User can view their wallet balance in satoshis | Balance displayed correctly on dashboard |
| AC-08 | Balance is displayed with fiat equivalent | KES/UGX/TZS value shown alongside BTC/sats |
| AC-09 | Fiat conversion uses live CoinGecko rates | Rate fetched within last 60 seconds |

---

## 3. Send Payment (Lightning)

| ID | Criteria | Pass Condition |
|----|----------|----------------|
| AC-10 | User can enter a recipient and payment amount | UI accepts both user ID and amount fields |
| AC-11 | Amount can be entered in fiat and auto-converted to sats | Conversion is accurate to current BTC price |
| AC-12 | System generates a Lightning invoice | Valid BOLT11 invoice returned from LND |
| AC-13 | Payment is sent via Lightning Network | LND reports payment as settled |
| AC-14 | Sender balance is debited correctly | Balance reflects deduction after payment |
| AC-15 | Recipient balance is credited correctly | Recipient balance increases by correct sats amount |
| AC-16 | Transaction is recorded in the database | Payment record saved with timestamp, amount, and status |
| AC-17 | Payment confirmation is shown to sender | UI displays success state with transaction ID |

---

## 4. Receive Payment

| ID | Criteria | Pass Condition |
|----|----------|----------------|
| AC-18 | User can generate a Lightning invoice | BOLT11 invoice displayed as text and QR code |
| AC-19 | Invoice includes correct amount when specified | Invoice amount matches user input |
| AC-20 | Invoice can be copied to clipboard | Clipboard copy action works in browser |
| AC-21 | Received payment updates balance automatically | Balance reflects incoming payment within 5 seconds |

---

## 5. Transaction History

| ID | Criteria | Pass Condition |
|----|----------|----------------|
| AC-22 | User can view all past transactions | List shows sent and received payments |
| AC-23 | Each transaction shows amount, date, direction, and status | All four fields present and accurate |
| AC-24 | Fiat equivalent shown at time of transaction | Correct fiat value displayed per transaction |

---

## 6. Escrow Trade System

| ID | Criteria | Pass Condition |
|----|----------|----------------|
| AC-25 | Buyer can initiate a trade and lock funds into escrow | Funds deducted from buyer; escrow status = "Locked" |
| AC-26 | Seller can view active escrow trade | Trade visible in seller's dashboard |
| AC-27 | Arbitrator can view active escrow trade | Trade visible in arbitrator's dashboard |
| AC-28 | Any 2-of-3 parties can approve fund release | 2 approvals trigger fund transfer to seller |
| AC-29 | Trade status updates reflect correctly | Status transitions: Pending → Locked → Released / Disputed |
| AC-30 | Escrow transaction is logged | Full escrow lifecycle recorded in DB |

---

## 7. Currency & Exchange Rates

| ID | Criteria | Pass Condition |
|----|----------|----------------|
| AC-31 | KES, UGX, and TZS conversion rates are available | All three currencies display current rates |
| AC-32 | Rates refresh at a defined interval | API call made at least once per minute |
| AC-33 | Stale rate fallback is handled gracefully | Error state shown if CoinGecko unreachable |

---

## 8. UI & UX

| ID | Criteria | Pass Condition |
|----|----------|----------------|
| AC-34 | App is responsive on mobile and desktop | No layout breakage at 375px or 1280px widths |
| AC-35 | Loading states are shown during async operations | Spinner or skeleton visible during API calls |
| AC-36 | Error messages are user-friendly | No raw error codes shown to the user |
| AC-37 | User can toggle between BTC/sats and fiat view | Toggle updates all displayed amounts |

---

## 9. Non-Functional Requirements

| ID | Criteria | Pass Condition |
|----|----------|----------------|
| AC-38 | API responds within 2 seconds under normal load | 95th percentile response time < 2s |
| AC-39 | All passwords are hashed | bcrypt or equivalent used; plaintext never stored |
| AC-40 | Environment secrets are not hardcoded | No API keys or passwords in source code |

---

*Last updated: June 2026 | AfriPay MVP v1.0*
