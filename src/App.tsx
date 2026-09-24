import { SessionGate } from '@/app/SessionGate';
import { useAppliedTheme } from '@/app/useAppliedTheme';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { useAuthStore } from '@/store/authStore';

export function App() {
  const credentials = useAuthStore((state) => state.credentials);

  useAppliedTheme();
  const signOut = useAuthStore((state) => state.signOut);

  return credentials === null ? (
    <LoginPage />
  ) : (
    <SessionGate>
      <button
        type="button"
        onClick={signOut}
      >
        signOut
      </button>
    </SessionGate>
  );
}
