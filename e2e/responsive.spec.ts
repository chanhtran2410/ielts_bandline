import { expect, test } from '@playwright/test';

/**
 * §20: mobile must be a real layout, not a shrunk desktop one, and no screen
 * may scroll the page body sideways.
 */

const SCREENS = [
  '/',
  '/onboarding',
  '/dashboard',
  '/practice',
  '/mock',
  '/writing',
  '/mistakes',
  '/mistakes/pat_sva',
  '/progress',
  '/coach',
  '/practice/session/test_drill_headings',
  '/writing/sub_task2_d2',
  '/writing/sub_task2_d2/analysis',
];

for (const path of SCREENS) {
  test('no horizontal page scroll on ' + path, async ({ page }) => {
    await page.goto(path);
    // Let client-rendered content settle before measuring.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    });

    // A 1px allowance absorbs sub-pixel rounding on fractional device widths.
    expect(
      overflow.scrollWidth,
      path + ' scrolls sideways: ' + overflow.scrollWidth + ' > ' + overflow.clientWidth,
    ).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
}

test.describe('mobile navigation', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile-only');

  test('the sidebar becomes a drawer that navigates and closes', async ({ page }) => {
    await page.goto('/dashboard');

    // The desktop rail is not present at this width.
    await expect(page.getByRole('complementary')).toBeHidden();

    await page.getByRole('button', { name: 'Open navigation' }).click();
    const drawer = page.getByRole('dialog', { name: 'Navigation' });
    await expect(drawer).toBeVisible();

    await drawer.getByRole('link', { name: 'Mistakes' }).click();
    await expect(page).toHaveURL(/\/mistakes$/);
  });

  test('the drawer closes on Escape', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeHidden();
  });

  test('the reading session splits passage and questions into panes', async ({ page }) => {
    await page.goto('/practice/session/test_practice_trees');
    await expect(page.getByRole('tab', { name: /passage/i })).toBeVisible({ timeout: 20_000 });

    const questions = page.getByRole('tab', { name: /questions/i });
    await questions.click();
    await expect(questions).toHaveAttribute('aria-selected', 'true');

    // The question list is reachable in the questions pane.
    await expect(page.getByText('List of headings')).toBeVisible();
  });
});

test.describe('desktop layout', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'desktop-only');

  test('the sidebar rail is present and marks the current page', async ({ page }) => {
    await page.goto('/progress');

    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Progress' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('the reading session shows passage and questions side by side', async ({ page }) => {
    await page.goto('/practice/session/test_practice_trees');

    await expect(page.getByRole('heading', { name: /Urban Trees/ })).toBeVisible({
      timeout: 20_000,
    });
    // Both panes visible at once, so no tab switcher is offered.
    await expect(page.getByText('List of headings')).toBeVisible();
    await expect(page.getByRole('tab', { name: /passage/i })).toBeHidden();
  });
});

test.describe('accessibility basics (§21)', () => {
  test('every screen has exactly one h1 and a main landmark', async ({ page }) => {
    for (const path of ['/dashboard', '/practice', '/mistakes', '/progress', '/writing']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('h1'), path + ' should have one h1').toHaveCount(1);
    }
  });

  test('the skip link is the first thing a keyboard user reaches', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Tab');

    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  });

  test('reading questions are answerable from the keyboard alone', async ({ page }) => {
    await page.goto('/practice/session/test_practice_trees');
    await expect(page.getByText('Practice mode')).toBeVisible({ timeout: 20_000 });

    // Narrow viewports keep the questions in their own pane (§20).
    const questionsTab = page.getByRole('tab', { name: /questions/i });
    if (await questionsTab.isVisible()) await questionsTab.click();

    // The pool select is a real form control, so it takes keyboard input.
    const first = page.getByLabel(/Answer for question 14/);
    await first.selectOption('iii');
    await expect(first).toHaveValue('iii');
    await expect(page.getByText(/1 of 13 answered/)).toBeVisible();
  });
});
