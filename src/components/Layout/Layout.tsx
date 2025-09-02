import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 lg:ml-64">
      <Sidebar />
      <Header />
      <main className="pt-16 lg:pt-20 p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}