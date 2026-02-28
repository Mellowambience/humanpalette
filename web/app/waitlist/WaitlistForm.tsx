'use client';

import { useState, useRef } from 'react';
import { joinWaitlist } from './actions';

export default function WaitlistForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState<'collector' | 'artist'>('collector');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const formData = new FormData(e.currentTarget);
    formData.set('role', role);
    const result = await joinWaitlist(formData);
    if (result.success) {
      setStatus('success');
      setMessage(role === 'artist'
        ? "You\'re on the list. We\'ll reach out when artist beta opens."
        : "You\'re on the list. First to know when collectors go live.");
      formRef.current?.reset();
    } else {
      setStatus('error');
      setMessage(result.error || 'Something went wrong.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 bg-violet-950/60 border border-violet-700/50 text-violet-300 text-sm font-medium px-5 py-3 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          {message}
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-3">
      {/* Role toggle */}
      <div className="flex rounded-xl overflow-hidden border border-white/10 text-sm font-medium">
        <button
          type="button"
          onClick={() => setRole('collector')}
          className={`flex-1 py-2.5 transition-colors ${
            role === 'collector'
              ? 'bg-violet-600 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          I collect art
        </button>
        <button
          type="button"
          onClick={() => setRole('artist')}
          className={`flex-1 py-2.5 transition-colors ${
            role === 'artist'
              ? 'bg-violet-600 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          I make art
        </button>
      </div>

      {/* Email + submit */}
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="your@email.com"
          className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-violet-500 transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
        >
          {status === 'loading' ? '...' : 'Join'}
        </button>
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-xs text-center">{message}</p>
      )}

      <p className="text-gray-600 text-xs text-center">
        No spam. Just early access when it ships.
      </p>
    </form>
  );
}
