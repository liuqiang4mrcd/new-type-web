import type { SectionProps } from '../../../contracts/section';
import type { CountdownTimerContent } from './types';

export function CountdownTimer({ content }: SectionProps<CountdownTimerContent>) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="bg-gray-800 text-white rounded px-1.5 py-0.5 min-w-[48px] text-center">
        {String(content.days).padStart(2, '0')}
      </span>
      <span className="text-gray-500">:</span>
      <span className="bg-gray-800 text-white rounded px-1.5 py-0.5 min-w-[48px] text-center">
        {String(content.hours).padStart(2, '0')}
      </span>
      <span className="text-gray-500">:</span>
      <span className="bg-gray-800 text-white rounded px-1.5 py-0.5 min-w-[48px] text-center">
        {String(content.minutes).padStart(2, '0')}
      </span>
      <span className="text-gray-500">:</span>
      <span className="bg-gray-800 text-white rounded px-1.5 py-0.5 min-w-[48px] text-center">
        {String(content.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
