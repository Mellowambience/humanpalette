'use server';

import { createClient } from '@supabase/supabase-js';

export async function submitArtistApplication(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const portfolio_url = (formData.get('portfolio') as string) || null;
  const medium = (formData.get('medium') as string) || null;

  if (!name || !email) {
    return { error: 'Name and email are required.' };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('artist_applications')
    .insert({ name, email, portfolio_url, medium });

  if (error) {
    // Duplicate email
    if (error.code === '23505') {
      return { error: 'That email is already on the list.' };
    }
    console.error('artist_applications insert error:', error);
    return { error: 'Something went wrong. Please try again.' };
  }

  return { success: true };
}
