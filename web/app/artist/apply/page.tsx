import Link from 'next/link';

export const metadata = {
  title: 'Apply as Artist · HumanPalette',
  description: 'Apply for early artist access on HumanPalette — the human-verified art marketplace.',
};

export default function ArtistApplyPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-20">
      <Link
        href="/"
        className="text-gray-500 hover:text-gray-300 text-sm mb-10 transition-colors self-start max-w-md w-full mx-auto"
      >
        ← Back
      </Link>

      <div className="w-full max-w-md">
        <div className="text-4xl mb-4">🎨</div>
        <h1 className="text-3xl font-bold mb-3">Apply for Artist Beta</h1>
        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
          HumanPalette is accepting early artists now. Once verified, you'll receive
          your Human Verified badge — an on-chain attestation on Base proving your
          work is human-made.
        </p>

        <form
          action="https://formspree.io/f/humanpalette"
          method="POST"
          className="flex flex-col gap-4"
        >
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
            <label className="text-sm text-gray-400 block mb-1.5">What medium do you work in?</label>
            <input
              type="text"
              name="medium"
              placeholder="e.g. digital illustration, oil painting, sculpture"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
            />
          </div>

          <button
            type="submit"
            className="mt-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
          >
            Submit Application
          </button>
        </form>

        <p className="text-gray-600 text-xs text-center mt-6">
          We review every application manually. You'll hear back within a few days.
        </p>
      </div>
    </main>
  );
}
