import WaitlistForm from './waitlist/WaitlistForm';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
          HumanPalette
        </span>
        <a
          href="/artist/apply"
          className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Apply as Artist →
        </a>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-950/60 border border-violet-800/50 text-violet-300 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Beta · Artists applying now
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6 max-w-2xl">
          Art made by{' '}
          <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
            humans,
          </span>
          <br />
          verified on-chain.
        </h1>

        <p className="text-gray-400 text-lg max-w-md mb-10 leading-relaxed">
          HumanPalette is a swipe-native marketplace for human-made art only.
          Every piece is AI-screened and attested on Base — so collectors know
          exactly what they&apos;re buying.
        </p>

        {/* Waitlist form replaces old CTA buttons */}
        <WaitlistForm />
      </section>

      {/* Trust strip */}
      <section className="border-t border-white/5 px-6 py-12">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-2xl mb-2">🛡️&#xfe0f;</div>
            <h3 className="font-semibold text-white mb-1">Human Verified</h3>
            <p className="text-gray-500 text-sm">
              Every piece goes through AI detection + manual review before the
              seal is minted on-chain.
            </p>
          </div>
          <div>
            <div className="text-2xl mb-2">⛓️</div>
            <h3 className="font-semibold text-white mb-1">On-Chain Attestation</h3>
            <p className="text-gray-500 text-sm">
              Verification is stored as an EAS attestation on Base mainnet — permanent,
              public, and yours.
            </p>
          </div>
          <div>
            <div className="text-2xl mb-2">💸</div>
            <h3 className="font-semibold text-white mb-1">Buy &amp; Commission</h3>
            <p className="text-gray-500 text-sm">
              Collectors can buy existing work or open a commission request — all
              in one swipe flow.
            </p>
          </div>
        </div>
      </section>

      {/* Artist CTA */}
      <section className="border-t border-white/5 px-6 py-14 text-center">
        <h2 className="text-2xl font-bold mb-3">
          Are you a human artist?
        </h2>
        <p className="text-gray-400 mb-6 max-w-sm mx-auto text-sm">
          Beta spots are limited. Apply now to get your Human Verified badge and
          be first when collectors arrive.
        </p>
        <a
          href="/artist/apply"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all"
        >
          Apply for Beta Access
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-6 flex items-center justify-between text-gray-600 text-xs">
        <span>© 2026 HumanPalette</span>
        <span>Built by a human 🌹</span>
      </footer>
    </main>
  );
}
