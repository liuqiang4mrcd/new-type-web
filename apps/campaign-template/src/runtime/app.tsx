import { useEffect } from 'react';
import { ToastContainer } from '@new-type/ui';
import { useStore } from '../integrations/store';
import { ScaffoldContainer } from './sections/ScaffoldContainer';
import { trackPageView } from '../integrations/tracking';

export function App() {
  const loadCampaign = useStore((s) => s.loadCampaign);

  useEffect(() => {
    loadCampaign();
    trackPageView();
  }, [loadCampaign]);

  return (
    <main className="min-h-screen bg-[#f7f8fb]">
      <ScaffoldContainer />
      <ToastContainer />
    </main>
  );
}
