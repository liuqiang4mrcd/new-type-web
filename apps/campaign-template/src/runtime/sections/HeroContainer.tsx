import { useEffect } from 'react';
import { useStore } from '../../integrations/store';
import { HeroSection } from '../../designer/sections/HeroSection';
import {
  HeroLoading,
  HeroEmpty,
  HeroError,
} from '../../designer/sections/HeroSection/states';
import { trackHeroClick } from '../../integrations/tracking';

export function HeroContainer() {
  const hero = useStore((s) => s.hero);
  const loadCampaign = useStore((s) => s.loadCampaign);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  switch (hero.status) {
    case 'loading':
      return <HeroLoading />;
    case 'error':
      return <HeroError message={hero.error} />;
    case 'empty':
      return <HeroEmpty />;
    case 'ready':
      return (
        <HeroSection
          content={hero.content!}
          actions={{ onCtaClick: trackHeroClick }}
        />
      );
  }
}
