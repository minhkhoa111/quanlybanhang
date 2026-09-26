import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { iphone18Products } from '../app/iphone-18-products.ts';

test('two iPhone 18 models have complete color/storage combinations and local PNGs', async () => {
  assert.equal(iphone18Products.length, 2);
  for (const product of iphone18Products) {
    assert.equal(product.variants.length, 16);
    assert.equal(new Set(product.variants.map(v => v.id)).size, 16);
    assert.equal(product.stock, 0);
    for (const storage of ['256GB', '512GB', '1TB', '2TB']) {
      const variants = product.variants.filter(v => v.storage === storage);
      assert.equal(variants.length, 4);
      assert.equal(new Set(variants.map(v => v.image)).size, 4);
      assert.equal(new Set(variants.map(v => v.price)).size, 1);
    }
    for (const image of product.images) {
      const buffer = await readFile(new URL('../public' + image, import.meta.url));
      assert.equal(buffer.subarray(1, 4).toString(), 'PNG');
      assert.ok(buffer.length > 10000);
    }
    assert.equal(product.mediaLinks.length, 0);
    assert.ok(product.tags.includes('iphone-18-official'));
  }
});
test('retail prices follow the recorded source by capacity', () => {
  assert.deepEqual(iphone18Products.map(p => p.storageOptions.map(storage => p.variants.find(v => v.storage === storage).price)), [
    ['38.990.000đ', '45.490.000đ', '58.490.000đ', '77.990.000đ'],
    ['41.990.000đ', '48.490.000đ', '61.490.000đ', '80.990.000đ'],
  ]);
});
