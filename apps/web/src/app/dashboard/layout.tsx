import { Providers } from '../providers';
import { Sidebar, MobileNav } from '@/components/shared/nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex h-screen bg-base-200">
        {/* Sidebar — fixed, never scrolls */}
        <div className="hidden lg:block lg:shrink-0">
          <Sidebar />
        </div>
        {/* Main content — scrolls independently */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </Providers>
  );
}
