import type { Scenario } from '../types';

export const lotteryWinScenario: Scenario = {
  id: 'lottery-win',
  label: '抽奖 → 中奖 → 领取成功',
  description: '用户参与抽奖并中奖的完整交互流程',
  autoPlayDelay: 2500,
  initialStore: {
    user: { id: 'test_001', name: '测试用户' },
    lottery: { dailyQuota: 3, usedCount: 0, lastResult: null, showResultModal: false },
  },
  steps: [
    {
      id: 'before-draw',
      name: '抽奖前',
      description: '用户进入活动页，看到奖品列表和抽奖按钮',
      sectionId: 'prize',
      status: 'ready',
      store: { lottery: { dailyQuota: 3, usedCount: 0 } },
    },
    {
      id: 'drawing',
      name: '点击抽奖 - 加载中',
      description: '用户点击抽奖按钮，等待抽奖结果',
      sectionId: 'prize',
      status: 'loading',
      store: { lottery: { dailyQuota: 3, usedCount: 0, drawing: true } },
    },
    {
      id: 'win-result',
      name: '中奖结果弹窗',
      description: '中奖弹窗展示奖品信息，用户可点击领取',
      sectionId: 'prize',
      status: 'ready',
      content: {
        title: '奖品展示',
        prizes: [{ name: '一等奖：iPhone 16' }],
        drawButtonText: '抽奖',
        winRate: 0.2,
      },
      store: {
        lottery: {
          dailyQuota: 3,
          usedCount: 1,
          lastResult: { isWin: true, prize: '一等奖：iPhone 16' },
          showResultModal: true,
        },
      },
    },
    {
      id: 'claimed',
      name: '领取成功',
      description: '奖品领取成功，显示成功提示',
      sectionId: 'prize',
      status: 'ready',
      store: {
        lottery: {
          dailyQuota: 3,
          usedCount: 1,
          lastResult: { isWin: true, prize: '一等奖：iPhone 16', claimed: true },
          showResultModal: false,
        },
      },
    },
  ],
};

export const lotteryLoseScenario: Scenario = {
  id: 'lottery-lose',
  label: '抽奖 → 未中奖',
  description: '用户参与抽奖但未中奖',
  autoPlayDelay: 2000,
  initialStore: {
    user: { id: 'test_001', name: '测试用户' },
    lottery: { dailyQuota: 3, usedCount: 0, lastResult: null, showResultModal: false },
  },
  steps: [
    {
      id: 'before-draw',
      name: '抽奖前',
      sectionId: 'prize',
      status: 'ready',
      store: { lottery: { dailyQuota: 3, usedCount: 0 } },
    },
    {
      id: 'drawing',
      name: '点击抽奖 - 加载中',
      sectionId: 'prize',
      status: 'loading',
      store: { lottery: { dailyQuota: 3, usedCount: 0, drawing: true } },
    },
    {
      id: 'lose-result',
      name: '未中奖弹窗',
      description: '很遗憾，本次未中奖',
      sectionId: 'prize',
      status: 'ready',
      store: {
        lottery: {
          dailyQuota: 3,
          usedCount: 1,
          lastResult: { isWin: false, prize: '未中奖' },
          showResultModal: true,
        },
      },
    },
  ],
};

export const lotteryQuotaExhaustScenario: Scenario = {
  id: 'lottery-quota-exhaust',
  label: '抽奖 → 次数用尽',
  description: '用户当日抽奖次数用完',
  autoPlayDelay: 2000,
  initialStore: {
    user: { id: 'test_001', name: '测试用户' },
    lottery: { dailyQuota: 3, usedCount: 3, lastResult: null, showResultModal: false },
  },
  steps: [
    {
      id: 'quota-exhausted',
      name: '次数已用完',
      description: '用户当日 3 次抽奖机会已用完，按钮置灰',
      sectionId: 'prize',
      status: 'empty',
      store: { lottery: { dailyQuota: 3, usedCount: 3, exhausted: true } },
    },
  ],
};

export const heroSectionScenarios: Scenario = {
  id: 'hero-states',
  label: '首屏 Hero 多态',
  description: '查看 HeroSection 在不同状态下的表现',
  autoPlayDelay: 2500,
  initialStore: {},
  steps: [
    {
      id: 'hero-ready',
      name: '正常状态',
      sectionId: 'hero',
      status: 'ready',
    },
    {
      id: 'hero-loading',
      name: '加载状态',
      sectionId: 'hero',
      status: 'loading',
    },
    {
      id: 'hero-empty',
      name: '空状态',
      sectionId: 'hero',
      status: 'empty',
    },
    {
      id: 'hero-error',
      name: '错误状态',
      sectionId: 'hero',
      status: 'error',
    },
  ],
};

export const scenarios = [
  lotteryWinScenario,
  lotteryLoseScenario,
  lotteryQuotaExhaustScenario,
  heroSectionScenarios,
];
