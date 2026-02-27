import Link from 'next/link';
import ApplyForm from './ApplyForm';

export const metadata = {
  title: 'Apply as Artist · HumanPalette',
  description:
    'Apply for early artist access on HumanPalette — the human-verified art marketplace.',
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
          HumanPalette is accepting early artists now. Once verified, you'll
          receive your Human Verified badge — an on-chain attestation on Base
          proving your work is human-made.
        </p>
        <ApplyForm />
      </div>
    </main>
  );
}
