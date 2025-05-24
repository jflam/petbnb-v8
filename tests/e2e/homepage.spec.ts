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
    const locationInput = page.locator('input[placeholder="Enter city or neighborhood"]');
    await expect(locationInput).toBeVisible();
    
    const checkInInput = page.locator('input#checkIn');
    await expect(checkInInput).toBeVisible();
    
    const checkOutInput = page.locator('input#checkOut');
    await expect(checkOutInput).toBeVisible();
    
    const searchButton = page.locator('button:has-text("Search Sitters")');
    await expect(searchButton).toBeVisible();
  });

  test('homepage shows pet type selector', async ({ page }) => {
    await page.goto('/');
    
    // Check for pet type select dropdown
    const petTypeSelect = page.locator('select#petType');
    await expect(petTypeSelect).toBeVisible();
    
    // Check for pet type options
    await expect(petTypeSelect.locator('option[value="dog"]')).toHaveText('Dog');
    await expect(petTypeSelect.locator('option[value="cat"]')).toHaveText('Cat');
    await expect(petTypeSelect.locator('option[value="other"]')).toHaveText('Other');
  });

  test('homepage shows features section', async ({ page }) => {
    await page.goto('/');
    
    // Check for features heading
    const featuresHeading = page.locator('h2:has-text("Why Choose PetBnB?")');
    await expect(featuresHeading).toBeVisible();
    
    // Check for feature cards  
    const featureCards = page.locator('.feature-card');
    await expect(featureCards).toHaveCount(4);
  });
});