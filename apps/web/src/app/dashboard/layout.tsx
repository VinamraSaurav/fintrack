import { Providers } from '../providers';
import { Sidebar, MobileNav } from '@/components/shared/nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen bg-transparent">
        <div className="hidden lg:block lg:w-[19rem] lg:shrink-0" />
        <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto pb-32 lg:pb-8">{children}</main>
        <MobileNav />
      </div>
    </Providers>
  );
}
