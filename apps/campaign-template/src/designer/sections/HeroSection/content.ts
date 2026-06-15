import type { HeroContent } from './types';
import type { StateDeclaration } from '../../../contracts/section';

export const supportedStates: StateDeclaration[] = [
  { key: 'loading', type: 'ui', required: true },
  { key: 'empty', type: 'ui', required: true },
  { key: 'error', type: 'ui', required: true },
  { key: 'beforeStart', type: 'business', required: true },
  { key: 'inProgress', type: 'business', required: true },
  { key: 'ended', type: 'business', required: true },
] as const;

export const stateData: Record<string, Partial<HeroContent>> = {
  loading: { title: '加载中...' },
  empty: { title: '', subtitle: '', ctaText: '' },
  error: { title: '加载失败' },
  beforeStart: {
    title: '活动即将开始',
    subtitle: '精彩内容敬请期待',
    ctaText: '敬请期待',
    endTime: Date.now() + 86400000 * 7,
  },
  inProgress: {
    title: '夏日狂欢季',
    subtitle: '超多好礼等你来拿',
    ctaText: '立即参与',
    endTime: Date.now() + 86400000 * 3,
  },
  ended: {
    title: '活动已结束',
    subtitle: '感谢您的参与',
    ctaText: '查看结果',
    endTime: 0,
  },
};

export const defaultContent: HeroContent = {
  title: '夏日狂欢季',
  subtitle: '超多好礼等你来拿',
  ctaText: '立即参与',
  endTime: new Date('2026-06-30T23:59:59').getTime(),
};
