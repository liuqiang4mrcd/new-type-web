import type { ComponentType } from 'react';

export const CountdownTimerLoading: ComponentType<{ message?: string }> = () => (
  <section className="flex items-center justify-center gap-2 px-4 py-6 bg-gradient-to-r from-blue-500 to-purple-600">
    <div className="w-16 h-10 bg-white/20 rounded animate-pulse" />
    <span className="text-white/60 font-bold">:</span>
    <div className="w-16 h-10 bg-white/20 rounded animate-pulse" />
    <span className="text-white/60 font-bold">:</span>
    <div className="w-16 h-10 bg-white/20 rounded animate-pulse" />
  </section>
);

export const CountdownTimerEmpty: ComponentType<{ message?: string }> = () => (
  <section className="flex items-center justify-center px-4 py-6">
    <p className="text-gray-400">倒计时暂无数据</p>
  </section>
);

export const CountdownTimerError: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="flex items-center justify-center px-4 py-6 bg-red-50">
    <p className="text-sm text-red-400">{message || '倒计时加载失败'}</p>
  </section>
);
