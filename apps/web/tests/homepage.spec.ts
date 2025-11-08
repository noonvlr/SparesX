import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check if the main heading is visible
    await expect(page.getByRole('heading', { name: /find the perfect spare parts/i })).toBeVisible();

    // Check if navigation is present
    await expect(page.getByRole('link', { name: /sparesx/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /browse parts/i })).toBeVisible();

    // Check if sign in and sign up buttons are present
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('should navigate to products page', async ({ page }) => {
    await page.goto('/');

    // Click on Browse Parts link
    await page.getByRole('link', { name: /browse parts/i }).click();

    // Check if we're on the products page
    await expect(page).toHaveURL(/.*products/);
    await expect(page.getByRole('heading', { name: /browse spare parts/i })).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/');

    // Click on Sign Up button
    await page.getByRole('link', { name: /sign up/i }).click();

    // Check if we're on the sign up page
    await expect(page).toHaveURL(/.*auth\/signup/);
    await expect(page.getByRole('heading', { name: /join sparesx/i })).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');

    // Click on Sign In button
    await page.getByRole('link', { name: /sign in/i }).click();

    // Check if we're on the sign in page
    await expect(page).toHaveURL(/.*auth\/login/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });
});





