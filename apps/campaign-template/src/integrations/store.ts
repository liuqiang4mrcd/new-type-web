import { create } from 'zustand';
import { storage } from '@new-type/utils';
import type { SectionState } from '../contracts/section';
import type { HeroContent } from '../designer/sections/HeroSection/types';
import type { RuleContent } from '../designer/sections/RuleSection/types';
import type { PrizeContent } from '../designer/sections/PrizeSection/types';
import { CAMPAIGN_CONFIG } from './constants';

/* ── Store 类型 ── */

export interface LotteryInfo {
  dailyQuota: number;
  usedCount: number;
  isJoined: boolean;
  lastResult: { prize: string; isWin: boolean } | null;
}

export interface AppStore {
  // 各 section 状态
  hero: SectionState<HeroContent>;
  rules: SectionState<RuleContent>;
  prize: SectionState<PrizeContent>;

  // 抽奖状态
  lottery: LotteryInfo;
  drawing: boolean;
  showPrizeModal: boolean;

  // 全局 actions
  loadCampaign: () => Promise<void>;

  // 抽奖 actions
  drawLottery: () => Promise<void>;
  closePrizeModal: () => void;
  resetLottery: () => void;
}

/* ── 默认数据 ── */

const defaultLottery: LotteryInfo = {
  dailyQuota: 3,
  usedCount: storage.get<number>('lottery_used') ?? 0,
  isJoined: storage.get<boolean>('campaign_joined') ?? false,
  lastResult: null,
};

/* ── Store ── */

export const useStore = create<AppStore>((set, get) => ({
  /* initial states */
  hero: { status: 'loading' },
  rules: { status: 'loading' },
  prize: { status: 'loading' },
  lottery: defaultLottery,
  drawing: false,
  showPrizeModal: false,

  /* 加载活动数据（模拟 API） */
  loadCampaign: async () => {
    try {
      // 模拟网络请求
      await new Promise((r) => setTimeout(r, 800));

      set({
        hero: {
          status: 'ready',
          content: {
            title: CAMPAIGN_CONFIG.name,
            subtitle: CAMPAIGN_CONFIG.shareDesc,
            ctaText: '立即参与',
            endTime: CAMPAIGN_CONFIG.endTime,
          },
        },
        rules: {
          status: 'ready',
          content: {
            title: '活动规则',
            rules: [
              `活动时间：${new Date(CAMPAIGN_CONFIG.startTime).toLocaleDateString()} - ${new Date(CAMPAIGN_CONFIG.endTime).toLocaleDateString()}`,
              '每位用户每天可参与 3 次',
              '中奖结果将在页面实时展示',
              '最终解释权归主办方所有',
            ],
          },
        },
        prize: {
          status: 'ready',
          content: {
            title: '奖品展示',
            prizes: [
              { name: '一等奖：iPhone 16' },
              { name: '二等奖：AirPods' },
              { name: '三等奖：50元红包' },
              { name: '幸运奖：精美周边' },
            ],
            drawButtonText: '抽奖',
            winRate: 0.2,
          },
        },
      });
    } catch {
      set({
        hero: { status: 'error', error: '活动数据加载失败' },
        rules: { status: 'error', error: '活动规则加载失败' },
        prize: { status: 'error', error: '奖品信息加载失败' },
      });
    }
  },

  /* 抽奖 */
  drawLottery: async () => {
    const { lottery } = get();
    if (lottery.usedCount >= lottery.dailyQuota) return;

    set({ drawing: true });

    // 模拟抽奖 API
    await new Promise((r) => setTimeout(r, 600));

    const isWin = Math.random() < 0.2;
    const prize = isWin
      ? ['一等奖：iPhone 16', '二等奖：AirPods', '三等奖：50元红包', '幸运奖：精美周边'][
          Math.floor(Math.random() * 4)
        ]
      : '未中奖';

    const newUsed = lottery.usedCount + 1;
    storage.set('lottery_used', newUsed);

    set({
      drawing: false,
      showPrizeModal: true,
      lottery: {
        ...lottery,
        usedCount: newUsed,
        lastResult: { prize, isWin },
      },
    });
  },

  closePrizeModal: () => set({ showPrizeModal: false }),

  resetLottery: () => {
    storage.remove('lottery_used');
    storage.remove('campaign_joined');
    set({
      lottery: { dailyQuota: 3, usedCount: 0, isJoined: false, lastResult: null },
      showPrizeModal: false,
    });
  },
}));
