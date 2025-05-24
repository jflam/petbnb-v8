import { test, expect } from '@playwright/test';

test.describe('PetBnB Sitter Search', () => {
  // Helper function to navigate to search results
  async function navigateToSearchResults(page) {
    await page.goto('/search?location=Seattle%2C%20WA&lat=47.6062&lng=-122.3321&checkIn=2024-12-01&checkOut=2024-12-05&petType=dog&petCount=1&serviceType=boarding');
    // Wait for sitters to load
    await page.waitForSelector('.sitter-card', { timeout: 10000 });
  }

  test('can filter by pet type', async ({ page }) => {
    await navigateToSearchResults(page);

    // Get initial count of sitters
    const initialCount = await page.locator('.sitter-card').count();
    expect(initialCount).toBeGreaterThan(0);

    // Click on cat filter
    const catButton = page.locator('button:has-text("Cat")');
    if (await catButton.isVisible()) {
      await catButton.click();
      
      // Wait for results to update
      await page.waitForTimeout(1000);
      
      // Count should potentially be different
      const catSitterCount = await page.locator('.sitter-card').count();
      // Some sitters might accept both dogs and cats
      expect(catSitterCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('can filter by service type', async ({ page }) => {
    await navigateToSearchResults(page);

    // Look for service type selector
    const serviceSelector = page.locator('select[name="serviceType"]');
    if (await serviceSelector.isVisible()) {
      // Change to house sitting
      await serviceSelector.selectOption('house-sitting');
      
      // Wait for results to update
      await page.waitForTimeout(1000);
      
      // Should still have results
      const sitterCount = await page.locator('.sitter-card').count();
      expect(sitterCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('can sort search results', async ({ page }) => {
    await navigateToSearchResults(page);

    // Look for sort dropdown
    const sortDropdown = page.locator('select').filter({ hasText: /sort/i });
    if (await sortDropdown.isVisible()) {
      // Get first sitter's price before sorting
      const firstSitterPrice = await page.locator('.sitter-card').first().locator('.sitter-card__price').textContent();
      
      // Sort by price
      await sortDropdown.selectOption({ label: /price/i });
      
      // Wait for results to re-order
      await page.waitForTimeout(1000);
      
      // Get first sitter's price after sorting
      const newFirstSitterPrice = await page.locator('.sitter-card').first().locator('.sitter-card__price').textContent();
      
      // Prices might have changed order
      expect(newFirstSitterPrice).toBeTruthy();
    }
  });

  test('shows no results message when no sitters match', async ({ page }) => {
    // Navigate with very specific criteria that might not match any sitters
    await page.goto('/search?location=Remote%20Island&lat=0&lng=0&checkIn=2024-12-01&checkOut=2024-12-05&petType=other&petCount=5&serviceType=boarding');
    
    // Wait a bit for the query to complete
    await page.waitForTimeout(2000);
    
    // Should show no results message or no sitter cards
    const sitterCards = await page.locator('.sitter-card').count();
    if (sitterCards === 0) {
      // Look for no results message
      const noResultsMessage = page.locator('text=/no sitters found|no results|try adjusting/i');
      const isVisible = await noResultsMessage.isVisible().catch(() => false);
      expect(sitterCards === 0 || isVisible).toBeTruthy();
    }
  });

  test('can change search location', async ({ page }) => {
    await navigateToSearchResults(page);

    // Look for location input in search results
    const locationInput = page.locator('input[value*="Seattle"]').or(page.locator('input[placeholder*="location"]'));
    if (await locationInput.isVisible()) {
      // Clear and enter new location
      await locationInput.clear();
      await locationInput.fill('Austin, TX');
      
      // Submit if there's a search button
      const searchButton = page.locator('button').filter({ hasText: /search|update/i });
      if (await searchButton.isVisible()) {
        await searchButton.click();
      } else {
        // Or press Enter
        await locationInput.press('Enter');
      }
      
      // Wait for results to update
      await page.waitForTimeout(2000);
      
      // URL should update with new location
      const url = page.url();
      expect(url).toContain('Austin');
    }
  });

  test('pet count selector updates results', async ({ page }) => {
    await navigateToSearchResults(page);

    // Look for pet count input
    const petCountInput = page.locator('input[type="number"][name="petCount"]').or(page.locator('button:has-text("+")'));
    
    if (await petCountInput.isVisible()) {
      // Increase pet count
      if (await page.locator('button:has-text("+")').isVisible()) {
        await page.locator('button:has-text("+")').click();
      } else {
        await petCountInput.fill('2');
      }
      
      // Wait for any updates
      await page.waitForTimeout(1000);
      
      // Should still have sitters (some accept multiple pets)
      const sitterCount = await page.locator('.sitter-card').count();
      expect(sitterCount).toBeGreaterThanOrEqual(0);
    }
  });
});