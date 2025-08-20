'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export function Header() {
  return (
    <header className="p-4 flex justify-between items-center border-b">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold">Uniswap Max</Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900">Trade</Link>
          <Link href="/pools" className="text-sm font-medium text-gray-500 hover:text-gray-900">Pools</Link>
        </nav>
      </div>
      <ConnectButton />
    </header>
  );
}
