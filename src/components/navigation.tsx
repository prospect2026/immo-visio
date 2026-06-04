'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const liens = [
  {
    href: '/',
    label: 'Accueil',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/reservations',
    label: 'Réservations',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/finances',
    label: 'Finances',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: '/profil',
    label: 'Profil',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export function NavigationMobile({ messagesNonLus }: { messagesNonLus: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {liens.map((lien) => {
          const actif = pathname === lien.href || (lien.href !== '/' && pathname.startsWith(lien.href));
          return (
            <Link
              key={lien.href}
              href={lien.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg relative',
                actif ? 'text-primary' : 'text-muted'
              )}
            >
              {lien.icon}
              {lien.href === '/messages' && messagesNonLus > 0 && (
                <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {messagesNonLus > 9 ? '9+' : messagesNonLus}
                </span>
              )}
              <span className="text-[10px] font-medium">{lien.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function NavigationDesktop({ messagesNonLus }: { messagesNonLus: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">Immo-Visio</h1>
        <p className="text-xs text-muted mt-0.5">Gestion locative — Lomé</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {liens.map((lien) => {
          const actif = pathname === lien.href || (lien.href !== '/' && pathname.startsWith(lien.href));
          return (
            <Link
              key={lien.href}
              href={lien.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative',
                actif ? 'bg-primary text-white' : 'text-foreground hover:bg-gray-100'
              )}
            >
              {lien.icon}
              <span className="font-medium">{lien.label}</span>
              {lien.href === '/messages' && messagesNonLus > 0 && (
                <span className={cn(
                  'ml-auto text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center',
                  actif ? 'bg-white text-primary' : 'bg-danger text-white'
                )}>
                  {messagesNonLus > 9 ? '9+' : messagesNonLus}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
