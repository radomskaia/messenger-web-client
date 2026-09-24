import { SessionGate } from '@/app/SessionGate';
import { useAppliedTheme } from '@/app/useAppliedTheme';
import { useNotificationLifecycle } from '@/app/useNotificationLifecycle';
import { ChatPage } from '@/pages/ChatPage/ChatPage';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { useAuthStore } from '@/store/authStore';

export function App() {
  const credentials = useAuthStore((state) => state.credentials);

  useAppliedTheme();
  useNotificationLifecycle();

  return credentials ? (
    <SessionGate>
      <ChatPage />
    </SessionGate>
  ) : (
    <LoginPage />
  );
}
