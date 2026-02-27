'use client';

import { useTransition, useState } from 'react';
import { submitArtistApplication } from './actions';

type State = { error?: string; success?: boolean } | null;

export default function ApplyForm() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<State>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitArtistApplication(formData);
      setState(result);
    });
  }

  if (state?.success) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold mb-2">Application received!</h2>
        <p className="text-gray-400 text-sm">
          We review every application manually. You'll hear back within a few
          days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm text-gray-400 block mb-1.5">Your name</label>
        <input
          type="text"
          name="name"
          required
          placeholder="Amara Torres"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
        />
      </div>
      <div>
        <label className="text-sm text-gray-400 block mb-1.5">Email</label>
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
        />
      </div>
      <div>
        <label className="text-sm text-gray-400 block mb-1.5">Portfolio link</label>
        <input
          type="url"
          name="portfolio"
          placeholder="instagram.com/yourhandle or portfolio site"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
        />
      </div>
      <div>
        <label className="text-sm text-gray-400 block mb-1.5">
          What medium do you work in?
        </label>
        <input
          type="text"
          name="medium"
          placeholder="e.g. digital illustration, oil painting, sculpture"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
        />
      </div>

      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
      >
        {isPending ? 'Submitting…' : 'Submit Application'}
      </button>

      <p className="text-gray-600 text-xs text-center mt-2">
        We review every application manually. You'll hear back within a few days.
      </p>
    </form>
  );
}
