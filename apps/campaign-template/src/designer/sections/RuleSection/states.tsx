import type { ComponentType } from 'react';

export const RuleLoading: ComponentType<{ message?: string }> = () => (
  <section className="px-6 py-10 bg-gray-50">
    <div className="w-24 h-6 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse shrink-0 mt-0.5" />
          <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </section>
);
