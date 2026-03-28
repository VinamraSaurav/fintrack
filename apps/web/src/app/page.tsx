import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-xl font-bold text-primary">FinVerse</span>
        <div className="flex gap-3">
          <Link href="/sign-in" className="btn btn-ghost btn-sm">
            Sign In
          </Link>
          <Link href="/sign-up" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          AI-Powered Finance Tracking
        </div>
        <h1 className="mb-4 max-w-2xl text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Know where your money goes
        </h1>
        <p className="mb-8 max-w-lg text-lg text-gray-500">
          Log expenses naturally. Type &ldquo;aloo&rdquo; and we can suggest Potato before saving.
          Get smart insights about your spending habits.
        </p>
        <div className="flex gap-3">
          <Link href="/sign-up" className="btn btn-primary">
            Start Free
          </Link>
          <Link href="/sign-in" className="btn btn-ghost border border-gray-200">
            I have an account
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            {
              icon: '🧠',
              title: 'Smart Input',
              desc: 'Type in any language. AI suggests clean matches like "pyaz" to Onion before saving.',
            },
            {
              icon: '📊',
              title: 'Visual Analytics',
              desc: 'Beautiful charts showing exactly where your money goes each month.',
            },
            {
              icon: '💬',
              title: 'AI Insights',
              desc: 'Ask "How much did I spend on food?" and get instant answers.',
            },
          ].map((f) => (
            <div key={f.title} className="text-left">
              <div className="mb-2 text-2xl">{f.icon}</div>
              <h3 className="mb-1 font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-400">
        FinVerse &middot; Open Source
      </footer>
    </div>
  );
}
