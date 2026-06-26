---
name: visual-design
description: H5 活动页视觉细化能力模块。用于 designer agent 的第 3 步和视觉修改，产出配色、字体、间距、组件尺寸、质感、多语言和可落地视觉说明。
---

# Visual Design Skill

用于视觉细化和视觉修改。开始前按需读取：

- 当前 feedback 工作区的 `demand.md`
- 当前 feedback 工作区的 `structure.md`
- `agents/shared/DESIGN.md` 中与当前视觉问题相关的章节
- 当存在原型图/视觉参考图冲突时，读取 `agents/shared/DESIGN_INPUT.md` 的冲突处理章节

## 输入

从以下来源继承约束；若文件已在当前阶段读取且未变化，不重复读取全文：

- 当前 feedback 工作区的 `demand.md`
- 当前 feedback 工作区的 `structure.md`
- 用户提供的视觉参考图、品牌规范、文字描述。
- 用户显式指定的视觉方向。

结构不能被视觉参考图擅自改变。若视觉参考图的结构更好，必须先向用户确认。

## 视觉细化内容

必须写入当前 feedback 工作区的 `design.md`：

- 配色：主色、辅助色、中性色、状态色、背景色。
- 字体：字体族、字号层级、字重、行高。
- 间距：页面边距、Section 间距、组件内 gap。
- 圆角、描边、阴影、质感和装饰语言。
- 关键组件样式：Header、倒计时、Tab、用户信息、进度条、奖品卡、CTA、排行榜、弹窗。
- 750px 设计稿写法：CSS/Tailwind 中直接写设计稿 px，构建时由 `postcss-mobile-forever` 转换为 vw；JS 运行时尺寸使用 `@new-type/utils` 的 `vw()`。
- 多语言和长文案策略：标题自适应、按钮文案换行或压缩、重要信息不被遮挡。
- 可点击性和可读性：移动端触控热区、文字对比度、安全区。
- 图片占位策略：根据 `structure.md` 的 `Image Asset Inventory`，定义默认 SVG 占位图的风格、尺寸、配色、文件命名和替换策略。

语言要求：

- 当前 feedback 工作区的 `design.md` 和对用户输出的视觉方案默认使用中文。
- 颜色值、字体名、CSS/Tailwind 写法、文件路径、命令和代码标识符保留英文。
- UI 文案策略默认以英文活动页为基准；仅当用户明确要求中文、多语言或素材必须按原文还原时，才输出中文、多语言或原文还原方案。

## 设计底线

- 首屏必须有明确主视觉焦点。
- 核心标题、核心卖点、主按钮在常见手机尺寸中清晰可见。
- 不为视觉复杂牺牲可读性、可点击性和开发成本。
- 卡片、按钮、列表、弹窗风格必须在同页内统一。
- 关键元素不能被装饰遮挡。
- 大面积背景必须保证前景文字可读。
- 不使用无法落地或需要大量不可控素材的视觉方案，除非用户明确接受成本。

## 图片资源

图片引用、渲染方式、placeholder 目录、fallback 和 `@/assets/...` import 规则以 `agents/shared/DESIGN_OUTPUT.md` 的 `Image Asset Inventory Schema`、`Image Asset Gate` 和“图片引用和使用规则”为唯一实现权威。本节只补充视觉阶段如何定义图片风格。

需要生成图片资源时：

- 风格以视觉参考图和文字描述为依据。
- 同一页面生成图片风格必须统一。
- prompt 明确：风格、配色、构图、`not photorealistic`、`no text` 等约束。
- 生成资源放入目标 app 的资源目录，不写入 `apps/campaign-template/`。

### SVG 占位图策略

当当前阶段没有真实图片或接口图片时，默认使用目标 app 内的 SVG 占位图，不允许用纯色 `div`、emoji 或 CSS 方块替代图片语义。

占位图规则：

- 默认目录：`apps/<campaign-name>/src/assets/placeholders/`。
- 文件命名必须语义化，例如 `hero-bg.svg`、`gift-box.svg`、`reward-card.svg`、`room-avatar.svg`、`feast-image.svg`、`ranking-badge.svg`。
- 实现引用必须使用 `@/assets/placeholders/...`，禁止在组件中使用相对路径引用占位图。
- SVG 风格必须继承当前视觉方案的主色、描边、质感和圆角；同一页面占位图风格统一。
- 占位图不写真实 UI 文案；必要标识使用简单图形，不使用会干扰多语言的文字。
- 动态业务图片的 `defaultContent` 可以引用 SVG 占位图，但 runtime 动态 Section 未接接口时仍不得把 `defaultContent` 作为 fallback。
- 静态装饰或背景可使用 SVG 作为 CSS `background-image`；业务图片默认用 `<img>` 引用 SVG。

视觉方案必须说明每个 `Image Asset Inventory` 项的占位图风格和最终替换方式。

## 完成标准

- 当前 feedback 工作区的 `design.md` 已存盘。
- `design.md` 已包含图片占位策略，并与 `structure.md` 的 `Image Asset Inventory` 对齐。
- 当前 feedback 工作区的 `progress.md` 已更新。
- 新项目模式下，用户已书面确认视觉设计。
- 进入实现前，designer agent 已输出完整设计方案摘要并获得“可以开始实现”的书面确认。
