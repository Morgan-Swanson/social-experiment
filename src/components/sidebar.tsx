'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Database,
  FileText,
  FlaskConical,
  User,
  Settings,
  HelpCircle,
} from 'lucide-react';

const navigation = [
  { name: 'Data', href: '/dashboard/data', icon: Database },
  { name: 'Classifiers', href: '/dashboard/classifiers', icon: FileText },
  { name: 'Constraints', href: '/dashboard/constraints', icon: Settings },
  { name: 'Studies', href: '/dashboard/study', icon: FlaskConical },
  { name: 'Account', href: '/dashboard/account', icon: User },
  { name: 'Support', href: '/dashboard/support', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-muted/10">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="text-xl font-serif font-bold hover:opacity-80 transition-opacity">
          <span className="text-primary">Social</span>{' '}
          <span className="text-secondary">Experiment</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="text-xs text-muted-foreground">
          Version 0.1.0
        </div>
      </div>
    </div>
  );
}