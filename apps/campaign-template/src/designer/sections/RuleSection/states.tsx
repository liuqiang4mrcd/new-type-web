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

export const RuleEmpty: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="px-6 py-10 bg-gray-50">
    <div className="text-center text-gray-400 py-8">
      <p className="text-lg">{message || '暂无活动规则'}</p>
    </div>
  </section>
);

export const RuleError: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="px-6 py-10 bg-red-50">
    <div className="text-center py-8">
      <p className="text-lg font-bold text-red-500 mb-2">规则加载失败</p>
      <p className="text-sm text-red-400">{message || '请稍后重试'}</p>
    </div>
  </section>
);
