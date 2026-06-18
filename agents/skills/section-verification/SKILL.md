---
name: section-verification
description: H5 活动页 Section 验证和最终收尾能力模块。用于 designer agent 执行 spec 生成、单 Section 验证、总验收、Vitest、build 和反馈归档。
---

# Section Verification Skill

用于单 Section 验证和最终收尾。本模块只保留验证流程和失败处理；检查清单与 Final Closeout 细则以 `docs/ai/section-implementation-gate.md` 为唯一真源。

## 必读引用

开始验证前必须读取：

- `docs/ai/section-implementation-gate.md`：17 项 Layer 0 检查、spec-first 测试、Final Closeout Gate。
- `docs/ai/development-rules.md`：目录边界、分层边界、流程预览和弹窗交互规则。

## 单 Section 验证

每个 Section 完成后立即执行：

```bash
pnpm --silent verify-section --campaign <campaign-name> <SectionName>
```

通过后才能开始下一个 Section。通过后必须：

- 在 `.feedback/progress.md` 中将该 Section 标记为 `validated`。
- 记录命令和结果。
- 对话中报告：`<SectionName> 单组件校验通过：validate-section + spec tests`。

## 失败处理

- 结构、注册或分层检查失败：修实现或注册，不跳过。
- 规格测试失败：先判断组件设计卡的 Acceptance Tests 是否正确。
- Acceptance Tests 错误：先改组件设计卡，再重新生成测试；禁止手改 `*.spec.test.tsx`。
- regression 测试失败：修实现或补充合理回归，不删除测试绕过。
- 命令因环境权限失败：按工具权限规则重跑或记录阻塞原因。

## 最终收尾

所有 Section 单独验证通过后，必须执行 `docs/ai/section-implementation-gate.md` 的 Final Closeout Gate。完成最后一个 Section 的单组件验证不代表第 4 步完成；`validate-section --all` 只是收尾门禁的一项。

最终回复必须逐项说明 Final Closeout Gate 结果；若任何命令未运行或失败，必须说明原因和当前阻塞点。
