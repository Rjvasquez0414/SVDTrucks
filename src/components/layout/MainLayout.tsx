'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

function MainContent({ children, title }: MainLayoutProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          collapsed ? 'pl-16' : 'pl-64'
        )}
      >
        <Header title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainContent title={title}>{children}</MainContent>
    </SidebarProvider>
  );
}
