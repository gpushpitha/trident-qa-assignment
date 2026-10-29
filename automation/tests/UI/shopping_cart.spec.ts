import { test, expect } from '@playwright/test';

test.describe('Section 1: Customer Journey Automated Suite (SC-001 to SC-028 Strictly Ordered)', () => {

  test.beforeEach(async ({ page }) => {
    // Prevent Google Ads and Third-party overlays from blocking UI clicks
    await page.route('**/*google*', route => route.abort());
    await page.route('**/*doubleclick*', route => route.abort());
    
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
  });

  // ==========================================
  // PRODUCT SEARCH (SC-001 to SC-007)
  // ==========================================

  /**
   * SC-001: Search for valid product
   */
  test('SC-001: Search for valid product "top"', async ({ page }) => {
    await page.locator('#search_product').fill('top');
    await page.locator('#submit_search').click();

    const titleHeader = page.locator('.title.text-center');
    await expect(titleHeader).toBeVisible();
    await expect(titleHeader).toHaveText('Searched Products');

    const productCards = page.locator('.product-image-wrapper');
    await expect(productCards.first()).toBeVisible();
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  /**
   * SC-002: Search for nonexistent product
   */
  test('SC-002: Search for nonexistent product', async ({ page }) => {
    await page.locator('#search_product').fill('xyznonexistent12345');
    await page.locator('#submit_search').click();

    const productCards = page.locator('.product-image-wrapper');
    expect(await productCards.count()).toBe(0);
  });

  /**
   * SC-003: Search with empty input
   */
  test('SC-003: Search with empty input', async ({ page }) => {
    await page.locator('#search_product').fill('');
    await page.locator('#submit_search').click();

    const productCards = page.locator('.product-image-wrapper');
    await expect(productCards.first()).toBeVisible();
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  /**
   * SC-004: Search with uppercase text
   */
  test('SC-004: Search with uppercase text "TOP"', async ({ page }) => {
    await page.locator('#search_product').fill('TOP');
    await page.locator('#submit_search').click();

    const productCards = page.locator('.product-image-wrapper');
    await expect(productCards.first()).toBeVisible();
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  /**
   * SC-005: Search with leading/trailing spaces
   */
  test('SC-005: Search with leading/trailing spaces " top "', async ({ page }) => {
    await page.locator('#search_product').fill(' top ');
    await page.locator('#submit_search').click();

    const productCards = page.locator('.product-image-wrapper');
    await expect(productCards.first()).toBeVisible();
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  /**
   * SC-006: Search using keyboard Enter key
   */
  test('SC-006: Search using keyboard Enter key', async ({ page }) => {
    const searchInput = page.locator('#search_product');
    await searchInput.fill('top');
    await searchInput.press('Enter');

    const titleHeader = page.locator('.title.text-center');
    await expect(titleHeader).toBeVisible();
  });

  /**
   * SC-007: Verify product details in search results
   */
  test('SC-007: Verify product details in search results', async ({ page }) => {
    await page.locator('#search_product').fill('top');
    await page.locator('#submit_search').click();

    const firstProduct = page.locator('.productinfo').first();
    await expect(firstProduct.locator('p')).toBeVisible();
    await expect(firstProduct.locator('h2')).toContainText('Rs.');
  });


  // ==========================================
  // PRODUCT DETAILS (SC-008 to SC-014)
  // ==========================================

  /**
   * SC-008: Open product details
   */
  test('SC-008: Open product details page', async ({ page }) => {
    await page.locator('#search_product').fill('top');
    await page.locator('#submit_search').click();

    await page.locator('.choose a').first().click();
    await expect(page).toHaveURL(/\/product_details\/\d+/);
  });

  /**
   * SC-009: Verify product name
   */
  test('SC-009: Verify product name on detail page', async ({ page }) => {
    await page.locator('#search_product').fill('top');
    await page.locator('#submit_search').click();

    const gridName = await page.locator('.productinfo p').first().innerText();
    await page.locator('.choose a').first().click();

    const pdpName = await page.locator('.product-information h2').innerText();
    expect(pdpName.trim().toLowerCase()).toBe(gridName.trim().toLowerCase());
  });

  /**
   * SC-010: Verify product price
   */
  test('SC-010: Verify product price on detail page', async ({ page }) => {
    await page.locator('#search_product').fill('top');
    await page.locator('#submit_search').click();

    const gridPrice = await page.locator('.productinfo h2').first().innerText();
    await page.locator('.choose a').first().click();

    const pdpPrice = await page.locator('.product-information span span').innerText();
    expect(pdpPrice.replace(/\D/g, '')).toBe(gridPrice.replace(/\D/g, ''));
  });

  /**
   * SC-011: Verify main product image
   */
  test('SC-011: Verify main product image loads', async ({ page }) => {
    await page.goto('/product_details/1');

    const mainImg = page.locator('.view-product img');
    await expect(mainImg).toBeVisible();

    const naturalWidth = await mainImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });

  /**
   * SC-012: Change quantity from 1 to 2
   */
  test('SC-012: Change quantity from 1 to 2', async ({ page }) => {
    await page.goto('/product_details/1');

    const qtyInput = page.locator('#quantity');
    await qtyInput.fill('2');
    await expect(qtyInput).toHaveValue('2');
  });

  /**
   * SC-013: Validate invalid quantity
   */
  test('SC-013: Validate invalid quantity handling', async ({ page }) => {
    await page.goto('/product_details/1');
    const qtyInput = page.locator('#quantity');

    await qtyInput.fill('0');
    await page.locator('button.cart').click();

    const valAfterSubmit = await qtyInput.inputValue();
    expect(parseInt(valAfterSubmit, 10)).toBeGreaterThanOrEqual(1);
  });

  /**
   * SC-014: Keyboard navigation accessibility
   */
  test('SC-014: Keyboard navigation Tab and Enter on PDP', async ({ page }) => {
    await page.goto('/product_details/1');

    await page.keyboard.press('Tab');
    const isInputFocused = await page.locator('#quantity').evaluate(node => node === document.activeElement);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page.locator('.modal-title')).toBeVisible();
  });


  // ==========================================
  // SHOPPING CART (SC-015 to SC-022)
  // ==========================================

  /**
   * SC-015: Add product to cart
   */
  test('SC-015: Add product to cart', async ({ page }) => {
    await page.goto('/product_details/1');
    await page.locator('button.cart').click();

    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
  });

  /**
   * SC-016: Verify cart product name
   */
  test('SC-016: Verify cart product name', async ({ page }) => {
    await page.goto('/product_details/1');
    const pdpName = await page.locator('.product-information h2').innerText();

    await page.locator('button.cart').click();
    await page.locator('u:has-text("View Cart")').click();

    const cartName = await page.locator('.cart_description h4 a').innerText();
    expect(cartName.trim()).toBe(pdpName.trim());
  });

  /**
   * SC-017: Verify cart unit price
   */
  test('SC-017: Verify cart unit price', async ({ page }) => {
    await page.goto('/product_details/1');
    const pdpPriceText = await page.locator('.product-information span span').innerText();
    const unitPrice = parseInt(pdpPriceText.replace(/\D/g, ''), 10);

    await page.locator('button.cart').click();
    await page.locator('u:has-text("View Cart")').click();

    const cartUnitPriceText = await page.locator('.cart_price p').innerText();
    const cartUnitPrice = parseInt(cartUnitPriceText.replace(/\D/g, ''), 10);

    expect(cartUnitPrice).toBe(unitPrice);
  });

  /**
   * SC-018: Verify cart quantity
   */
  test('SC-018: Verify cart quantity set to 2', async ({ page }) => {
    await page.goto('/product_details/1');
    await page.locator('#quantity').fill('2');
    await page.locator('button.cart').click();
    await page.locator('u:has-text("View Cart")').click();

    const cartQtyText = await page.locator('.cart_quantity button').innerText();
    expect(cartQtyText.trim()).toBe('2');
  });

  /**
   * SC-019: Verify cart subtotal/total
   */
  test('SC-019: Verify cart subtotal (Unit Price x Quantity)', async ({ page }) => {
    await page.goto('/product_details/1');
    const pdpPriceText = await page.locator('.product-information span span').innerText();
    const unitPrice = parseInt(pdpPriceText.replace(/\D/g, ''), 10);

    await page.locator('#quantity').fill('2');
    await page.locator('button.cart').click();
    await page.locator('u:has-text("View Cart")').click();

    const cartTotalText = await page.locator('.cart_total_price').innerText();
    const cartTotal = parseInt(cartTotalText.replace(/\D/g, ''), 10);

    expect(cartTotal).toBe(unitPrice * 2);
  });

  /**
   * SC-020: Remove product from cart
   */
  test('SC-020: Remove product from cart', async ({ page }) => {
    await page.goto('/product_details/1');
    await page.locator('button.cart').click();
    await page.locator('u:has-text("View Cart")').click();

    await page.locator('.cart_quantity_delete').first().click();
    await expect(page.locator('#empty_cart')).toBeVisible({ timeout: 5000 });
  });

  /**
   * SC-021: Verify empty cart state
   */
  test('SC-021: Verify empty cart state', async ({ page }) => {
    await page.goto('/view_cart');
    const emptyNotice = page.locator('#empty_cart');
    await expect(emptyNotice).toBeVisible();
  });

  /**
   * SC-022: Add same product twice
   */
  test('SC-022: Add same product twice to verify quantity increment', async ({ page }) => {
    await page.goto('/product_details/1');
    await page.locator('button.cart').click();
    await page.locator('.modal-footer button').click();

    await page.locator('button.cart').click();
    await page.locator('u:has-text("View Cart")').click();

    const cartQtyText = await page.locator('.cart_quantity button').innerText();
    expect(parseInt(cartQtyText, 10)).toBeGreaterThanOrEqual(2);
  });


  // ==========================================
  // CHECKOUT & RESPONSIVE UI (SC-023 to SC-028)
  // ==========================================

  /**
   * SC-023: Proceed to checkout
   */
  test('SC-023: Proceed to checkout from cart', async ({ page }) => {
    await page.goto('/product_details/1');
    await page.locator('button.cart').click();
    await page.locator('u:has-text("View Cart")').click();

    await page.locator('.check_out').click();
    await expect(page.locator('.modal-content')).toBeVisible();
  });

  /**
   * SC-024: Checkout without login
   */
  test('SC-024: Checkout without login triggers authentication modal', async ({ page }) => {
    await page.goto('/product_details/1');
    await page.locator('button.cart').click();
    await page.locator('u:has-text("View Cart")').click();

    await page.locator('.check_out').click();
    const modalText = await page.locator('.modal-content').innerText();
    expect(modalText).toMatch(/Register \/ Login/i);
  });

  /**
   * SC-025: Desktop layout (1920x1080)
   */
  test('SC-025: Desktop layout (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/products');

    await expect(page.locator('#search_product')).toBeVisible();
    await expect(page.locator('.left-sidebar')).toBeVisible();
  });

  /**
   * SC-026: Mobile layout at 390 x 844
   */
  test('SC-026: Mobile layout at 390 x 844 viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/products');

    const searchInput = page.locator('#search_product');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('top');
    await page.locator('#submit_search').click();

    const productCards = page.locator('.product-image-wrapper');
    await expect(productCards.first()).toBeVisible();
    expect(await productCards.count()).toBeGreaterThan(0);
  });

  /**
   * SC-027: Check horizontal overflow on mobile
   */
  test('SC-027: Check horizontal overflow on mobile (390 x 844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/products');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  /**
   * SC-028: Add to cart on mobile
   */
  test('SC-028: Add to cart on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/product_details/1');

    await page.locator('#quantity').fill('2');
    await page.locator('button.cart').click();

    await expect(page.locator('.modal-content')).toBeVisible();
  });

});