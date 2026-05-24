import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { StepUpModal } from '@/components/auth/step-up-modal';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth.store';

export function AppShell() {
  const setUserFromMe = useAuthStore((s) => s.setUserFromMe);

  useEffect(() => {
    authApi.me().then(setUserFromMe).catch(() => { /* handled by interceptor */ });
  }, [setUserFromMe]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <StepUpModal />
    </div>
  );
}
