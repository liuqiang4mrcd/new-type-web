import { useCountdown } from '@new-type/hooks';
import type { SectionProps } from '../../../contracts/section';
import type { HeroContent } from './types';

export function HeroSection({ content }: SectionProps<HeroContent>) {
  const { days, hours, minutes, seconds } = useCountdown(content.endTime);

  return (
    <section className="relative w-full min-h-[60vh] bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white px-4">
      <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
      <p className="text-lg mb-6 opacity-90">{content.subtitle}</p>

      <div className="flex items-center gap-2 text-lg mb-8">
        <span>距结束</span>
        <span className="bg-white/20 rounded px-2 py-1">
          {String(days).padStart(2, '0')}天
        </span>
        <span className="bg-white/20 rounded px-2 py-1">
          {String(hours).padStart(2, '0')}时
        </span>
        <span className="bg-white/20 rounded px-2 py-1">
          {String(minutes).padStart(2, '0')}分
        </span>
        <span className="bg-white/20 rounded px-2 py-1">
          {String(seconds).padStart(2, '0')}秒
        </span>
      </div>

      <button className="bg-white text-blue-600 font-bold px-8 py-3 rounded-full text-lg shadow-lg active:scale-95 transition-transform">
        {content.ctaText}
      </button>
    </section>
  );
}
