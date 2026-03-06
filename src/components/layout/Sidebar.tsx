'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/sidebar-context';
import {
  LayoutDashboard,
  Truck,
  Wrench,
  Bell,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Vehiculos',
    href: '/vehiculos',
    icon: Truck,
  },
  {
    title: 'Documentacion',
    href: '/documentacion',
    icon: FileText,
  },
  {
    title: 'Mantenimientos',
    href: '/mantenimientos',
    icon: Wrench,
  },
  {
    title: 'Alertas',
    href: '/alertas',
    icon: Bell,
  },
  {
    title: 'Reportes',
    href: '/reportes',
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Truck className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-sidebar-primary">AZUTRANS</span>
              <span className="text-[10px] text-sidebar-foreground/60 tracking-widest">EAM DIONE</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary mx-auto">
            <Truck className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 mt-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className={cn(
            'w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            !collapsed && 'justify-start'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Colapsar</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
