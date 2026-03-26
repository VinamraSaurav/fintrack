import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base-200">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="mt-2 text-gray-500">Page not found</p>
      <Link href="/dashboard" className="btn btn-primary btn-sm mt-4 text-white">
        Go to Dashboard
      </Link>
    </div>
  );
}
