import { SessionGate } from '@/app/SessionGate';
import { useAppliedTheme } from '@/app/useAppliedTheme';
import { Sidebar } from '@/components/Sidebar/Sidebar.tsx';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { useAuthStore } from '@/store/authStore';

export function App() {
  const credentials = useAuthStore((state) => state.credentials);

  useAppliedTheme();

  return credentials ? (
    <SessionGate>
      <Sidebar />
    </SessionGate>
  ) : (
    <LoginPage />
  );
}
