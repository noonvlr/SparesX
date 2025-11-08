import { test, expect } from '@playwright/test';

test.describe('Chat page', () => {
  test('renders guest prompt when unauthenticated', async ({ page }) => {
    await page.goto('/chat/demo');
    await expect(page.getByRole('heading', { name: 'Messaging' })).toBeVisible();
    await expect(page.getByText('You need to be logged in to access chat.')).toBeVisible();
  });
});
