'use client';

import { NavigationMobile, NavigationDesktop } from './navigation';

export function AppShell({
  children,
  messagesNonLus,
}: {
  children: React.ReactNode;
  messagesNonLus: number;
}) {
  return (
    <div className="min-h-screen">
      <NavigationDesktop messagesNonLus={messagesNonLus} />
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <NavigationMobile messagesNonLus={messagesNonLus} />
    </div>
  );
}
