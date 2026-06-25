import { useEffect } from 'react';
import { ToastContainer } from '@new-type/ui';
import { useStore } from '../integrations/store';
import { ScaffoldContainer } from './sections/ScaffoldContainer';
import { trackPageView } from '../integrations/tracking';

export function RuntimePage() {
  const lang = useStore((s) => s.ui.lang);
  const textDirection = useStore((s) => s.ui.textDirection);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = textDirection;
  }, [lang, textDirection]);

  return (
    <main lang={lang} dir={textDirection} className="min-h-screen bg-[#f7f8fb]">
      <ScaffoldContainer />
      <ToastContainer />
    </main>
  );
}

export function App() {
  const loadCampaign = useStore((s) => s.loadCampaign);

  useEffect(() => {
    loadCampaign();
    trackPageView();
  }, [loadCampaign]);

  return <RuntimePage />;
}
