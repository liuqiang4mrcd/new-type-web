---
name: requirement-collection
description: H5 活动页需求收集能力模块。用于 designer agent 的第 1 步，产出 demand.md。
---

# Requirement Collection Skill

用于需求收集和素材分析。本模块只覆盖需求收集，不输出 Section 拆分、Layout Spec、Interaction Spec 或 Effect Spec。

## 读取策略

必读：

- 本文件的"流程"
- `agents/shared/DESIGN_INPUT.md` 中与素材输入、原型图/视觉参考图职责边界相关的章节

条件读取：

- 需要确认视觉底线时，读取 `agents/shared/DESIGN.md` 的相关章节，不默认全文预读。
- 需要判断模板目录、Playground 或 Runtime 注册方式时，读取 `docs/campaign-template.md` 的相关章节。

## 流程

### 需求收集

必须明确并写入当前 feedback 工作区的 `demand.md`：

- 活动类型：抽奖、充值、排行榜、品牌宣传等。
- 输入素材：原型图、视觉参考图、文字描述。
- 视觉约束：品牌色、字体、风格、禁用方向。
- 目标受众和终端：默认移动端 H5。
- 目标 app：新项目为 `apps/<campaign-name>`，未确认时保持 pending。

### 素材职责边界（需求阶段）

本阶段只在素材层面区分原型图与视觉参考图的职责，不执行完整结构分析：

- 原型图负责结构：页面数量、模块顺序、内容类型、元素数量、相对位置。
- 视觉参考图负责视觉：配色、质感、字体气质、光影、描边、装饰复杂度、背景氛围。

冲突规则（需求阶段记录原则，不作为本阶段决策）：

- 结构以原型图为准。
- 视觉以视觉参考图和文字描述为准。
- 文字描述与视觉参考图冲突时，文字描述优先。
- 视觉参考图不能改变原型图结构；确需改变时必须先向用户确认。

> 完整冲突处理和结构规划见 `agents/skills/structure-planning/SKILL.md`。

## 输出

- `demand.md`：需求摘要，活动类型、素材清单、视觉约束、目标受众、目标 app。
- `progress.md`：按 `agents/designer.md` 的 Feedback 工作区规则创建或更新。

## 不输出

- Section 拆分
- Layout Spec / Interaction Spec / Effect Spec
- Image Asset Inventory
- 状态适配分析
- Uncertainty List

## 语言要求

- 当前 feedback 工作区下的 `demand.md`、`progress.md` 和对用户输出的需求方案必须使用中文。
- 代码标识符、文件路径、命令和第三方术语保留英文。
- 若素材中存在 UI 文案，必须区分"原图文案"和"建议最终文案"；除非用户明确要求中文、多语言或按素材原文还原，最终展示文案默认规划为英文。

## 写入要求

- 第 1 步开始时按 `agents/designer.md` 的 Feedback 工作区规则创建或更新 `progress.md`。
- 需求摘要确认后写入当前 feedback 工作区的 `demand.md`。
- 更新当前 feedback 工作区 `progress.md` 的"全局流程""当前阶段"和"下一步动作"。
- 禁止只在对话中输出内容而不写入文件。

## 交付检查

- 当前 feedback 工作区的 `demand.md` 已存盘。
- 当前 feedback 工作区的 `progress.md` 已更新。
- 活动类型、素材清单、视觉约束、目标受众已明确。
- 目标 app 已确认或标记为 pending。
