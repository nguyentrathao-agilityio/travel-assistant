import { TravelChat, Sidebar, ApiKeyOverlay } from '@/components';
import { Providers } from './app/providers';
import { useApiKeyStore } from '@/stores';

const App = () => {
  const hasVerifiedApiKey = useApiKeyStore((state) => state.hasVerifiedApiKey());

  if (!hasVerifiedApiKey) {
    return (
      <div className="bg-background-primary flex h-screen overflow-hidden">
        <ApiKeyOverlay />
      </div>
    );
  }

  return (
    <div className="bg-background-primary flex h-screen overflow-hidden">
      <Sidebar />
      <Providers>
        <main className="flex flex-1 flex-col overflow-hidden">
          <TravelChat />
        </main>
      </Providers>
    </div>
  );
};

export { App };
