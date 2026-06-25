# 国际化规则

> 适用于 H5 活动页模板和每个独立 campaign。目标是让多语言文案不污染视觉层和接口层，同时支持 LTR / RTL 布局方向。

## 核心原则

```txt
URL search
  -> @new-type/utils parseLocaleSearch
  -> integrations/store.ts ui.lang / ui.textDirection
  -> runtime/container 选择当前语言文案
  -> designer/sections/* 只接收最终展示字符串
```

- `packages/utils` 只提供通用 locale / direction 解析纯函数，不包含任何活动文案。
- 每个 campaign 在 `src/i18n/` 维护自己的语言资源，按语言拆文件：`en.ts`、`zh.ts`、`ar.ts` 等。
- 默认语言为英文，默认方向为 `ltr`。
- `lang` 通过 URL query 读取：`?lang=en`、`?lang=zh`、`?lang=ar`。
- `dir` 可通过 URL query 临时覆盖：`?dir=ltr`、`?dir=rtl`，用于 RTL 调试；未传时由语言推导。
- runtime 根节点必须设置 `lang` 和 `dir`，并同步到 `document.documentElement`。

## 文案归属

| 类型 | 归属 | 说明 |
| --- | --- | --- |
| 设计样例文案 | `designer/sections/*/content.ts` | 只能作为默认语言下的视觉样例 |
| runtime 静态 UI 文案 | `src/i18n/<lang>.ts` | 按当前 `ui.lang` 选择 |
| 接口业务文案 | API DTO / adapter | 后端返回或 adapter 映射，不能反向污染 Section 类型 |
| loading / empty / error | `src/i18n/<lang>.ts` + runtime container | `states.tsx` 可保留默认 fallback，但 runtime 正常路径必须传入 i18n message |

## defaultContent 规则

- `defaultContent` 可以由 i18n content factory 生成，但必须固定使用默认语言。
- `defaultContent` 禁止读取 `window.location`、URL query、Zustand store 或当前 runtime language。
- `defaultContent` 仍只用于 `designer/` 和 `playground/`，不能作为 runtime fallback。

推荐：

```ts
import { DEFAULT_LANG, getI18nMessages } from "../../../i18n";

const messages = getI18nMessages(DEFAULT_LANG);

export const defaultContent = {
  title: messages.example.title,
};
```

禁止：

```ts
const messages = getI18nMessages(getCurrentLangFromUrl());

export const defaultContent = {
  title: messages.example.title,
};
```

## 视觉组件使用方式

视觉组件不直接 import i18n。组件的 `Content` 继续声明最终展示语义：

```ts
export interface ClaimContent {
  title: string;
  buttonText: string;
  countText: string;
}
```

runtime container 或 adapter 按当前语言组装最终字符串：

```ts
const lang = useStore((s) => s.ui.lang);
const messages = getI18nMessages(lang);
const content = {
  title: messages.claim.title,
  countText: messages.claim.countText.replace("{count}", String(count)),
};

return <ClaimSection content={content} />;
```

## RTL 要求

- runtime 根节点必须设置 `dir={textDirection}`。
- 新 Section 布局应尽量使用逻辑属性或 flex/grid 对齐，不把 `left/right` 语义写死为业务含义。
- 方向敏感的图标、箭头、进度方向需要在组件设计卡中注明 RTL 行为。
- 至少用 `?lang=ar` 或 `?dir=rtl` 检查文本流向、按钮顺序和横向溢出。
