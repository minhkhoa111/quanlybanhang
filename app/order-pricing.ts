import type { Product } from "@/app/products";

export function moneyToNumber(value?: string) {
  if (!value) return 0;
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

export function productUnitPrice(product?: Product, storage?: string, color?: string, ram?: string) {
  if (!product) return 0;
  const normalizedStorage = normalizeOption(storage);
  const normalizedColor = normalizeOption(color);
  const normalizedRam = normalizeOption(ram);
  const matchingVariants = product.variants?.filter((item) =>
    (!normalizedStorage ||
      normalizeOption(item.storage) === normalizedStorage ||
      normalizeOption(item.name).includes(normalizedStorage)) &&
    (!normalizedRam ||
      normalizeOption(item.ram) === normalizedRam ||
      normalizeOption(item.name).includes(normalizedRam)),
  ) ?? [];
  const variant = matchingVariants.find((item) =>
    normalizedColor && normalizeOption(item.color) === normalizedColor,
  ) ?? matchingVariants[0];

  return moneyToNumber(
    variant?.price || product.salePrice || product.sellingPrice || product.price,
  );
}

export function formatOrderMoney(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function normalizeOption(value?: string) {
  return (value ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}
