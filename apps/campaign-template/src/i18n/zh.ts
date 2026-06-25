import type { I18nMessages } from "./types";

export const zh: I18nMessages = {
  scaffold: {
    title: "活动脚手架",
    description: "组件设计卡确认后，用真实 Section 替换这个中性脚手架。",
    checklist: [
      "写代码前先定义每个 Section 的职责。",
      "只声明真实存在的状态。",
      "完成一个 Section 并验证通过后，再开始下一个。",
    ],
    loading: "活动脚手架加载中...",
    error: "活动脚手架加载失败。",
  },
  errors: {
    campaign_info_missing_required: "活动信息缺少必填字段。",
    campaign_load_failed: "活动加载失败。",
  },
};
