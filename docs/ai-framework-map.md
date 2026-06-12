# AI Framework Map

> AI 辅助开发时的共享包引用指南
> 最后更新：2026-06-12（campaign-core → headless）

## 包引用速查

| 场景 | 应使用的包 | 示例 |
|------|-----------|------|
| 网络请求 | `@new-type/request` | `import { createRequest } from '@new-type/request'` |
| 轻提示 | `@new-type/ui` | `import { toast, ToastContainer } from '@new-type/ui'` |
| 弹窗 | `@new-type/ui` | `import { Modal } from '@new-type/ui'` |
| 图片懒加载 | `@new-type/ui` | `import { LazyImage } from '@new-type/ui'` |
| 加载指示器 | `@new-type/ui` | `import { Loading } from '@new-type/ui'` |
| 骨架屏 | `@new-type/ui` | `import { Skeleton } from '@new-type/ui'` |
| 倒计时 | `@new-type/hooks` | `import { useCountdown } from '@new-type/hooks'` |
| 滚动方向 | `@new-type/hooks` | `import { useScrollDirection } from '@new-type/hooks'` |
| Web Share | `@new-type/hooks` | `import { useShare } from '@new-type/hooks'` |
| 微信分享 | `@new-type/hooks` | `import { useWechatShare } from '@new-type/hooks'` |
| 日期格式化 | `@new-type/utils` | `import { formatDate } from '@new-type/utils'` |
| URL 参数解析 | `@new-type/utils` | `import { parseUrlParams } from '@new-type/utils'` |
| 防抖/节流 | `@new-type/utils` | `import { debounce, throttle } from '@new-type/utils'` |
| 本地存储 | `@new-type/utils` | `import { storage } from '@new-type/utils'` |
| 埋点 | `@new-type/analytics` | `import { pageView, click, track } from '@new-type/analytics'` |
| 无样式 Tab | `@new-type/headless` | `import { Tab } from '@new-type/headless'` |

## 通用规则

1. **不要自己实现**：任何上述功能都优先使用 `@new-type/*` 包
2. **不要修改共享包**：如果你缺少某个功能，在 `packages/*` 中添加而不是修改现有导出
3. **react-router-dom 直接使用**：路由库直接依赖，不封装
4. **zustand 直接使用**：状态管理库直接使用

## 在活动页中使用

### ✅ 正确用法（通过 integrations 层）

```ts
// runtime/sections/HeroContainer.tsx
import { useStore } from '../../integrations/store';  // 通过 integrations 间接使用
import { HeroSection } from '../../designer/sections/HeroSection';
```

### ❌ 错误用法（绕过 integrations）

```ts
// ❌ designer 组件不应直接调用 API 或 store
import { createRequest } from '@new-type/request';  // 不要在 visual 组件中用
import { useStore } from '../../integrations/store'; // 不要直接在 visual 中用

// ✅ visual 组件只通过 content props 接收数据
export function HeroSection({ content }: SectionProps<HeroContent>) { ... }
```
