# new-type-web — H5 活动页面开发平台

pnpm + Nx monorepo，提供 H5 活动页面的开发、设计和部署能力。

| 属性 | 说明 |
|---|---|
| 技术栈 | React 18 + TypeScript + TailwindCSS + Zustand + Vite |
| 构建 | Nx 编排，pnpm workspace |
| 设计规范 | 750px 设计稿，postcss-pxtorem 自动转换 |

**目录结构：**

```
apps/
  campaign-template/     # 活动模板应用
packages/
  ui/                    # 通用 UI 组件
  hooks/                 # 通用 React Hooks
  request/               # 网络请求封装
  utils/                 # 工具函数
  analytics/             # 数据分析
  config/                # 统一配置
  headless/              # Headless 逻辑层
```

**关键文档：**

| 文件 | 用途 |
|---|---|
| `docs/campaign-template.md` | 活动页模板结构、Section 创建流程、Playground 注册方式 |
| `docs/architecture.md` | 项目整体架构理解 |
| `docs/ai/development-rules.md` | AI 开发约束（三层架构、目录边界、命名规范） |
| `docs/ai/framework-map.md` | 共享包引用地图（什么功能用哪个包） |

---

# 项目 Agent 调用规则

## 优先级规则

当多个 skill 或 agent 同时命中同一触发场景时，优先级从高到低为：

1. **本仓库声明的 agent 和 skill**（`agents/*.md`）— 最高优先级
2. 工作区配置（项目根目录 `.opencode/` 与用户 `~/.config/opencode/` 中的 skill）
3. 内置 / 插件提供的 skill 和 agent

> **覆盖规则**：对于 Designer agent（`agents/designer.md`），当用户需求明确定义了**设计方向（视觉风格、布局偏好、色彩方案）**时，以用户的显式输入为准，覆盖本仓库任何默认设定。非设计类 agent 依然遵循本优先级规则。

## 项目 Agents 体系

```
agents/
├── designer.md          # AI 设计师助手 — 与设计师交互，辅助设计 H5 活动页
└── shared/
    ├── DESIGN.md        # H5 活动页设计规范（画布、布局、色彩、字体、组件尺寸等）
    ├── DESIGN_INPUT.md  # 设计素材输入规则（原型图/视觉参考图职责边界）
    └── DESIGN_OUTPUT.md # 设计输出规则（操作范围、Section 格式、Playground 注册）
```

- `agents/*.md` — 可调用的 agent 定义
- `agents/shared/*.md` — 被 agent 或 skill 引用的共享规则文档，不可直接调用

## 自动触发规则

以下场景必须自动调用对应的 agent，无需用户手动 @指定：

## 新建活动项目强约束

当用户需求包含“新建项目 / 新活动 / 创建活动 / 生成新项目”时：

- 必须在 `apps/<campaign-name>/` 下创建独立项目。
- `apps/campaign-template/` 只能作为复制源，禁止作为业务实现目录。
- 写代码前必须先确认目标 app 目录；如果目标 app 不存在，先复制 `apps/campaign-template` 到 `apps/<campaign-name>`。
- 推荐使用 `pnpm create-campaign <campaign-name>` 创建项目，避免手动落错目录。
- 业务 Section、runtime、store、playground 注册都只能写入目标 app。
- 完成前必须检查 `apps/campaign-template` 无非预期 diff。

### designer — H5 活动页设计与修改

当用户需求涉及 H5 活动页的**创建、修改或视觉调整**时，自动调用 `designer` agent：

| 触发场景 | 示例 |
|---|---|
| 创建新活动页面 | "设计一个抽奖活动页面"、"创建签到活动" |
| 修改活动样式 | "改一下这个活动的配色"、"按钮样式调一下" |
| 调整布局/结构 | "把排行榜移到下面"、"增加一个奖品区" |
| 视觉细节调整 | "标题字体再大一点"、"背景换成金色" |
| 活动模板相关 | "创建新的活动模板"、"基于这个模板改" |

> **新项目创建门禁**：当触发场景为**"创建新活动页面"**（含基于图片/原型图创建）时，`designer` agent 必须先输出完整的设计方案提案（包含项目目录、Section 拆分方案、结构锁定表、视觉方向），**等待用户书面确认后**，才能进入代码实现阶段。禁止跳过方案确认直接写代码。

设计依据：
- `agents/designer.md` — designer agent 定义
- `agents/shared/DESIGN.md` — 设计规范底线
- `agents/shared/DESIGN_INPUT.md` — 素材输入与冲突处理规则
- `agents/shared/DESIGN_OUTPUT.md` — 输出范围与格式规范
