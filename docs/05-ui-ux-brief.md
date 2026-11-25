# 05 · UI/UX Design Brief

---

## 1. Brand foundation (from the approved logo deck)

**Logo:** dove rising over a globe with two hands clasped across it, which reads as *labouring together, worldwide, under the Spirit*. Wordmark "JOINT LABOURERS · IN CHRIST INT'L" set in serif small caps.
**Contact (letterhead):** www.jointlabourers.org · +234 806 141 2818 · info@jointlabourers.org

**Personality:** reverent, warm, trustworthy, hopeful, global. *Not* flashy, not charity-guilt, not corporate-cold.
**Voice:** plain English, short sentences, Scripture used sparingly and well. Speak of missionaries with dignity (labourers, not victims).

## 2. Colour system

Brand colours from the deck, with the role each plays and whether it passes contrast checks:

| Token | Hex | Role | Contrast on white |
|-------|-----|------|-------------------|
| `brand-indigo` | **#3D3DEB** | Primary: links, headings accents, primary buttons, nav | 6.8 : 1 ✅ AA |
| `brand-indigo-900` | #1E1E7A | Dark sections (footer, hero overlay), body headings | ≈ 13 : 1 ✅ |
| `brand-sky` | **#00CCFF** | Accent: progress bar fill, icons, highlights, dove/globe | 1.9 : 1 ❌ **never for text on white** |
| `brand-orange` | **#E66D22** | Action / warmth: "Give" buttons, urgency tags | 3.2 : 1 ⚠️ large text only |
| `brand-orange-700` | #C2531A | Orange **buttons with white text**, small orange text | 4.6 : 1 ✅ AA |
| `brand-gold` | ≈ #F2CF3B *(to confirm)* | Celebrations: "Fully funded", answered prayer badge | text must be dark on it |
| `ink-600` | **#606062** | Body text | 6.3 : 1 ✅ |
| `ink-500` | **#727376** | Secondary text, captions | 4.8 : 1 ✅ |
| `surface` | #FFFFFF / #F7F8FC | Backgrounds | n/a |

> ⚠️ **Deck mismatch:** on the palette slide the yellow swatch is labelled `#606062`, which is a grey. Please ask the logo designer for the correct yellow hex. Until then, `#F2CF3B` (sampled) is used as a placeholder.

**Rules:**
- 60% white/light surfaces, 30% indigo, 10% orange (orange is kept for "Give" and urgency so it stands out).
- Progress bars: sky fill on an indigo-50 track. Funded = gold.
- Dark mode: not in MVP (planned in tokens only).

## 3. Typography (v3, 25 Nov 2026: total redesign, see decision D-005)

| Use | Font | Notes |
|-----|------|-------|
| Headlines, body, UI, numbers | **Outfit** (400–600) | Clean geometric sans. Headlines medium weight, tight tracking. Tabular numbers for amounts |
| Accent words in headlines | **Playfair Display** italic (600) | One or two words per headline only, e.g. "Labouring together, *for souls*". Written as `<em>` inside h1–h3 |
| Scripture quotes | Outfit, with an aqua left rule | |

Scale (mobile → desktop): H1 42→68, H2 36→48, H3 22→26, body 16→18, small 13–14. Self-host fonts through `next/font` (no Google CDN request, no layout shift).

## 3a. Layout language (v3)

Taken from the client's reference (25 Nov 2026), in JLICI colours:
- **Hero frame:** every page opens with a rounded (32 px) frame. On Home it holds a full-bleed photo under an indigo gradient; inner pages use plain night indigo (`#14145A`).
- **Floating white nav bar** inside the frame: logo, links with an aqua "active" pill, phone number, dark "Give" pill with an aqua arrow circle.
- **Pill buttons with an arrow circle** (`ButtonLink arrow`). Primary on dark = aqua pill; primary on light = night pill.
- **Eyebrow labels:** small uppercase text with a coloured dot ("• ABOUT JLICI").
- **Glass stats card** on the hero; **trust strip** below it (the live prayer hubs stand in for partner logos).
- **Photo-card carousel** for "ways to get involved"; **bento step cards** for "How it works".
- Photography: the current photos are **placeholders** from the old site (some show other charities' branding) and must be replaced with JLICI field photos before launch.

## 4. Layout and components

- **Grid:** 4-col mobile, 8 tablet, 12 desktop. Max content width 1200 px. Spacing scale on 4 px steps.
- **Corners:** 12 px cards, full-round pills (the pill shape echoes the swatches in the deck).
- **Elevation:** soft single shadow. Avoid heavy borders.
- **Imagery:** real field photography, warm, people at work (not pity images). Blur faces / use landscape and hands for *sensitive* missionaries. Duotone indigo overlay for heroes.
- **Icons:** Lucide (outline, 1.75 stroke).

**Core components (built in `frontend/src/components/ui`):**
Button (primary-indigo / give-orange / ghost), Card, **NeedCard**, **ProgressBar** (with raised / target / contributors / days left), **AmountPicker** (presets + % options + "Fund the remainder" + custom), **CurrencySwitcher**, Tabs, Accordion (FAQ), Dialog, Toast, Badge (category, urgency, status), **PrayerClock** (4 hubs), **PrayerGrid** (7×24), StatCounter, Testimony / Quote, Form fields (with inline validation errors), Skeleton, EmptyState, Stepper.

## 5. Key screen briefs

### 5.1 Home
1. **Hero:** field image, H1 "Equipping the saints together for souls", Luke 8:3 line, CTAs **[Fund a need]** (orange) and **[Adopt a missionary]** (indigo outline).
2. **Impact counters:** missionaries supported · needs met this year · prayer hours covered weekly · territories reached.
3. **Featured needs:** 3 NeedCards, closest to deadline or "almost there".
4. **Four pathways:** Pray · Adopt · Fund a need · Open your home.
5. **Live prayer clock strip:** "Right now: **Lagos** is on watch, next is New York in 2h 14m".
6. "Did you know?" carousel (missionary realities).
7. Quick-give module with currency toggle.
8. Testimony / fulfilled need update.
9. Footer.

### 5.2 Needs Board (/needs)
- Filter chips: category · region · "Almost there" · "Urgent". Sort.
- **NeedCard:** cover image (or category illustration), category badge, title, missionary alias + region, ProgressBar, "₦142,000 to go · 9 days left", [Give] button.
- Counter on top: "**38 of 52** needs met in 2027".
- Link to "Fulfilled needs" (proof wall), which builds trust.

### 5.3 Need detail (/needs/JLN-0042)
- Left (desktop) / top (mobile): story, photos, "Why this matters", missionary mini-profile, updates timeline, contributors list ("Ada O. · ₦20,000", "Anonymous · $50", team names).
- Right / sticky bottom on mobile: **Give panel**: AmountPicker (presets, 25%, 50%, *Fund the remainder*), currency, frequency hidden (needs are one-off), [Continue]. Note: "If this need is completed before your gift clears, your gift goes to the Missionary Care Fund."
- Share row (WhatsApp first).

### 5.4 Prayer Network (/pray)
- **PrayerClock:** four cards in relay order: **Sydney → Lagos → New York → Vancouver**. Each shows city, local time (live), and on-watch status. The active card has a sky glow and a dove icon. A ring/timeline shows the 24 h relay and the countdown to handover.
- **PrayerGrid:** 7×24 heatmap in the viewer's local time (hub switcher). Colours: 0 = soft orange outline ("gap"), 1–2 = sky-200, 3+ = indigo. Tap → claim. Mobile: one day at a time with a day switcher.
- Prayer wall cards with the "🙏 I prayed for this · 128" button.

### 5.5 Give (/give)
Stepper: **1 Amount** (one-off / monthly toggle, currency, presets, designation select) → **2 Your details** → **3 Payment method** (card / USSD / bank transfer / mobile money, filtered by currency). Trust row: secure badge, "Where your money goes" donut, accountability charter link.

### 5.6 Admin dashboard
Clean, dense, desktop-first (still usable on a tablet). Left sidebar by role. Data tables with filters, bulk actions and CSV export. The need editor has a live preview of the public card. Status transitions are explicit buttons with confirmation dialogs (never a raw status dropdown).

## 6. Accessibility checklist (WCAG 2.2 AA)
- Contrast rules in §2. Focus ring: 3 px sky outline + indigo offset.
- All interactive targets ≥ 44×44 px.
- Progress bars use `role="progressbar"` with `aria-valuenow/min/max` and a text equivalent.
- Prayer clock: live region updates at most once a minute (no per-second announcements).
- Forms: labels always visible, errors linked with `aria-describedby`, no placeholder-only fields.
- Respect `prefers-reduced-motion` (counters and carousel stay still).

## 7. Design deliverables (Figma)

| # | Deliverable | Due |
|---|-------------|-----|
| 1 | Moodboard + token sheet (colour, type, spacing) | Week 1 |
| 2 | Low-fi wireframes: all public pages (mobile first) + admin key screens | Week 1 |
| 3 | Hi-fi mockups: Home, Needs board, Need detail, Pray, Give, mobile + desktop | Week 2 |
| 4 | Component library (Figma) matching the code components | Week 2 |
| 5 | Clickable prototype of journey J1 (fund a need) for board review | Week 2 |
| 6 | Email templates (receipt, pledge, need funded, update, prayer reminder) | Week 5 |
