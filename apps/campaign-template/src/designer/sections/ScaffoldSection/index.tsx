import type { SectionProps } from '../../../contracts/section';
import type { ScaffoldContent } from './types';

export function ScaffoldSection({ content }: SectionProps<ScaffoldContent>) {
  return (
    <section className="min-h-screen bg-[#f7f8fb] px-[40px] py-[72px] text-[#1f2937]">
      <div className="rounded-[24px] border border-[#d8deea] bg-white p-[36px] shadow-sm">
        <p className="text-[22px] font-bold uppercase tracking-[0.12em] text-[#667085]">
          scaffold
        </p>
        <h1 className="mt-[16px] text-[44px] font-black leading-tight">
          {content.title}
        </h1>
        <p className="mt-[18px] text-[26px] leading-[38px] text-[#475467]">
          {content.description}
        </p>
        <div className="mt-[34px] grid gap-[16px]">
          {content.checklist.map((item) => (
            <div
              key={item}
              className="rounded-[18px] border border-[#e4e7ec] bg-[#f9fafb] px-[22px] py-[18px] text-[24px] font-medium leading-[34px]"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
