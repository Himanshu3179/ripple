import type { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-100">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-6 md:pt-10">
        {children}
      </main>
    </div>
  );
};

export default Layout;
