# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playground.spec.ts >> Playground 集成测试 >> RewardTierSection: 左右切换箭头存在可点击
- Location: e2e/playground.spec.ts:54:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="reward-tier-prev"]').first()
    - locator resolved to <div data-testid="reward-tier-prev" class="absolute top-1/2 -translate-y-1/2 left-[30px] w-[64px] h-[64px] flex items-center justify-center cursor-pointer z-10 transition-opacity duration-200↵            opacity-100 hover:scale-110">…</div>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
      - waiting 100ms
    55 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - element is outside of the viewport
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - heading "[@new-type] Designer Playground" [level=1] [ref=e6]
      - generic [ref=e7]: money-rain
  - generic [ref=e8]:
    - main [ref=e9]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]:
            - button [ref=e16] [cursor=pointer]
            - generic [ref=e17]:
              - button "📤" [ref=e18] [cursor=pointer]
              - button "📋" [ref=e19] [cursor=pointer]
          - generic [ref=e20]:
            - heading "Money Rain" [level=1] [ref=e21]
            - paragraph [ref=e22]: 充值暴击，豪礼狂送
          - generic [ref=e24]: 5.10 - 5.16
        - generic [ref=e26]:
          - generic [ref=e27]: 📅
          - generic [ref=e28]:
            - generic [ref=e29]: "04"
            - generic [ref=e30]: D
            - generic [ref=e31]: "23"
            - generic [ref=e32]: h
            - generic [ref=e33]: "59"
            - generic [ref=e34]: m
            - generic [ref=e35]: "30"
            - generic [ref=e36]: s
        - generic [ref=e38]:
          - generic [ref=e39]: 玩
          - generic [ref=e40]:
            - generic [ref=e41]: 玩家昵称
            - generic [ref=e42]: "ID: 123456"
          - generic [ref=e43]:
            - generic [ref=e44]:
              - generic [ref=e45]: 🪙
              - generic [ref=e46]: 20K
            - button "Recharge" [ref=e47] [cursor=pointer]
        - generic [ref=e48]:
          - heading "奖励档位" [level=2] [ref=e50]
          - generic [ref=e51]:
            - img [ref=e53] [cursor=pointer]
            - img [ref=e57] [cursor=pointer]
            - generic [ref=e60]:
              - generic [ref=e61]:
                - generic [ref=e63]: ¥
                - generic [ref=e64]: 80K
              - generic [ref=e65]: 8,000金币
              - generic [ref=e66]:
                - generic [ref=e67]:
                  - generic [ref=e69]: 🎁
                  - paragraph [ref=e70]: 皇家座驾
                  - generic [ref=e72]: 10D
                - generic [ref=e73]:
                  - generic [ref=e75]: 🎁
                  - paragraph [ref=e76]: 钻石徽章
                  - generic [ref=e78]: 5D
                - generic [ref=e79]:
                  - generic [ref=e81]: 🎁
                  - paragraph [ref=e82]: 专属气泡
              - generic [ref=e85] [cursor=pointer]: 充值
        - generic [ref=e94]:
          - heading "全区进度" [level=2] [ref=e95]
          - generic [ref=e96]:
            - generic [ref=e97]:
              - generic [ref=e99]: 90%
              - generic [ref=e104]: 0 / 100,000
            - paragraph [ref=e105]: 全区充值助力，每达成一次进度条，下一暴击用户必得高返币倍数奖励
        - generic [ref=e106]:
          - button "暴击" [ref=e111] [cursor=pointer]:
            - generic [ref=e112]: 暴击
          - generic [ref=e113]: 剩余 5 次
        - generic [ref=e117]:
          - generic [ref=e119]: 📢
          - generic [ref=e121]: 🏆 玩家*** 获得了暴击奖励 x500 | 🏆 幸运*** 获得了道具 金砖×30天 | 🏆 大神*** 获得了暴击奖励 x300 | 🏆 土豪*** 获得了道具 钻石×7天 | 🏆 欧皇*** 获得了暴击奖励 x100
        - generic [ref=e122]:
          - heading "暴击转盘" [level=2] [ref=e123]
          - generic [ref=e126]:
            - generic [ref=e127]: x100
            - generic [ref=e128]: x300
            - generic [ref=e129]: x500
            - generic [ref=e130]: 20%
            - generic [ref=e131]: 10%
            - generic [ref=e132]: 30%
            - generic [ref=e133]: "?"
            - generic [ref=e134]: 道具
            - generic [ref=e135] [cursor=pointer]: GO
          - paragraph [ref=e136]: 本次暴击的返币倍数的基数为 15000
          - paragraph [ref=e137]: 点击暴击按钮旋转转盘
        - generic [ref=e138]:
          - heading "我的暴击奖励" [level=2] [ref=e139]
          - generic [ref=e140]:
            - generic [ref=e141]:
              - generic [ref=e142]: 💰
              - generic [ref=e143]: "1500"
              - generic [ref=e144]: 金币
            - generic [ref=e145]:
              - generic [ref=e147]: 🧱
              - generic [ref=e148]:
                - generic [ref=e149]: 金砖
                - generic [ref=e150]: 15天
            - generic [ref=e151]:
              - generic [ref=e153]: 💎
              - generic [ref=e154]:
                - generic [ref=e155]: 钻石
                - generic [ref=e156]: 7天
            - generic [ref=e157]:
              - generic [ref=e158]: 💰
              - generic [ref=e159]: "3000"
              - generic [ref=e160]: 金币
    - complementary [ref=e161]:
      - generic [ref=e162]:
        - heading "预览模式" [level=3] [ref=e163]
        - generic [ref=e164]:
          - button "完整页面" [ref=e165] [cursor=pointer]
          - button "单组件" [ref=e166] [cursor=pointer]
          - button "流程预览" [ref=e167] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Playground 集成测试', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/?mode=designer');
  6  |   });
  7  | 
  8  |   test('Playground 加载后显示所有注册的 Section', async ({ page }) => {
  9  |     // 检查页面标题
  10 |     await expect(page.locator('h1, h2').first()).toBeVisible();
  11 | 
  12 |     // 检查 wheel section 存在
  13 |     await expect(page.locator('[data-testid="wheel-section"]').first()).toBeVisible();
  14 | 
  15 |     // 检查 crit button 存在
  16 |     await expect(page.locator('[data-testid="crit-button"]').first()).toBeVisible();
  17 |   });
  18 | 
  19 |   test('WheelSection: 点击 GO 触发 spinning 动画并调用 onSpin', async ({ page }) => {
  20 |     const wheelSection = page.locator('[data-testid="wheel-section"]').first();
  21 |     await expect(wheelSection).toBeVisible();
  22 | 
  23 |     // 点击 GO 按钮
  24 |     const goButton = page.locator('[data-testid="wheel-go-button"]').first();
  25 |     await expect(goButton).toBeVisible();
  26 |     await expect(goButton).toContainText('GO');
  27 | 
  28 |     // 点击触发 spinning
  29 |     await goButton.click();
  30 | 
  31 |     // 按钮文本变为 ...（spinning 状态）
  32 |     await expect(goButton).toContainText('...', { timeout: 1000 });
  33 | 
  34 |     // 等待 3 秒 spinning 动画结束后，reset 按钮出现
  35 |     const resetButton = page.locator('[data-testid="wheel-reset-button"]');
  36 |     await expect(resetButton).toBeVisible({ timeout: 5000 });
  37 | 
  38 |     // 点击再来一次
  39 |     await resetButton.click();
  40 |     await expect(goButton).toContainText('GO', { timeout: 1000 });
  41 |   });
  42 | 
  43 |   test('CritSection: 点击暴击按钮可以触发 onCrit', async ({ page }) => {
  44 |     const critButton = page.locator('[data-testid="crit-button"]').first();
  45 |     await expect(critButton).toBeVisible();
  46 |     await expect(critButton).toContainText('暴击');
  47 | 
  48 |     // 点击，不会报错（Playground 中 defaultActions 为 console.log）
  49 |     await critButton.click();
  50 |     // 按钮仍然可见（不跳转页面）
  51 |     await expect(critButton).toBeVisible();
  52 |   });
  53 | 
  54 |   test('RewardTierSection: 左右切换箭头存在可点击', async ({ page }) => {
  55 |     const prevArrow = page.locator('[data-testid="reward-tier-prev"]').first();
  56 |     const nextArrow = page.locator('[data-testid="reward-tier-next"]').first();
  57 | 
  58 |     await expect(prevArrow).toBeVisible();
  59 |     await expect(nextArrow).toBeVisible();
  60 | 
  61 |     // 点击右箭头切换
  62 |     await nextArrow.click();
  63 | 
  64 |     // 点击左箭头切换回来
> 65 |     await prevArrow.click();
     |                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
  66 |   });
  67 | });
  68 | 
```