import { test, expect } from '@playwright/test';

test.describe('Section 2: API Technical Assessment Suite (API-001 to API-010 Strictly Ordered)', () => {

  const searchEndpoint = '/api/searchProduct';

  /**
   * API-001: Valid product search for 'top'
   */
  test('API-001: Valid product search for "top"', async ({ request }) => {
    const response = await request.post(searchEndpoint, {
      form: { search_product: 'top' }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.responseCode).toBe(200);
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
  });

  /**
   * API-002: Search with no matching products
   */
  test('API-002: Search with no matching products', async ({ request }) => {
    const response = await request.post(searchEndpoint, {
      form: { search_product: 'xyznonexistent12345' }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty('responseCode');
    expect([200, 404]).toContain(body.responseCode);
  });

  /**
   * API-003: Omit required search parameter
   */
  test('API-003: Omit required search parameter', async ({ request }) => {
    const response = await request.post(searchEndpoint);

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.responseCode).toBe(400);
    expect(body.message).toContain('search_product parameter is missing');
  });

  /**
   * API-004: Validate response schema
   */
  test('API-004: Validate response schema', async ({ request }) => {
    const response = await request.post(searchEndpoint, {
      form: { search_product: 'top' }
    });

    const body = await response.json();

    expect(body).toHaveProperty('responseCode');
    expect(body).toHaveProperty('products');
    
    const firstProduct = body.products[0];
    expect(typeof firstProduct.id).toBe('number');
    expect(typeof firstProduct.name).toBe('string');
    expect(typeof firstProduct.price).toBe('string');
    expect(typeof firstProduct.brand).toBe('string');
  });

  /**
   * API-005: Verify product name in API
   */
  test('API-005: Verify product name in API', async ({ request }) => {
    const response = await request.post(searchEndpoint, {
      form: { search_product: 'Blue Top' }
    });

    const body = await response.json();
    const product = body.products.find((p: any) => p.name === 'Blue Top');

    expect(product).toBeDefined();
    expect(product.name).toBe('Blue Top');
  });

  /**
   * API-006: Verify product price in API
   */
  test('API-006: Verify product price in API', async ({ request }) => {
    const response = await request.post(searchEndpoint, {
      form: { search_product: 'top' }
    });

    const body = await response.json();
    const firstProduct = body.products[0];

    expect(firstProduct.price).toBeDefined();
    expect(firstProduct.price).toMatch(/Rs\.\s?\d+/);
  });

  /**
   * API-007: Compare API price with UI (Search, Detail Page, Cart)
   */
  test('API-007: Compare API price with UI across search, detail page, and cart', async ({ page, request }) => {
    // 1. API Price
    const apiRes = await request.post(searchEndpoint, {
      form: { search_product: 'Blue Top' }
    });
    const apiBody = await apiRes.json();
    const apiProduct = apiBody.products.find((p: any) => p.name === 'Blue Top');
    const apiPriceNumeric = parseInt(apiProduct.price.replace(/\D/g, ''), 10);

    // 2. Search Result UI Price
    await page.goto('/products');
    await page.locator('#search_product').fill('Blue Top');
    await page.locator('#submit_search').click();
    const searchUiPriceText = await page.locator('.productinfo h2').first().innerText();
    const searchUiPriceNumeric = parseInt(searchUiPriceText.replace(/\D/g, ''), 10);
    expect(searchUiPriceNumeric).toBe(apiPriceNumeric);

    // 3. Product Detail Page (PDP) Price
    await page.locator('.choose a').first().click();
    const pdpPriceText = await page.locator('.product-information span span').innerText();
    const pdpPriceNumeric = parseInt(pdpPriceText.replace(/\D/g, ''), 10);
    expect(pdpPriceNumeric).toBe(apiPriceNumeric);

    // 4. Cart Subtotal Price Calculation
    await page.locator('#quantity').fill('2');
    await page.locator('button.cart').click();
    await page.locator('u:has-text("View Cart")').click();

    const cartTotalText = await page.locator('.cart_total_price').innerText();
    const cartTotalNumeric = parseInt(cartTotalText.replace(/\D/g, ''), 10);
    expect(cartTotalNumeric).toBe(apiPriceNumeric * 2);
  });

  /**
   * API-008: Validate HTTP status codes
   */
  test('API-008: Validate HTTP status codes', async ({ request }) => {
    // Valid Request
    const validRes = await request.post(searchEndpoint, {
      form: { search_product: 'top' }
    });
    expect(validRes.status()).toBe(200);

    // Missing Parameter Request
    const missingParamRes = await request.post(searchEndpoint);
    expect(missingParamRes.status()).toBe(200);
    const missingParamBody = await missingParamRes.json();
    expect(missingParamBody.responseCode).toBe(400);

    // Invalid Method Request (GET instead of POST)
    const getRes = await request.get(searchEndpoint);
    expect(getRes.status()).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.responseCode).toBe(405);
  });

  /**
   * API-009: Record response time (lightweight check)
   */
  test('API-009: Record response time (lightweight check)', async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.post(searchEndpoint, {
      form: { search_product: 'top' }
    });
    
    const elapsedTimeMs = Date.now() - startTime;
    console.log(`[API-009] Lightweight Check Elapsed Time: ${elapsedTimeMs}ms`);

    expect(response.status()).toBe(200);
    expect(elapsedTimeMs).toBeLessThan(3000);
  });

  /**
   * API-010: Verify product data consistency (API vs PDP)
   */
  test('API-010: Verify product data consistency between API and product detail page', async ({ page, request }) => {
    // 1. Fetch API Product Data
    const apiRes = await request.post(searchEndpoint, {
      form: { search_product: 'Blue Top' }
    });
    const apiBody = await apiRes.json();
    const apiProduct = apiBody.products.find((p: any) => p.name === 'Blue Top');

    // 2. Compare with PDP Page via Stable Product ID
    await page.goto(`/product_details/${apiProduct.id}`);

    const pdpName = await page.locator('.product-information h2').innerText();
    const pdpPriceText = await page.locator('.product-information span span').innerText();

    expect(pdpName.trim()).toBe(apiProduct.name.trim());
    const pdpPriceNumeric = parseInt(pdpPriceText.replace(/\D/g, ''), 10);
    const apiPriceNumeric = parseInt(apiProduct.price.replace(/\D/g, ''), 10);
    expect(pdpPriceNumeric).toBe(apiPriceNumeric);
  });

});