# HumanPalette 🌹

> A swipe-native mobile marketplace where collectors discover and commission authentic works from verified human artists. No AI-generated content. Every piece bears the pulse of human hands.

## What It Is

HumanPalette is a **buy + hire in one swipe flow** — think Tinder meets Etsy, but with ironclad human verification at the gate.

- 🔍 **Discovery Feed** — Infinite swipe cards: finished works (price, medium, story) or artist profiles (rates, availability)
- 🤝 **Swipe & Match** — Right swipe = interest. Mutual likes unlock chat. Sales go straight to escrow cart.
- ✅ **Human Verified Seal** — Artists submit WIP footage, live proofs, or references. Human review + community flag awards the "Human Verified" seal.
- 💰 **Trust-Based Escrow** — Commitment fees held via Stripe, released on delivery. Collectors who ghost lose trust score and pay higher deposits.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React Native (Expo) |
| Backend | Supabase (auth, realtime, storage) |
| Payments | Stripe Connect |
| Edge Functions | Supabase Edge Functions (6 total) |
| Language | TypeScript |

## Features Built

- [x] Full auth flow (email/phone + artist verification)
- [x] Swipe discovery screen with Supabase integration
- [x] Matches + real-time chat (Supabase Realtime)
- [x] Artwork upload with media picker + commercial use toggle
- [x] Artist and collector profile views
- [x] Commitment fee modal (Stripe PaymentSheet)
- [x] Purchase checkout with commercial uplift + escrow
- [x] Stripe Connect artist onboarding flow
- [x] `commitment-create` Edge Function
- [x] `purchase-create` Edge Function (escrow + platform split)
- [x] `stripe-webhook` Edge Function
- [x] `ghost-janitor` cron Edge Function (auto-penalizes silent collectors)
- [x] `artist-connect-onboard` + `artist-connect-status` Edge Functions
- [x] Full Supabase schema (13 tables, RLS, trust score system)

## Monetization

- **5–10% transaction take rate** — no ads, no premium tiers at launch
- **Commercial use licensing uplift** — artist-configurable (default +25%)
- **Resale royalties** (Phase 2)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Mellowambience/humanpalette.git
cd humanpalette

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Fill in: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Run the app
npx expo start
```

**Prerequisites:**
1. Supabase project with schema applied (`supabase-schema.sql`)
2. Stripe account with Connect enabled
3. Expo Go on your device

## Status

🚧 **In active development** — all screens and Edge Functions built. Supabase schema live. iOS launch via TestFlight.

---

Built solo with AI as co-builder. Philadelphia, PA.
