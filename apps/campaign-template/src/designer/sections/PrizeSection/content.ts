import type { PrizeContent } from './types';

export const defaultContent: PrizeContent = {
  title: '奖品展示',
  prizes: [
    { name: '一等奖：iPhone 16' },
    { name: '二等奖：AirPods' },
    { name: '三等奖：50元红包' },
    { name: '幸运奖：精美周边' },
  ],
  drawButtonText: '抽奖',
  winRate: 0.2,
};
