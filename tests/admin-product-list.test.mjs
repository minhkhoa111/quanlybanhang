import test from "node:test";
import assert from "node:assert/strict";
import { productSummary, filterProducts, pageHref, pagination } from "../app/admin/products/product-list-utils.ts";

const product = (overrides = {}) => ({ id: 'p1', slug: 'iphone', name: 'iPhone', brand: 'Apple', sku: 'IP-01', category: 'iphone', active: true, price: '25.000.000đ', stock: 40, updatedAt: 1, ...overrides });

test('stock and price use active variants, including sale price', () => {
  const result = productSummary(product({ variants: [{ stock: 2, price: '30.000.000đ', salePrice: '27.000.000đ' }, { stock: 1, price: '28.000.000đ' }, { stock: 100, price: '1.000.000đ', status: 'inactive' }] }));
  assert.equal(result.stock, 3);
  assert.equal(result.price, 27000000);
  assert.equal(result.variants.length, 2);
});

test('low stock filters use the displayed variant total and exclude sold out', () => {
  const low = product({ id: 'low', stock: 100, variants: [{ stock: 2 }] });
  const out = product({ id: 'out', stock: 0 });
  assert.deepEqual(filterProducts([low, out, product()], { stock: 'low' }).map((p) => p.id), ['low']);
  assert.deepEqual(filterProducts([low, out], { stock: 'out' }).map((p) => p.id), ['out']);
});

test('combined category, status and case insensitive SKU filtering', () => {
  const products = [product(), product({ id: 'hidden', active: false }), product({ id: 'laptop', category: 'laptop' })];
  assert.deepEqual(filterProducts(products, { q: 'ip-01', category: 'iphone', status: 'active' }).map((p) => p.id), ['p1']);
});

test('sorts by actual displayed price and latest update without mutating input', () => {
  const products = [product({ id: 'old' }), product({ id: 'new', updatedAt: 10, variants: [{ price: '35.000.000đ', stock: 1 }] })];
  assert.deepEqual(filterProducts(products, {}).map((p) => p.id), ['new', 'old']);
  assert.deepEqual(filterProducts(products, { sort: 'price' }).map((p) => p.id), ['new', 'old']);
  assert.equal(products[0].id, 'old');
});

test('pagination links preserve filters and encode search safely', () => {
  const url = new URL(pageHref({ q: 'A&B + C', category: 'iphone', stock: 'low', sort: 'price' }, 3, 'draft'), 'https://example.test');
  assert.equal(url.searchParams.get('q'), 'A&B + C');
  assert.equal(url.searchParams.get('status'), 'draft');
  assert.equal(url.searchParams.get('page'), '3');
  assert.equal(url.searchParams.get('stock'), 'low');
  assert.equal(pageHref({}, 1), '/admin/products');
});

test('bounded page navigation keeps first, last and neighbors', () => {
  assert.deepEqual(pagination(50, 100), [1, 49, 50, 51, 100]);
  assert.deepEqual(pagination(1, 1), [1]);
  assert.deepEqual(pagination(1, 3), [1, 2, 3]);
});
