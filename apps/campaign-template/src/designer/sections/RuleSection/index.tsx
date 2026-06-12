import type { SectionProps } from '../../../contracts/section';
import type { RuleContent } from './types';

export function RuleSection({ content }: SectionProps<RuleContent>) {
  return (
    <section className="px-6 py-10 bg-gray-50">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-800">
        {content.title}
      </h2>
      <ul className="space-y-3">
        {content.rules.map((rule, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-gray-600 text-sm"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs shrink-0 mt-0.5">
              {index + 1}
            </span>
            {rule}
          </li>
        ))}
      </ul>
    </section>
  );
}
