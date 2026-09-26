import type { ProductVariant } from "./products";

type ConfigurationRule = {
  ram: readonly string[];
  storage: readonly string[];
};

const CURRENT_MACBOOK_RULES: Record<string, ConfigurationRule> = {
  "macbook-neo-a18-pro": { ram: ["8GB"], storage: ["256GB", "512GB"] },
  "macbook-air-13-m5": { ram: ["16GB", "24GB", "32GB"], storage: ["512GB", "1TB", "2TB", "4TB"] },
  "macbook-air-15-m5": { ram: ["16GB", "24GB", "32GB"], storage: ["512GB", "1TB", "2TB", "4TB"] },
  "macbook-pro-14-m5": { ram: ["16GB", "24GB", "32GB"], storage: ["512GB", "1TB", "2TB", "4TB"] },
  "macbook-pro-14-m5-pro": { ram: ["24GB", "48GB", "64GB"], storage: ["1TB", "2TB", "4TB"] },
  "macbook-pro-16-m5-pro": { ram: ["24GB", "48GB", "64GB"], storage: ["1TB", "2TB", "4TB"] },
  "macbook-pro-14-m5-max": { ram: ["36GB", "48GB", "64GB", "128GB"], storage: ["2TB", "4TB", "8TB"] },
  "macbook-pro-16-m5-max": { ram: ["36GB", "48GB", "64GB", "128GB"], storage: ["2TB", "4TB", "8TB"] },
};

function normalize(value?: string) {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

export function assertManufacturerConfigurations(slug: string, variants: ProductVariant[]) {
  const rule = CURRENT_MACBOOK_RULES[slug];
  if (!rule) return;

  const allowedRam = new Set(rule.ram.map(normalize));
  const allowedStorage = new Set(rule.storage.map(normalize));
  for (const variant of variants) {
    const ram = normalize(variant.ram);
    const storage = normalize(variant.storage);
    if (ram && !allowedRam.has(ram)) {
      throw new Error(`RAM ${variant.ram} không thuộc cấu hình chính thức của model này.`);
    }
    if (storage && !allowedStorage.has(storage)) {
      throw new Error(`SSD ${variant.storage} không thuộc cấu hình chính thức của model này.`);
    }
  }
}
