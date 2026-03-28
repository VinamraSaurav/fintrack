'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/dashboard',
    label: 'Overview',
    mobileLabel: 'Home',
    hint: 'Monthly snapshot',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/dashboard/entries',
    label: 'Entries',
    mobileLabel: 'Entries',
    hint: 'Receipts and logs',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    href: '/dashboard/expenses',
    label: 'Expenses',
    mobileLabel: 'Spend',
    hint: 'Filters and exports',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    href: '/dashboard/insights',
    label: 'Analytics',
    mobileLabel: 'Analytics',
    hint: 'Breakdowns and AI',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    href: '/dashboard/budgets',
    label: 'Budgets',
    mobileLabel: 'Budget',
    hint: 'Monthly guardrails',
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
  {
    href: '/dashboard/categories',
    label: 'Categories',
    mobileLabel: 'Cats',
    hint: 'Organize spend',
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  },
];

const mobileNavItems = navItems.filter((item) =>
  [
    '/dashboard',
    '/dashboard/entries',
    '/dashboard/expenses',
    '/dashboard/insights',
  ].includes(item.href),
);

const mobileMoreItems = [
  ...navItems.filter((item) => ['/dashboard/budgets', '/dashboard/categories'].includes(item.href)),
  {
    href: '/dashboard/settings',
    label: 'Settings',
    mobileLabel: 'Settings',
    hint: 'Account and app',
    icon: 'M11.983 5.25c.575 0 1.04.466 1.04 1.04v.38c.411.112.803.275 1.169.482l.269-.269a1.04 1.04 0 011.47 0l.736.736a1.04 1.04 0 010 1.47l-.269.269c.208.366.37.758.482 1.169h.38c.575 0 1.04.466 1.04 1.04v1.04c0 .575-.466 1.04-1.04 1.04h-.38a5.35 5.35 0 01-.482 1.169l.269.269a1.04 1.04 0 010 1.47l-.736.736a1.04 1.04 0 01-1.47 0l-.269-.269a5.35 5.35 0 01-1.169.482v.38c0 .575-.466 1.04-1.04 1.04h-1.04a1.04 1.04 0 01-1.04-1.04v-.38a5.35 5.35 0 01-1.169-.482l-.269.269a1.04 1.04 0 01-1.47 0l-.736-.736a1.04 1.04 0 010-1.47l.269-.269A5.35 5.35 0 016.68 13.1H6.3a1.04 1.04 0 01-1.04-1.04v-1.04c0-.575.466-1.04 1.04-1.04h.38c.112-.411.275-.803.482-1.169l-.269-.269a1.04 1.04 0 010-1.47l.736-.736a1.04 1.04 0 011.47 0l.269.269c.366-.208.758-.37 1.169-.482v-.38c0-.575.466-1.04 1.04-1.04h1.04ZM12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5Z',
  },
];

function isNavItemActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
}

function NavIcon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[19rem] shrink-0 px-4 py-4">
      <div className="glass-panel flex h-full w-full flex-col overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-primary text-lg font-bold leading-none text-white shadow-lg shadow-primary/20">
              F
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">FinVerse</p>
              <p className="text-xs text-slate-500">Personal finance dashboard</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-[20px] px-3.5 py-3 transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-500 hover:bg-gray-50 hover:text-slate-900',
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-[16px] transition-all duration-200',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'bg-gray-100 text-slate-400 group-hover:bg-white group-hover:text-slate-700',
                  )}
                >
                  <NavIcon d={item.icon} />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isActive ? 'text-primary' : 'text-slate-800',
                    )}
                  >
                    {item.label}
                  </p>
                  <p className={cn('text-[11px]', isActive ? 'text-primary/70' : 'text-slate-400')}>
                    {item.hint}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mx-3 rounded-[24px] border border-primary/10 bg-primary/5 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
            Quick capture
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Log a new expense while the receipt is still fresh.
          </p>
          <Link
            href="/dashboard/expenses/new"
            className="btn btn-primary btn-sm mt-4 w-full text-white"
          >
            Add Expense
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-gray-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div>
              <p className="text-sm font-medium text-slate-800">Account</p>
              <p className="text-xs text-slate-400">Sync and preferences</p>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-900"
          >
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  const isMoreActive = mobileMoreItems.some((item) => isNavItemActive(pathname, item.href));

  return (
    <>
      {isMoreOpen ? (
        <>
          <button
            type="button"
            aria-label="Close more menu"
            className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden"
            onClick={() => setIsMoreOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-50 px-3 lg:hidden">
            <div className="mx-auto max-w-sm rounded-[28px] border border-gray-200 bg-white/95 p-3 shadow-[0_28px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-sm font-semibold text-slate-900">More</p>
                  <p className="text-xs text-slate-400">Extra destinations</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                  onClick={() => setIsMoreOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="grid gap-2">
                {mobileMoreItems.map((item) => {
                  const isActive = isNavItemActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-[20px] px-3.5 py-3 transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-slate-500 hover:bg-gray-50 hover:text-slate-900',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-[16px] transition-all duration-200',
                          isActive
                            ? 'bg-white text-primary shadow-sm'
                            : 'bg-gray-100 text-slate-400',
                        )}
                      >
                        <NavIcon d={item.icon} />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            isActive ? 'text-primary' : 'text-slate-800',
                          )}
                        >
                          {item.label}
                        </p>
                        <p className="text-[11px] text-slate-400">{item.hint}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] lg:hidden">
        <div className="pointer-events-auto rounded-[26px] border border-gray-200 bg-white/95 p-1.5 shadow-[0_22px_52px_-30px_rgba(15,23,42,0.28)] backdrop-blur-2xl">
          <div className="mb-0.5 flex justify-center">
            <span className="h-0.5 w-8 rounded-full bg-gray-200" />
          </div>

          <div className="grid grid-cols-5 gap-1">
            {mobileNavItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 text-center transition-all duration-200',
                    isActive ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-700',
                  )}
                >
                  <NavIcon
                    d={item.icon}
                    className={cn(
                      'h-[17px] w-[17px] transition-transform duration-200',
                      isActive && 'scale-110',
                    )}
                  />
                  <span className="text-[9px] font-semibold tracking-[0.03em]">
                    {item.mobileLabel}
                  </span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setIsMoreOpen((open) => !open)}
              className={cn(
                'flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 text-center transition-all duration-200',
                isMoreActive || isMoreOpen
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-400 hover:text-slate-700',
              )}
            >
              <NavIcon
                d="M4.5 7.5h15m-15 4.5h15m-15 4.5h15"
                className={cn(
                  'h-[17px] w-[17px] transition-transform duration-200',
                  (isMoreActive || isMoreOpen) && 'scale-110',
                )}
              />
              <span className="text-[9px] font-semibold tracking-[0.03em]">More</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
