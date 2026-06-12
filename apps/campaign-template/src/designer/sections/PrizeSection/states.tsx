import type { ComponentType } from 'react';

export const PrizeLoading: ComponentType<{ message?: string }> = () => (
  <section className="px-6 py-10">
    <div className="w-24 h-6 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
    <div className="grid grid-cols-2 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl p-12 bg-gray-100 animate-pulse" />
      ))}
    </div>
    <div className="w-32 h-10 bg-gray-200 rounded-full animate-pulse mx-auto" />
  </section>
);

export const PrizeEmpty: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="px-6 py-10 text-center text-gray-400">
    <p>{message || '暂无奖品信息'}</p>
  </section>
);

export const PrizeError: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="px-6 py-10 text-center text-red-400">
    <p className="font-bold">奖品加载失败</p>
    <p className="text-sm mt-1">{message || '请稍后重试'}</p>
  </section>
);
