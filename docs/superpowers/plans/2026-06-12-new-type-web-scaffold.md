# new-type-web 项目脚手架实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于架构设计文档 `docs/architecture.md`，搭建完整的 pnpm + Nx + Vite + React 18 + TailwindCSS monorepo 脚手架

**Architecture:** 根目录配置 → 共享配置包 → 工具包 → UI 包 → 活动页模板 → 工程脚本 分层递进

**Tech Stack:** pnpm 9 / Nx 20 / Vite 6 / React 18 / TypeScript 5 / TailwindCSS 3 / Zustand 5

---

## 文件结构总览

```
new-type-web/
├── package.json               # 根 package.json
├── pnpm-workspace.yaml        # workspace 配置
├── nx.json                    # Nx 配置
├── tsconfig.json              # 根 tsconfig
├── .gitignore
├── .npmrc
│
├── packages/
│   ├── config/                # 共享配置（tsconfig/eslint/tailwind/vite presets）
│   │   ├── package.json
│   │   ├── tsconfig/base.json
│   │   ├── tsconfig/react.json
│   │   ├── eslint/base.js
│   │   ├── eslint/react.js
│   │   ├── tailwind/preset.js
│   │   └── vite/campaign-base.ts
│   ├── utils/                 # @new-type/utils
│   │   ├── package.json / tsconfig.json / vite.config.ts
│   │   └── src/index.ts
│   ├── hooks/                 # @new-type/hooks
│   │   ├── package.json / tsconfig.json / vite.config.ts
│   │   └── src/index.ts
│   ├── request/               # @new-type/request
│   │   ├── package.json / tsconfig.json / vite.config.ts
│   │   └── src/index.ts
│   ├── analytics/             # @new-type/analytics
│   │   ├── package.json / tsconfig.json / vite.config.ts
│   │   └── src/index.ts
│   ├── headless/              # @new-type/headless
│   │   ├── package.json / tsconfig.json / vite.config.ts
│   │   └── src/
│   │       ├── index.ts
│   │       └── Tab/
│   │           ├── index.ts
│   │           └── Tab.tsx
│   └── ui/                    # @new-type/ui（缩窄范围：Loading/Toast/Modal/LazyImage/Skeleton）
│       ├── package.json / tsconfig.json / vite.config.ts
│       └── src/
│           ├── index.ts
│           ├── Loading.tsx
│           ├── Toast.tsx
│           ├── Modal.tsx
│           ├── LazyImage.tsx
│           └── Skeleton.tsx
│
├── apps/
│   └── campaign-template/     # 活动页模板
│       ├── package.json / index.html / tsconfig.json / vite.config.ts
│       ├── tailwind.config.ts / postcss.config.js
│       └── src/
│           ├── main.tsx / app.tsx / index.css / vite-env.d.ts
│           ├── constants.ts / tracking.ts
│           ├── store/index.ts
│           ├── services/api.ts
│           ├── sections/HeroSection.tsx
│           ├── sections/RuleSection.tsx
│           ├── sections/PrizeSection.tsx
│           └── components/CountdownTimer.tsx
│
├── scripts/
│   ├── package.json
│   ├── create-campaign.ts
│   └── build-campaign.ts
│
└── docs/
    ├── architecture.md        # 已创建
    ├── ai-rules.md
    └── campaign-template.md
```

---

### Task 1: 根目录配置

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `nx.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.npmrc`

**Steps:**

- [ ] **Step 1: 创建 `package.json`**

```json
{
  "name": "new-type-web",
  "private": true,
  "scripts": {
    "dev": "nx dev campaign-template",
    "build": "nx affected:build",
    "test": "nx affected:test",
    "lint": "nx affected:lint",
    "create-campaign": "tsx scripts/create-campaign.ts",
    "format": "prettier --write '**/*.{ts,tsx,js,json,css,md}'"
  },
  "devDependencies": {
    "nx": "^20.0.0",
    "prettier": "^3.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  },
  "packageManager": "pnpm@9.0.0"
}
```

- [ ] **Step 2: 创建 `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "scripts"
```

- [ ] **Step 3: 创建 `nx.json`**

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true,
      "inputs": ["{projectRoot}/**/*", "!{projectRoot}/**/*.md"]
    },
    "test": {
      "dependsOn": ["build"],
      "cache": true,
      "inputs": ["{projectRoot}/**/*", "!{projectRoot}/**/*.md"]
    },
    "lint": {
      "cache": true
    }
  },
  "defaultBase": "main"
}
```

- [ ] **Step 4: 创建 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 5: 创建 `.gitignore`**

```
node_modules/
dist/
.turbo/
nx.log
*.tsbuildinfo
.DS_Store
*.local
```

- [ ] **Step 6: 创建 `.npmrc`**

```
shamefully-hoist=true
strict-peer-dependencies=false
```

---

### Task 2: 共享配置包 (packages/config)

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig/base.json`
- Create: `packages/config/tsconfig/react.json`
- Create: `packages/config/eslint/base.js`
- Create: `packages/config/eslint/react.js`
- Create: `packages/config/tailwind/preset.js`
- Create: `packages/config/vite/campaign-base.ts`

**Steps:**

- [ ] **Step 1: 创建 `packages/config/package.json`**
  - name: `@new-type/config`
  - exports: tsconfig/base, tsconfig/react, eslint/base, eslint/react, tailwind/preset, vite/campaign-base
  - peerDependencies: typescript, eslint, tailwindcss, vite
  - dependencies: @vitejs/plugin-react, postcss-mobile-forever

- [ ] **Step 2: 创建 `packages/config/tsconfig/base.json`**
  - target: ES2020, strict: true, moduleResolution: bundler

- [ ] **Step 3: 创建 `packages/config/tsconfig/react.json`**
  - extends: ./base.json, jsx: react-jsx, lib: [ES2020, DOM, DOM.Iterable]

- [ ] **Step 4: 创建 `packages/config/eslint/base.js`**
  - eslint:recommended + @typescript-eslint/parser + @typescript-eslint plugin

- [ ] **Step 5: 创建 `packages/config/eslint/react.js`**
  - extends base + plugin:react-hooks/recommended

- [ ] **Step 6: 创建 `packages/config/tailwind/preset.js`**
  - screens: xs(375px), sm(414px), md(750px)
  - fontFamily: PingFang SC, Helvetica Neue
  - colors: primary 调色板

- [ ] **Step 7: 创建 `packages/config/vite/campaign-base.ts`**
  - `defineCampaignConfig()` 函数
  - 集成 @vitejs/plugin-react + postcss-mobile-forever（viewportWidth: 750, maxDisplayWidth: 580）
  - 返回 UserConfig

> **参考 `docs/architecture.md` 第 6 节获取各文件的完整代码**

---

### Task 3: packages/utils (@new-type/utils)

**Files:**
- Create: `packages/utils/package.json` — name: @new-type/utils, exports: ./dist/index.js
- Create: `packages/utils/tsconfig.json` — extends @new-type/config/tsconfig/base.json
- Create: `packages/utils/vite.config.ts` — library mode, 无 external
- Create: `packages/utils/src/index.ts`

**Steps:**

- [ ] **Step 1-3: 创建 package.json / tsconfig.json / vite.config.ts**（标准 library 模式配置）
- [ ] **Step 4: 创建 `src/index.ts`** — 导出工具函数
  - `formatDate(date, format)` — 日期格式化
  - `parseUrlParams(url)` — URL 参数解析
  - `throttle(fn, delay)` / `debounce(fn, delay)` — 节流防抖
  - `storage` — localStorage 封装（get/set/remove/clear）
  - `generateId()` — 随机 ID

> **完整代码参考 `docs/architecture.md` Task 3**

---

### Task 4: packages/request (@new-type/request)

**Files:**
- Create: `packages/request/package.json` — dependencies: axios
- Create: `packages/request/tsconfig.json`
- Create: `packages/request/vite.config.ts` — external: ['axios']
- Create: `packages/request/src/index.ts`

**Steps:**

- [ ] **Step 1-3: 创建配置文件**
- [ ] **Step 4: 创建 `src/index.ts`**
  - `createRequest(options)` — 返回 AxiosInstance
  - 请求拦截器：自动附加 Bearer token
  - 响应拦截器：code !== 0 时 reject，401 触发 onAuthError

> **完整代码参考 `docs/architecture.md` Task 4**

---

### Task 5: packages/hooks (@new-type/hooks)

**Files:**
- Create: `packages/hooks/package.json` — peerDependencies: react
- Create: `packages/hooks/tsconfig.json`
- Create: `packages/hooks/vite.config.ts` — external: ['react']
- Create: `packages/hooks/src/index.ts`

**Steps:**

- [ ] **Step 1-3: 创建配置文件**
- [ ] **Step 4: 创建 `src/index.ts`**
  - `useCountdown(targetTime)` — 倒计时 hook，返回 days/hours/minutes/seconds
  - `useScrollDirection()` — 滚动方向检测
  - `useShare()` — Web Share API 封装，fallback 复制链接
  - `useWechatShare(config)` — 微信 JS-SDK 分享配置

> **完整代码参考 `docs/architecture.md` Task 5**

---

### Task 6: packages/analytics (@new-type/analytics)

**Files:**
- Create: `packages/analytics/package.json`
- Create: `packages/analytics/tsconfig.json`
- Create: `packages/analytics/vite.config.ts`
- Create: `packages/analytics/src/index.ts`

**Steps:**

- [ ] **Step 1-3: 创建配置文件**
- [ ] **Step 4: 创建 `src/index.ts`**
  - `track(event, properties)` — 通用埋点
  - `pageView()` — 页面浏览
  - `click(elementName, extra)` — 点击事件
  - `setReportHandler(handler)` — 自定义上报函数
  - 默认上报使用 navigator.sendBeacon 发送到 /api/track

> **完整代码参考 `docs/architecture.md` Task 6**

---

### Task 7: packages/headless (@new-type/headless)

> **注意**：已从 `@new-type/campaign-core` 重构为 `@new-type/headless`，抽奖逻辑移至 `apps/campaign-template/src/integrations/store.ts`。

**Files:**
- Create: `packages/headless/package.json` — peer: react
- Create: `packages/headless/tsconfig.json`
- Create: `packages/headless/vite.config.ts` — external: [react, react-dom]
- Create: `packages/headless/src/index.ts`
- Create: `packages/headless/src/Tab/` — 无样式 Tab 组件

**Steps:**

- [ ] **Step 1-3: 创建配置文件**
- [ ] **Step 4: 创建 `src/index.ts`**
- [ ] **Step 5: 创建 `src/Tab/Tab.tsx`**
  - `Tab.Root` — Context provider，管理激活状态
  - `Tab.List` — tablist 容器，键盘导航（方向键 + Home/End）
  - `Tab.Trigger` — 单个 tab 按钮，ARIA 属性绑定
  - `Tab.Content` — 内容面板，仅激活时渲染

> **完整代码参考 `docs/architecture.md` Task 7**

---

### Task 8: packages/ui (@new-type/ui)

**Files:**
- Create: `packages/ui/package.json` — peerDependencies: react, react-dom
- Create: `packages/ui/tsconfig.json` — extends react.json
- Create: `packages/ui/vite.config.ts` — external: [react, react-dom]
- Create: `packages/ui/src/index.ts` — 统一导出
- Create: `packages/ui/src/Loading.tsx`
- Create: `packages/ui/src/Toast.tsx`
- Create: `packages/ui/src/Modal.tsx`
- Create: `packages/ui/src/LazyImage.tsx`
- Create: `packages/ui/src/Skeleton.tsx`

**Steps:**

- [ ] **Step 1-4: 创建配置文件和 index.ts**
- [ ] **Step 5: 创建 `Loading.tsx`** — 旋转加载动画，props: size/color/text
- [ ] **Step 6: 创建 `Toast.tsx`** — `toast()` 命令式调用 + `<ToastContainer />`
- [ ] **Step 7: 创建 `Modal.tsx`** — 蒙层弹窗，props: open/onClose/maskClosable
- [ ] **Step 8: 创建 `LazyImage.tsx`** — IntersectionObserver 懒加载图片
- [ ] **Step 9: 创建 `Skeleton.tsx`** — 骨架屏占位，props: width/height/borderRadius

> **所有组件完整代码参考 `docs/architecture.md` Task 8**

---

### Task 9: 活动页模板 (apps/campaign-template)

**Files:**
- Create: `apps/campaign-template/package.json` — 仅依赖 @new-type/* 包（react/react-dom/react-router-dom/zustand/motion 等通用库在根 package.json 共享）
- Create: `apps/campaign-template/index.html` — viewport: 禁止缩放
- Create: `apps/campaign-template/tsconfig.json` — extends react.json, paths: @/*, references 各 packages
- Create: `apps/campaign-template/vite.config.ts` — 使用 defineCampaignConfig()
- Create: `apps/campaign-template/tailwind.config.ts` — preset: @new-type/config/tailwind/preset
- Create: `apps/campaign-template/postcss.config.js`
- Create: `apps/campaign-template/src/vite-env.d.ts`
- Create: `apps/campaign-template/src/main.tsx` — ReactDOM.createRoot + StrictMode
- Create: `apps/campaign-template/src/app.tsx` — 组合 sections + ToastContainer
- Create: `apps/campaign-template/src/index.css` — Tailwind 指令 + 全局样式
- Create: `apps/campaign-template/src/constants.ts` — CAMPAIGN_CONFIG + API_BASE_URL
- Create: `apps/campaign-template/src/tracking.ts` — 埋点封装（调用 @new-type/analytics）
- Create: `apps/campaign-template/src/store/index.ts` — Zustand store
- Create: `apps/campaign-template/src/services/api.ts` — createRequest 实例
- Create: `apps/campaign-template/src/sections/HeroSection.tsx` — 首屏（倒计时 + CTA）
- Create: `apps/campaign-template/src/sections/RuleSection.tsx` — 规则说明
- Create: `apps/campaign-template/src/sections/PrizeSection.tsx` — 奖品展示 + 抽奖
- Create: `apps/campaign-template/src/components/CountdownTimer.tsx` — 倒计时展示组件

**Steps:**
按文件顺序逐个创建。所有文件完整代码参考 `docs/architecture.md` Task 9。

---

### Task 10: 工程脚本

**Files:**
- Create: `scripts/package.json`
- Create: `scripts/create-campaign.ts`
- Create: `scripts/build-campaign.ts`

**Steps:**

- [ ] **Step 1: 创建 `scripts/package.json`**
  - name: @new-type/scripts, dependencies: fs-extra, prompts

- [ ] **Step 2: 创建 `scripts/create-campaign.ts`**
  - 交互式输入活动名称
  - 复制 `apps/campaign-template` 到 `apps/<campaign-name>`
  - 修改 package.json 中的 name 字段

- [ ] **Step 3: 创建 `scripts/build-campaign.ts`**
  - 通过 Nx CLI 构建指定活动页
  - 支持批量构建

---

### Task 11: 文档补充

- [ ] **Step 1: 创建 `docs/ai-rules.md`** — AI 开发规则（目录边界/命名规范/引用方式）
- [ ] **Step 2: 创建 `docs/campaign-template.md`** — 活动页模板说明

---

### Task 12: 安装依赖并验证

- [ ] **Step 1: 运行 `pnpm install`** — 安装所有依赖
- [ ] **Step 2: 运行 `pnpm build`** — 验证所有包可构建
- [ ] **Step 3: 运行 LSP Diagnostics** — 验证无类型错误

---

## 执行顺序说明

部分任务有依赖关系，建议按以下顺序：
1. Task 1（根配置）→ pnpm install
2. Task 2（config 包）
3. Task 3-7（无依赖关系的工具包：utils/request/hooks/analytics）可并行
4. Task 8（ui 包，依赖 config）
5. Task 9（campaign-template，依赖所有 packages）
6. Task 10（脚本）
7. Task 11（文档）
8. Task 12（验证）
