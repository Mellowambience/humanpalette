import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 text-5xl">🎨</div>
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">HumanPalette</h1>
      <p className="text-gray-400 text-lg max-w-md mb-8">A marketplace for human-made art only. Every piece is verified — no AI, no exceptions.</p>
      <a href="https://apps.apple.com/app/humanpalette" className="inline-flex items-center gap-2 bg-violet-700 hover:bg-violet-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Download on the App Store</a>
    </main>
  );
}
