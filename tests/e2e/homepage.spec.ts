import { test, expect } from '@playwright/test';

test.describe('PetBnB Homepage', () => {
  test('homepage has correct title and hero text', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/PetBnB/);
    
    // Check for hero heading
    const heroHeading = page.locator('h1.landing__title');
    await expect(heroHeading).toContainText('Find trusted pet care in your neighborhood');
    
    // Check for subtitle
    const subtitle = page.locator('.landing__subtitle');
    await expect(subtitle).toBeVisible();
  });

  test('homepage shows search form', async ({ page }) => {
    await page.goto('/');
    
    // Check for search form elements
    const locationInput = page.locator('input[placeholder*="location"]');
    await expect(locationInput).toBeVisible();
    
    const checkInInput = page.locator('input[name="checkIn"]');
    await expect(checkInInput).toBeVisible();
    
    const checkOutInput = page.locator('input[name="checkOut"]');
    await expect(checkOutInput).toBeVisible();
    
    const searchButton = page.locator('button[type="submit"]');
    await expect(searchButton).toContainText('Search');
  });

  test('homepage shows pet type selector', async ({ page }) => {
    await page.goto('/');
    
    // Check for pet type buttons
    const dogButton = page.locator('button:has-text("Dog")');
    await expect(dogButton).toBeVisible();
    
    const catButton = page.locator('button:has-text("Cat")');
    await expect(catButton).toBeVisible();
    
    const otherButton = page.locator('button:has-text("Other")');
    await expect(otherButton).toBeVisible();
  });

  test('homepage shows features section', async ({ page }) => {
    await page.goto('/');
    
    // Check for features section
    const featuresSection = page.locator('.landing__features');
    await expect(featuresSection).toBeVisible();
    
    // Check for feature cards
    const featureCards = page.locator('.landing__feature-card');
    await expect(featureCards).toHaveCount(3);
  });
});