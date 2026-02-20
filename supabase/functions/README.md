# HumanPalette — Supabase Edge Functions

All functions run on Deno. Deploy with the Supabase CLI.

## Functions

| Function | Trigger | Description |
|----------|---------|-------------|
| `commitment-create` | Client call | Creates match + Stripe manual-capture PaymentIntent for commitment fee on swipe-right |
| `purchase-create` | Client call | Full purchase escrow with commercial uplift + 7.5% platform split via Stripe Connect |
| `stripe-webhook` | Stripe webhook | Handles `payment_intent.succeeded/failed`, `transfer.created`, `account.updated`, `charge.dispute.created` |
| `ghost-janitor` | Daily cron | Finds silent collectors (7+ days no activity), captures their commitment fee, applies trust score penalty |
| `artist-connect-onboard` | Client call | Creates Stripe Connect Express account + returns hosted onboarding URL |
| `artist-connect-status` | Client call (polling) | Checks if artist has completed Stripe KYC (`charges_enabled + payouts_enabled`) |

## Deploy

```bash
# Link to your Supabase project first
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy commitment-create
supabase functions deploy purchase-create
supabase functions deploy stripe-webhook
supabase functions deploy ghost-janitor
supabase functions deploy artist-connect-onboard
supabase functions deploy artist-connect-status
```

## Required Secrets

Set these in your Supabase project dashboard (Settings → Edge Functions → Secrets):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=humanpalette://   # deep link scheme for Stripe onboarding redirects
```

## Stripe Webhook Setup

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
3. Events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
   - `transfer.created`
   - `charge.dispute.created`
4. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET`
