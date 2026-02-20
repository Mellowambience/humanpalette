// store/auth.store.ts — Zustand auth store
import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'artist' | 'collector' | 'admin';

export interface Profile {
  id: string; role: UserRole; display_name: string; bio: string | null;
  avatar_url: string | null; location: string | null; website: string | null;
  stripe_account_id: string | null; stripe_customer_id: string | null;
  is_active: boolean; created_at: string; updated_at: string;
}

interface AuthState {
  session: Session | null; user: User | null; profile: Profile | null;
  isLoading: boolean; isInitialized: boolean;
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, role: UserRole, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Profile) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null, user: null, profile: null, isLoading: false, isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null });
      if (session?.user) await get().refreshProfile();
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null });
        if (session?.user) await get().refreshProfile();
        else set({ profile: null });
      });
    } finally { set({ isInitialized: true }); }
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally { set({ isLoading: false }); }
  },

  signUpWithEmail: async (email, password, role, displayName) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed');
      const { error: profileError } = await supabase.from('profiles').insert({ id: data.user.id, role, display_name: displayName });
      if (profileError) throw profileError;
      if (role === 'artist') await supabase.from('artist_profiles').insert({ id: data.user.id });
      else if (role === 'collector') await supabase.from('collector_profiles').insert({ id: data.user.id });
    } finally { set({ isLoading: false }); }
  },

  signOut: async () => { await supabase.auth.signOut(); set({ session: null, user: null, profile: null }); },

  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!error && data) set({ profile: data as Profile });
  },

  setProfile: (profile) => set({ profile }),
}));
