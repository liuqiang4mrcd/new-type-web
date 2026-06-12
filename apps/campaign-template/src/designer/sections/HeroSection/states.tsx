import type { ComponentType } from 'react';

export const HeroLoading: ComponentType<{ message?: string }> = () => (
  <section className="relative w-full min-h-[60vh] bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center px-4">
    <div className="w-48 h-8 bg-white/20 rounded animate-pulse mb-4" />
    <div className="w-64 h-5 bg-white/20 rounded animate-pulse mb-6" />
    <div className="w-24 h-10 bg-white/20 rounded-full animate-pulse" />
  </section>
);

export const HeroEmpty: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="relative w-full min-h-[60vh] bg-gradient-to-b from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white/70 px-4">
    <p className="text-lg">{message || '暂无活动内容'}</p>
  </section>
);

export const HeroError: ComponentType<{ message?: string }> = ({ message }) => (
  <section className="relative w-full min-h-[60vh] bg-gradient-to-b from-red-400 to-orange-500 flex flex-col items-center justify-center text-white px-4">
    <p className="text-lg font-bold mb-2">加载失败</p>
    <p className="text-sm opacity-80">{message || '请稍后重试'}</p>
  </section>
);
