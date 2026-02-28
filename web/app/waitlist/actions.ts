'use server';

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import crypto from 'crypto';

// Simple in-memory rate limit store (per deployment instance — good enough for Vercel serverless)
// Key: ip_hash, Value: [timestamps]
const rateLimitStore = new Map<string, number[]>();

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'hp-waitlist')).digest('hex');
}

function isRateLimited(ipHash: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxRequests = 3;
  const timestamps = (rateLimitStore.get(ipHash) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  rateLimitStore.set(ipHash, timestamps);
  return false;
}

export async function joinWaitlist(formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase();
  const role = (formData.get('role') as string) || 'collector'; // 'artist' | 'collector'

  // Basic validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  // Rate limiting
  const headersList = headers();
  const rawIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ipHash = hashIp(rawIp);

  if (isRateLimited(ipHash)) {
    return { error: 'Too many requests. Try again in a minute.' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return { error: 'Server configuration error. Please try again later.' };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabase
    .from('waitlist')
    .insert({
      email,
      role,
      ip_hash: ipHash,
      source: 'landing_page',
    });

  if (error) {
    if (error.code === '23505') {
      // Duplicate — treat as success so we don't leak existence
      return { success: true };
    }
    console.error('waitlist insert error:', error);
    return { error: 'Something went wrong. Please try again.' };
  }

  return { success: true };
}
