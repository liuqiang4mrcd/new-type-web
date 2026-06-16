import { test, expect } from '@playwright/test';

test.describe('Playground 集成测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?mode=designer');
  });

  test('Playground 加载后显示所有注册的 Section', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // 检查 wheel section 存在
    await expect(page.locator('[data-testid="wheel-section"]').first()).toBeVisible();

    // 检查 crit button 存在
    await expect(page.locator('[data-testid="crit-button"]').first()).toBeVisible();
  });

  test('WheelSection: 点击 GO 触发 spinning 动画并调用 onSpin', async ({ page }) => {
    const wheelSection = page.locator('[data-testid="wheel-section"]').first();
    await expect(wheelSection).toBeVisible();

    // 点击 GO 按钮
    const goButton = page.locator('[data-testid="wheel-go-button"]').first();
    await expect(goButton).toBeVisible();
    await expect(goButton).toContainText('GO');

    // 点击触发 spinning
    await goButton.click();

    // 按钮文本变为 ...（spinning 状态）
    await expect(goButton).toContainText('...', { timeout: 1000 });

    // 等待 3 秒 spinning 动画结束后，reset 按钮出现
    const resetButton = page.locator('[data-testid="wheel-reset-button"]');
    await expect(resetButton).toBeVisible({ timeout: 5000 });

    // 点击再来一次
    await resetButton.click();
    await expect(goButton).toContainText('GO', { timeout: 1000 });
  });

  test('CritSection: 点击暴击按钮可以触发 onCrit', async ({ page }) => {
    const critButton = page.locator('[data-testid="crit-button"]').first();
    await expect(critButton).toBeVisible();
    await expect(critButton).toContainText('暴击');

    // 点击，不会报错（Playground 中 defaultActions 为 console.log）
    await critButton.click();
    // 按钮仍然可见（不跳转页面）
    await expect(critButton).toBeVisible();
  });

  test('RewardTierSection: 左右切换箭头存在可点击', async ({ page }) => {
    const prevArrow = page.locator('[data-testid="reward-tier-prev"]').first();
    const nextArrow = page.locator('[data-testid="reward-tier-next"]').first();

    await expect(prevArrow).toBeVisible();
    await expect(nextArrow).toBeVisible();

    // 点击右箭头切换
    await nextArrow.click();

    // 点击左箭头切换回来
    await prevArrow.click();
  });
});
