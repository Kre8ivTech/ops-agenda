import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('home redirects to sign-in', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('sign-in page renders Cognito split-screen', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const response = await page.goto('/auth/signin');
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole('heading', { name: 'Your day, already prioritized.' }),
    ).toBeVisible();
    await expect(page.getByTestId('sign-in-cognito')).toHaveAttribute('href', '/api/auth/signin');
    await expect(page.getByTestId('sign-in-microsoft')).toHaveAttribute('href', '/api/auth/signin');
    await expect(page.getByTestId('forgot-password-link')).toHaveAttribute(
      'href',
      '/auth/forgot-password',
    );
    await expect(page.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/auth/signup');
    await expect(page.getByText('Secured by AWS Cognito')).toBeVisible();
    await expect(page.getByText('Daily Ops Brief')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('signup page requires access code field', async ({ page }) => {
    const response = await page.goto('/auth/signup');
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: 'Create your Ops Agenda account.' }),
    ).toBeVisible();
    await expect(page.getByTestId('signup-access-code')).toBeVisible();
    await expect(page.getByTestId('signup-submit')).toBeVisible();
  });

  test('forgot-password page renders', async ({ page }) => {
    const response = await page.goto('/auth/forgot-password');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Reset your password.' })).toBeVisible();
    await expect(page.getByTestId('forgot-email')).toBeVisible();
  });
});
