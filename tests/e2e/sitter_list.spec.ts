import { test, expect } from '@playwright/test';

const sitterCardSelector = '.sitter-card';
const _mapContainerSelector = '.leaflet-container';

test('sitter list loads with cards', async ({ page }) => {
  await page.goto('/?lat=47.6062&lng=-122.3321');
  // Wait for sitter cards to be visible
  await expect(page.locator(sitterCardSelector).first()).toBeVisible({ timeout: 10000 });
  // Verify we have multiple sitter cards
  const sitterCardsCount = await page.locator(sitterCardSelector).count();
  expect(sitterCardsCount).toBeGreaterThan(0);
});

test.beforeEach(async ({ page }) => {
  await page.goto('/?lat=47.6062&lng=-122.3321');
  // Ensure sitter cards are loaded before each test in this file
  await expect(page.locator(sitterCardSelector).first()).toBeVisible({ timeout: 10000 });
});

test('clicking a sitter card centers the map', async ({ page }) => {
  // Cards are already loaded due to beforeEach
  const getMapCenter = async () => {
    return await page.evaluate(() => {
      // @ts-expect-error Accessing Leaflet's internal map object
      const mapInstance = (document.querySelector('.leaflet-container') as unknown)?._leaflet_map;
      if (mapInstance) {
        const center = mapInstance.getCenter();
        return { lat: center.lat, lng: center.lng };
      }
      return null;
    });
  };

  const initialCenter = await getMapCenter();
  expect(initialCenter).not.toBeNull();

  const firstSitterCard = page.locator('.sitter-card').first();
  await firstSitterCard.click();

  // Wait for map animation
  await page.waitForTimeout(1000); // Adjust if needed

  const newCenter = await getMapCenter();
  expect(newCenter).not.toBeNull();

  // Check that the map center has changed
  expect(newCenter?.lat).not.toEqual(initialCenter?.lat);
  expect(newCenter?.lng).not.toEqual(initialCenter?.lng);

  // TODO: Optionally, verify newCenter is close to the sitter's actual coordinates
  // This would require getting the sitter's lat/lng from its data attributes or another source.
  // For example:
  // const sitterLat = parseFloat(await firstSitterCard.getAttribute('data-lat') || '0');
  // const sitterLng = parseFloat(await firstSitterCard.getAttribute('data-lng') || '0');
  // expect(newCenter?.lat).toBeCloseTo(sitterLat, 1); // Adjust precision as needed
  // expect(newCenter?.lng).toBeCloseTo(sitterLng, 1);
});

test('sitter card selection and detail display', async ({ page }) => {
  // Cards are already loaded due to beforeEach

  const firstSitterCard = page.locator(sitterCardSelector).first();
  const sitterName = await firstSitterCard.locator('h3').textContent();

  await firstSitterCard.click();

  // Assert that the clicked sitter card gets a visual indication of being selected
  await expect(firstSitterCard).toHaveClass(/selected/, { timeout: 2000 });

  // Assert that a detail panel becomes visible or profile link appears
  const sitterDetailPanel = page.locator('#sitter-detail'); // Assuming ID for detail panel
  await expect(sitterDetailPanel).toBeVisible({ timeout: 2000 });

  // Assert that the detail panel displays information related to the selected sitter
  // This is a basic check; more specific checks can be added based on actual content
  await expect(sitterDetailPanel).toContainText(sitterName || 'details', { timeout: 2000 });
});

test('sitter cards display key information', async ({ page }) => {
  // Verify first sitter card shows expected information
  const firstSitterCard = page.locator(sitterCardSelector).first();
  
  // Check for sitter name
  const sitterName = firstSitterCard.locator('h3');
  await expect(sitterName).toBeVisible();
  await expect(sitterName).not.toBeEmpty();
  
  // Check for rating
  const rating = firstSitterCard.locator('.sitter-card__rating');
  await expect(rating).toBeVisible();
  
  // Check for price
  const price = firstSitterCard.locator('.sitter-card__price');
  await expect(price).toBeVisible();
  await expect(price).toContainText(/\$\d+/); // Matches price format like $25
  
  // Check for services offered
  const services = firstSitterCard.locator('.sitter-card__services');
  await expect(services).toBeVisible();
});