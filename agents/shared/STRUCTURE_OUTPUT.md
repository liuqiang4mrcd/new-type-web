# 结构规划输出规则

> `designer` agent 在结构规划阶段（structure-planning skill）必须遵守的 Section 拆分决策树和输出模板。
>
> 本文件确保不同模型对同一张原型图产出结构一致的 Section 拆分方案。

---

## 一、Section 拆分决策树

在推理每个视觉容器/业务闭环是否为独立 Section 前，必须按顺序经过以下四个决策节点。

### 节点 1：数据来源

判断 Section 是否需要异步数据。

| 取值 | 含义 | 后果 |
|------|------|------|
| `静态展示` | 纯视觉展示，无接口数据需求（如纯装饰图、静态标题） | 无需 contract.ts 和 adapter |
| `动态数据` | 数据由接口返回（如榜单列表、奖励进度、用户信息） | 结构阶段必须声明后续 integration 所需的 contract / adapter / fixture 需求；实际创建或接入只能在用户明确进入 integration 阶段后执行 |

判断依据：该 Section 展示的内容是否会在运行时因用户/时间/接口状态而变化。倒计时属于计算值（非接口数据），仍算 `静态展示`。

边界说明：`动态数据` 是结构规划结论，不授权 designer 在实现阶段自动创建 `contract.ts`、adapter、fixture 或接入真实 API。接口文件创建、DTO 映射、fixture 和真实 store action 归 `integration` agent，只有用户明确提出接口接入或联调任务时才执行。

### 节点 2：业务闭环完整性

判断该模块是否拥有独立的业务闭环和状态管理。

| 取值 | 含义 | 后果 |
|------|------|------|
| `独立` | 该模块拥有完整独立的业务闭环和内部状态管理 | 独立 Section |
| `附属` | 该模块是同一视觉卡片/同一业务区域内的组成部分，无独立状态 | 合并入宿主 Section |

判断依据：
- 独立：该模块有自己的 status（loading/empty/error/ready），或者有自己的交互状态转换（stateTransitions）
- 附属：该模块只是宿主卡片中的一个展示区块，状态跟随宿主 Section

> 注意：此节点与 `agents/shared/DESIGN_OUTPUT.md` 第 56 行的 Section 边界规则一致——"同一视觉卡片/同一业务闭环内的展示、按钮、领取态和局部切换默认属于同一个 Section，禁止为了让实现更方便而拆出孤立按钮 Section 或孤立状态 Section"。

### 节点 3：Tab 归属

判断该模块与 Tab 切换的关系。

| 取值 | 含义 | 后果 |
|------|------|------|
| `无` | 该 Section 不涉及 Tab | 无特殊处理 |
| `自身控制` | Tab 切换仅影响该 Section 自身内部内容 | Tab 作为 Section 内部组件，使用本地状态管理 |
| `跨Section控制` | Tab 切换会影响其他 Section 的显隐或内容 | ⚠️ **必须标记 AFFECTED_SECTIONS** |

**`跨Section控制` 的额外要求：**

当一个 Tab 切换会影响其他 Section 的可见性或内容时，在 structure.md 的 Section 表格下方必须增加 `## Tab 跨 Section 控制` 区段：

```markdown
## Tab 跨 Section 控制

| 源 Section | Tab 名 | AFFECTED_SECTIONS | 显隐规则 |
|------------|--------|-------------------|----------|
| GiftActivitySection | 圣宴/榜单 | [feastTab → RoomStatus, RewardProgress, FeastReward 显示; Leaderboard 隐藏] / [leaderboardTab → Leaderboard 显示; RoomStatus, RewardProgress, FeastReward 隐藏] | 互斥，同一时间只有一个 Tab 组可见 |
```

此信息会直接影响 `runtime/app.tsx` 的条件渲染逻辑。

### 节点 4：弹窗复杂度

判断弹窗类的交互复杂度。

| 取值 | 含义 | 后果 |
|------|------|------|
| `非弹窗` | 普通 Section，不是弹窗 | 正常处理 |
| `纯展示` | 弹窗仅用于展示信息，无交互（规则说明、信息提示） | 独立 Section，但无需复杂状态机 |
| `有交互` | 弹窗内有选择、确认、列表、表单等交互逻辑 | 独立 Section，含 stateTransitions |

弹窗 Section 的额外规则：
- 所有弹窗 Section 的 types.ts 中 Content 必须包含 `isOpen: boolean` 和 `displayMode?: 'inline' \| 'overlay'`
- `isOpen` 默认为 `false`
- `pureDisplay` 弹窗如只有展示+关闭，不需要 states.tsx；`interactive` 弹窗需要根据交互复杂度决定

---

## 二、Section 列表输出模板

结构规划阶段当前 feedback 工作区的 `structure.md` 必须使用以下表格格式：

```markdown
| 顺序 | Section | 职责 | 数据来源 | 业务闭环 | Tab归属 | 弹窗复杂度 | 关键数据字段 |
|------|---------|------|----------|----------|---------|-----------|-------------|
| 1 | HeroSection | 顶部主视觉、倒计时、规则入口 | 静态展示 | 独立 | 无 | 非弹窗 | title, dateRange, countdown |
| 2 | GiftSection | 礼物列表+兑换说明 | 静态展示 | 附属 | 自身控制 | 非弹窗 | gifts, exchangeRate |
| 3 | ActionSection | 盛宴/榜单 Tab 切换 | 动态数据 | 独立 | 跨Section控制 | 非弹窗 | activeTab |
```

### 枚举值速查表

| 字段 | 可选值 | 说明 |
|------|--------|------|
| 数据来源 | `静态展示` / `动态数据` | 节点 1 的输出 |
| 业务闭环 | `独立` / `附属` | 节点 2 的输出 |
| Tab归属 | `无` / `自身控制` / `跨Section控制` | 节点 3 的输出 |
| 弹窗复杂度 | `非弹窗` / `纯展示` / `有交互` | 节点 4 的输出 |

---

## 三、Tab 跨 Section 控制输出规则（P1）

### 3.1 何时触发

当某个 Section 的 `Tab归属 = 跨Section控制` 时，必须在 structure.md 中**额外输出以下区段**：

```markdown
## Tab 跨 Section 控制

| 源 Section | Tab 名 | AFFECTED_SECTIONS | 显隐规则 |
|------------|--------|-------------------|----------|
| GiftActivitySection | 圣宴 | feastTab→显示: RoomStatusSection, RewardProgressSection, FeastRewardSection | feastTab 激活时，榜单相关隐藏 |
| GiftActivitySection | 榜单 | leaderboardTab→显示: LeaderboardSection | leaderboardTab 激活时，剧情向 Section 隐藏 |
```

### 3.2 运行时影响

`Tab归属 = 跨Section控制` 的 Tab 会导致 `runtime/app.tsx` 产生条件渲染分支：

```tsx
// runtime/app.tsx 示例：基于 Tab 状态条件渲染
export function RuntimePage() {
  const activeContentTab = useStore((s) => s.ui.activeContentTab);

  return (
    <main>
      <HeroContainer />
      <ActionContainer />
      {activeContentTab === 'feast' ? (
        <>
          <RoomContainer />
          <FeastProgressContainer />
        </>
      ) : (
        <RankingContainer />
      )}
      <RuleModalContainer />
      ...
    </main>
  );
}
```

### 3.3 Playground 对齐

`Tab归属 = 跨Section控制` 的 Tab 在 Playground 流程预览中必须作为 fullpage 场景的分支条件，不能作为 module 场景独立展示。

---

## 四、与下游文件的字段映射

| structure.md 字段 | 下游用途 | 影响文件 |
|-------------------|----------|----------|
| `数据来源` | 决定是否需要声明 integration 阶段的 `contract.ts` + adapter + fixture 需求 | `integrations/adapters/`、`integrations/fixtures/` |
| `业务闭环` | 决定 Section 文件结构（独立 tsx vs 合并） | `designer/sections/<Name>/` |
| `Tab归属` | 决定 runtime 渲染架构 | `runtime/app.tsx` |
| `弹窗复杂度` | 决定 types.ts 中 Content 接口的字段 | `designer/sections/<Name>/types.ts` |
| `关键数据字段` | 为 types.ts 中 Content 接口提供字段依据 | `designer/sections/<Name>/types.ts` |

---

## 七、Section 依赖矩阵

结构规划阶段必须分析 Section 间的依赖关系，用于 Phase 5 判断哪些 Section 可并行创建脚手架。

### 判断规则

两个 Section 相互独立的条件（同时满足）：

1. 在 Interaction Spec 中互不为 `targetSection`
2. 不共享同一 Store action（open/close 类通用弹窗 action 如 `openRule`/`closeRule` 除外）
3. 不在 runtime/app.tsx 的同一条件渲染分支内（即不受同一 Tab 显隐控制）

### 输出格式

```markdown
## Section 依赖矩阵

| Section A | Section B | 依赖关系 | 可并行脚手架 |
|-----------|-----------|---------|-------------|
| HeroSection | GiftSection | 无 | ✅ |
| GiftSection | RuleModal | GiftSection 的 onRuleClick 打开 RuleModal | ❌ |
| GiftSection | RewardModal | GiftSection 的 onClaimClick 打开 RewardModal | ❌ |
| HeroSection | RuleModal | 无（HeroSection 也触发 onRuleClick，但这是通用弹窗 action） | ✅ |
```

### 用途

- 实现阶段：允许对标记为 ✅ 的 Section 并行创建目录和文件骨架
- 验证阶段：对标记为 ✅ 的 Section 仍需逐个验证，但可并行准备脚手架

结构规划完成并写入当前 feedback 工作区的 `structure.md` 后，设计者必须逐条确认：

- [ ] 每个 Section 的 4 个枚举字段都已填写，没有遗漏
- [ ] `数据来源` 为 `动态数据` 的 Section 在后续实现中会创建 contract.ts + adapter
- [ ] `业务闭环` 为 `附属` 的 Section 已确认其宿主 Section 能承载该展示内容
- [ ] `Tab归属` 为 `跨Section控制` 的 Section 已在 structure.md 中输出 `## Tab 跨 Section 控制` 区段
- [ ] `弹窗复杂度` 为 `有交互` 的 Section 在 types.ts 中包含 `isOpen` 和 `displayMode` 字段
- [ ] Layout Spec 中的每个视觉容器都有对应的 Section 归属
- [ ] Interaction Spec 中的每条交互映射到对应 Section 的 action handler
