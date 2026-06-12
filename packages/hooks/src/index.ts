import { useState, useEffect, useCallback, useRef } from 'react';

export function useCountdown(targetTime: number) {
  const calcRemaining = useCallback(() => {
    const diff = targetTime - Date.now();
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  }, [targetTime]);

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining(calcRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining, calcRemaining]);

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return { days, hours, minutes, seconds, total: remaining };
}

export function useScrollDirection() {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setDirection(currentY > lastScrollY.current ? 'down' : 'up');
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return direction;
}

export function useShare() {
  const share = useCallback(
    async (data: { title?: string; text?: string; url?: string }) => {
      if (!navigator.share) {
        await navigator.clipboard.writeText(data.url || window.location.href);
        return 'copied';
      }
      await navigator.share(data);
      return 'shared';
    },
    [],
  );

  return { share };
}

export function useWechatShare(config: {
  title: string;
  desc: string;
  imgUrl: string;
  link?: string;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).wx?.updateAppMessageShareData) {
      const wx = (window as any).wx;
      wx.updateAppMessageShareData({
        title: config.title,
        desc: config.desc,
        link: config.link || window.location.href,
        imgUrl: config.imgUrl,
      });
      wx.updateTimelineShareData({
        title: config.title,
        link: config.link || window.location.href,
        imgUrl: config.imgUrl,
      });
    }
  }, [config.title, config.desc, config.imgUrl, config.link]);
}
