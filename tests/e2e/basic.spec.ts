import { test, expect } from '@playwright/test';

test.describe('PetBnB Basic Functionality', () => {
  test('can navigate from homepage to search results', async ({ page }) => {
    await page.goto('/');

    // Fill in search form
    const locationInput = page.locator('input[placeholder*="location"]');
    await locationInput.fill('Seattle, WA');
    
    // Select from location dropdown if it appears
    await page.waitForTimeout(500); // Wait for debounced search
    const locationOption = page.locator('.landing__location-item').first();
    if (await locationOption.isVisible()) {
      await locationOption.click();
    }

    // Fill in dates
    await page.locator('input[name="checkIn"]').fill('2024-12-01');
    await page.locator('input[name="checkOut"]').fill('2024-12-05');

    // Submit search
    await page.locator('button[type="submit"]').click();

    // Should navigate to search results
    await expect(page).toHaveURL(/\/search/);
    
    // Should show sitter cards
    await expect(page.locator('.sitter-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('search results page shows map and sitter cards', async ({ page }) => {
    // Navigate directly to search results with query params
    await page.goto('/search?location=Seattle%2C%20WA&lat=47.6062&lng=-122.3321&checkIn=2024-12-01&checkOut=2024-12-05&petType=dog&petCount=1&serviceType=boarding');

    // Check for map container
    const mapContainer = page.locator('#map');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Check for sitter cards
    const sitterCards = page.locator('.sitter-card');
    await expect(sitterCards.first()).toBeVisible();
    
    // Should have multiple sitters
    const count = await sitterCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('can view sitter profile', async ({ page }) => {
    // Navigate to search results
    await page.goto('/search?location=Seattle%2C%20WA&lat=47.6062&lng=-122.3321&checkIn=2024-12-01&checkOut=2024-12-05&petType=dog&petCount=1&serviceType=boarding');

    // Wait for sitter cards to load
    await page.waitForSelector('.sitter-card');

    // Click the first sitter card
    const firstSitterCard = page.locator('.sitter-card').first();
    await firstSitterCard.click();

    // Should navigate to sitter profile
    await expect(page).toHaveURL(/\/sitters\//);

    // Should show sitter name
    const sitterName = page.locator('h1');
    await expect(sitterName).toBeVisible();

    // Should show hourly rate
    const hourlyRate = page.locator('.sitter-profile__rate');
    await expect(hourlyRate).toContainText('$');

    // Should show bio section
    const bioSection = page.locator('.sitter-profile__section').filter({ hasText: 'About' });
    await expect(bioSection).toBeVisible();
  });

  test('header navigation works', async ({ page }) => {
    await page.goto('/search?location=Seattle');

    // Check header is visible
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();

    // Click logo to go home
    await page.locator('.app-header__logo').click();
    await expect(page).toHaveURL('/');

    // Go back to search
    await page.goBack();

    // Click "Find Sitters" link
    await page.locator('a:has-text("Find Sitters")').click();
    // Should stay on search page or navigate to search
    await expect(page).toHaveURL(/search/);
  });
});