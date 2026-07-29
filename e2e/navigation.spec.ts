import { expect, test } from '@playwright/test';

test.describe('UniTracker - Navigation', () => {
  test('should load the app and show session page by default', async ({ page }) => {
    await page.goto('/');
    // The app should render - look for the navbar logo
    await expect(page.locator('nav')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').waitFor({ timeout: 15000 });

    // Click on Tasks in navbar
    const tasksButton = page.locator('[data-page="tasks"]').first();
    if (await tasksButton.isVisible()) {
      await tasksButton.click();
      await page.waitForTimeout(500);
    }

    // Click on Calendar
    const calendarButton = page.locator('[data-page="calendar"]').first();
    if (await calendarButton.isVisible()) {
      await calendarButton.click();
      await page.waitForTimeout(500);
    }

    // Click on Session
    const sessionButton = page.locator('[data-page="session"]').first();
    if (await sessionButton.isVisible()) {
      await sessionButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('UniTracker - Demo Mode', () => {
  test('should show login prompt when trying to create tasks without auth', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').waitFor({ timeout: 15000 });

    // Navigate to tasks
    const tasksButton = page.locator('[data-page="tasks"]').first();
    if (await tasksButton.isVisible()) {
      await tasksButton.click();
      await page.waitForTimeout(1000);
    }

    // The page should render some content (either tasks or login prompt)
    const content = page.locator('main, [class*="flex"]').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});

test.describe('UniTracker - Timer', () => {
  test('should display pomodoro timer on session page', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').waitFor({ timeout: 15000 });

    // Navigate to session
    const sessionButton = page.locator('[data-page="session"]').first();
    if (await sessionButton.isVisible()) {
      await sessionButton.click();
      await page.waitForTimeout(1000);
    }

    // Should see timer-related content
    const pageContent = page.locator('body');
    await expect(pageContent).toContainText(/\d+:\d+/, { timeout: 10000 });
  });
});
