# 04 · App Flow (sitemap, routes and user journeys)

---

## 1. Sitemap

```
jointlabourers.org
├── /                              Home
├── /about                         About: story, faith, leadership, accountability charter
├── /missionaries                  Adopt a Missionary: directory (filter by region)
│   └── /missionaries/[slug]       Missionary profile (alias if sensitive) + tiers + their open needs
├── /needs                         Missionary Needs Board (contributory)
│   ├── /needs/[code]              Need detail (e.g. /needs/JLN-0042)
│   └── /needs/fulfilled           Wall of met needs + updates (proof)
├── /pray                          Prayer Network: 4-hub clock, weekly grid, wall
│   ├── /pray/commit               Claim a prayer hour (step form)
│   ├── /pray/watches              Quarterly 3-hour watches
│   └── /pray/wall                 Prayer wall (+ submit a request)
├── /give                          Give / Partner (one-off · monthly · designation)
│   ├── /give/pledge/[ref]         Bank-transfer pledge page (details + reference)
│   └── /give/thank-you            Confirmation (polls payment status)
├── /transit-housing               Request a stay · Become a host
├── /gallery                       Albums & videos
│   └── /gallery/reports           Quarterly bulletins (PDF)
├── /contact                       Help desk
├── /privacy  /terms  /giving-policy
├── /manage/[token]                Magic-link page: manage recurring gift / prayer slot
├── /account                       Partner area (optional login)
│   ├── /account/giving            History, receipts, recurring gifts
│   ├── /account/needs             Needs I supported + updates
│   └── /account/prayer            My prayer hours
├── /login  /register  /forgot-password
└── /admin                         Staff dashboard (role-based)
    ├── /admin                     Overview: today's gifts, needs near deadline, prayer gaps, inbox
    ├── /admin/needs               List · create · review queue · [id] (edit, transitions, contributors, updates)
    ├── /admin/missionaries        List · [id] (profile, sensitive data, support target)
    ├── /admin/donations           All gifts · filters · export CSV
    ├── /admin/pledges             Awaiting transfer · reconcile (CSV upload / manual match)
    ├── /admin/recurring           Recurring partners · status
    ├── /admin/prayer              Coverage grid · commitments · requests (moderate) · watches · hub windows
    ├── /admin/housing             Requests · hosts · match
    ├── /admin/contact             Inbox by category
    ├── /admin/content             Pages blocks · impact stats · FAQs · "Where money goes"
    ├── /admin/gallery             Albums · media · reports
    ├── /admin/users               Staff & roles (super admin)
    └── /admin/settings            Currencies, tiers, bank accounts, gateways, prayer watch windows, audit log
```

## 2. Main navigation

**Header (desktop):** Logo · About · Missionaries · **Needs** · Pray · Transit Housing · Gallery · Contact · [**Give**] (primary button)
**Header (mobile):** Logo · [Give] · ☰ (drawer with the same links + Login)
**Sticky mobile bottom bar** on Needs and Missionary pages: "Give to this need".
**Footer:** Explore links · Get involved (Pray, Host, Volunteer) · Contact details (+234 806 141 2818, info@jointlabourers.org) · Socials · Legal · © JLICI.

## 3. Key user journeys

### J1 · First-time visitor → funds part of a need (main journey)

```mermaid
flowchart LR
  A[Lands on Home<br/>from WhatsApp share / Google] --> B[Featured needs strip]
  B --> C[/needs/JLN-0042<br/>story · progress 62% · 9 days left/]
  C --> D[Choose amount: ₦10k · ₦25k · 25% · Fund the remainder · Other]
  D --> E[Currency auto-detected<br/>NGN / USD / CAD / AUD …]
  E --> F[Details: name, email or WhatsApp,<br/>anonymous?, note/scripture, consent]
  F --> G{Payment method}
  G -->|Card / USSD / Mobile money| H[Gateway checkout] --> I[Thank you + share + "Pray for this missionary"]
  G -->|Bank transfer| J[Pledge page: account + reference JLN-0042-8F3K] --> K[Email copy · 7-day reminder] --> I
  I --> L[Later: email "Need met! See the update"]
```

**UX rules:** no more than 3 steps from the need page to payment. Name + one contact method are the only required fields. Show "₦X still needed" next to the amount input.

### J2 · Monthly partner (Adopt a Missionary)

Home → "Adopt a Missionary" → directory (filter: West Africa) → profile → choose **Silver ₦50,000 / month** → details → gateway (saves card for recurring) → thank-you → welcome email series (day 0 welcome, day 7 first prayer letter, monthly field update).

### J3 · Intercessor claims a prayer hour (any of the 4 hubs)

```mermaid
flowchart LR
  A[/pray: clock shows 'Lagos on watch · 2h 14m to New York'/] --> B[Weekly grid in my time zone<br/>auto-detected, can switch hub]
  B --> C[Tap empty (red) hour → Tue 07:00]
  C --> D[Name, email/WhatsApp, hub, weekly ✓]
  D --> E[Confirmation + add to calendar .ics + manage link]
  E --> F[Reminder 30 min before each week]
```

### J4 · Submit a prayer request / pray

/pray/wall → "Submit request" (name optional, missionary or partner, request text, share publicly?) → moderation queue → published → readers tap **"I prayed for this"** (+1) → the requester can mark it answered and add a testimony.

### J5 · Missionary needs a transit stay

/transit-housing → "Request a stay" → city, dates, number of adults/children, route, purpose, contact → reference number → housing coordinator matches a verified host → both are emailed (the host's address is shared privately, never on the site).

### J6 · Host family enrolment

/transit-housing → "Open your home" → city, rooms, max guests, amenities, church + pastor reference, consent to screening → status `pending_verification` → coordinator verifies → `active`.

### J7 · Staff: need from draft to fulfilled

Field coordinator: Admin › Needs › New (missionary, category, amount, deadline, story, photos) → **Submit for review** → Admin approves → **open** (public) → … funded (automatic) → Finance marks **disbursed** (amount, date, proof) → Coordinator posts **update** (photos + thank-you) → **fulfilled** → contributors emailed.

### J8 · Finance: reconcile bank transfers

Admin › Pledges › Reconcile → upload bank statement CSV (or type in a single transfer) → system suggests matches by reference/amount/date → confirm → donations confirmed, receipts sent → leftover unmatched lines stay in the "Unmatched" list.

### J9 · Partner self-service

Receipt email → "Manage my giving" (magic link, no password) → change amount / pause / cancel recurring, download receipts, update email.

## 4. Screen states every page must handle

| State | Example |
|-------|---------|
| Loading | Skeleton cards on Needs board |
| Empty | "No open needs in East Africa right now. Give to the General Fund" |
| Error | Payment failed → "Nothing was charged. Try again or use bank transfer" |
| Success | Confetti-free, calm confirmation + next action (pray, share) |
| Offline / slow | Cached page + "You're offline" banner. Forms keep their input |
| Funded need | Progress 100%, button replaced by "Fully funded, thank you!" + link to similar needs |
| Expired need | Banner explaining the outcome (extended / delivered partially / moved to General Fund) |
