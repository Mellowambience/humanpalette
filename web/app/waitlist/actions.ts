'use server';

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// In-memory rate limit store (per-instance; good enough for MVP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;

function getIpHash(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'humanpalette-default-salt';
  return createHash('sha256').update(ip + salt).digest('hex');
}

function isRateLimited(ipHash: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ipHash);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ipHash, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

async function sendWelcomeEmail(email: string, role: 'artist' | 'collector') {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // Graceful no-op if key not set

  const resend = new Resend(apiKey);

  const subjectMap = {
    artist: "You're on the list — HumanPalette",
    collector: "You're on the list — HumanPalette",
  };

  const bodyMap = {
    artist: `Hi,

You're on the HumanPalette waitlist as an artist — and we're glad you're here.

HumanPalette is being built as a place where human-made art is the only kind that gets in. No AI-generated work, no noise — just real artists and the collectors who want to find them.

We'll reach out personally when artist onboarding opens.

Until then,
Mars
HumanPalette
https://humanpalette.vercel.app`,
    collector: `Hi,

You're on the HumanPalette waitlist — and you'll be among the first to know when we go live.

HumanPalette is a marketplace for human-verified art only. Every piece, every artist — real.

We'll reach out when collector access opens.

Until then,
Mars
HumanPalette
https://humanpalette.vercel.app`,
  };

  await resend.emails.send({
    from: 'HumanPalette <hello@humanpalette.vercel.app>',
    to: email,
    subject: subjectMap[role],
    text: bodyMap[role],
  });
}

export async function joinWaitlist(
  _prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const email = (formData.get('email') as string | null)?.trim().toLowerCase();
  const role = (formData.get('role') as string | null) ?? 'collector';

  // Basic validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  if (!['artist', 'collector'].includes(role)) {
    return { success: false, message: 'Invalid role.' };
  }

  // Rate limiting (by IP hash)
  const rawIp =
    (typeof process !== 'undefined' && process.env.VERCEL
      ? (global as unknown as Record<string, string>)['x-forwarded-for']
      : null) ?? '127.0.0.1';
  const ipHash = getIpHash(rawIp);
  if (isRateLimited(ipHash)) {
    return { success: false, message: 'Too many requests. Please try again later.' };
  }

  // Upsert into Supabase (duplicate emails succeed silently)
  const { error } = await supabase
    .from('waitlist')
    .upsert(
      { email, role, ip_hash: ipHash, source: 'landing_page' },
      { onConflict: 'email', ignoreDuplicates: true }
    );

  if (error) {
    console.error('Waitlist insert error:', error);
    return { success: false, message: 'Something went wrong. Please try again.' };
  }

  // Fire-and-forget welcome email (non-blocking)
  sendWelcomeEmail(email, role as 'artist' | 'collector').catch((err) =>
    console.error('Welcome email failed:', err)
  );

  return { success: true, message: 'You are on the list.' };
}
