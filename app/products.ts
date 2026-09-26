export type ProductColor = { name: string; hex: string };
export type ProductMediaLink = { label: string; url: string };

export type Product = {
  id?: string;
  slug: string;
  name: string;
  brand: string;
  category: "iphone" | "android" | "ipad" | "tablet" | "macbook" | "macbook-air" | "macbook-pro" | "mac-mini-studio" | "imac" | "laptop" | "laptop-cu" | "smartwatch" | "audio" | "phu-kien" | "may-anh";
  image: string;
  images?: string[];
  badge: string;
  tagline: string;
  price: string;
  sku?: string;
  description?: string;
  condition?: "new" | "like-new";
  conditionLabel?: string;
  costPrice?: string;
  sellingPrice?: string;
  salePrice?: string;
  oldPrice?: string;
  stock?: number;
  status?: "draft" | "active" | "inactive";
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  variants?: ProductVariant[];
  colors: string[];
  colorOptions?: ProductColor[];
  storageOptions?: string[];
  mediaLinks?: ProductMediaLink[];
  specs: string[];
  featured?: boolean;
  active?: boolean;
  source: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  color?: string;
  colorHex?: string;
  size?: string;
  ram?: string;
  storage?: string;
  version?: string;
  sku?: string;
  barcode?: string;
  costPrice?: string;
  price?: string;
  salePrice?: string;
  stock?: number;
  status?: "active" | "inactive";
  serials?: string[];
  image?: string;
};

import { appleComputerProducts } from "./apple-products";
import { appleDesktopProducts } from "./apple-desktop-products";
import { expandedProducts } from "./expanded-products";
import { tuandigiProducts } from "./tuandigi-products";
import { retailExpansionProducts } from "./retail-expansion-products";
import { infinityAccessories } from "./infinity-accessories";
import { cameraProducts } from "./camera-products";
import { macbookProProducts } from "./macbook-pro-products";
import { macbookAirProducts } from "./macbook-air-products";
import { maytinhgiareLaptopProducts } from "./maytinhgiare-laptop-products";

import { iphone18Products } from "./iphone-18-products";

export const products: Product[] = [
  ...iphone18Products,
  { slug:"iphone-17-pro", name:"iPhone 17 Pro 256GB | Chính hãng", brand:"Apple", category:"iphone", image:"/products/iphone-17-pro.png", badge:"", tagline:"iPhone 17 Pro 256GB | Chính hãng", price:"31.290.000đ", colors:["#111111"], specs:["6.3 inches","256 GB"], source:"" },
  { slug:"iphone-17-pro-max", name:"iPhone 17 Pro Max 256GB | Chính hãng", brand:"Apple", category:"iphone", image:"/products/iphone-17-pro-max.jpg", badge:"", tagline:"iPhone 17 Pro Max 256GB | Chính hãng", price:"34.290.000đ", colors:["#111111"], specs:["6.9 inches","256 GB"], source:"" },
  { slug:"iphone-17-256gb", name:"iPhone 17 256GB | Chính hãng", brand:"Apple", category:"iphone", image:"/products/iphone-17-256gb.jpg", badge:"", tagline:"iPhone 17 256GB | Chính hãng", price:"23.890.000đ", colors:["#111111"], specs:["6.3 inches","256 GB"], source:"" },
  { slug:"iphone-16-pro-max", name:"Điện thoại iPhone 16 Pro Max 256GB", brand:"Apple", category:"iphone", image:"/products/iphone-16-pro-max.png", badge:"", tagline:"Điện thoại iPhone 16 Pro Max 256GB", price:"30.990.000đ", colors:["#111111"], specs:["6.9 inches","8 GB","256 GB"], source:"" },
  { slug:"iphone-17-pro-max-512gb", name:"iPhone 17 Pro Max 512GB | Chính hãng", brand:"Apple", category:"iphone", image:"/products/iphone-17-pro-max-512gb.jpg", badge:"", tagline:"iPhone 17 Pro Max 512GB | Chính hãng", price:"41.490.000đ", colors:["#111111"], specs:["6.9 inches","512 GB"], source:"" },
  { slug:"iphone-15", name:"iPhone 15 128GB | Chính hãng VN/A", brand:"Apple", category:"iphone", image:"/products/iphone-15.png", badge:"", tagline:"iPhone 15 128GB | Chính hãng VN/A", price:"18.490.000đ", colors:["#111111"], specs:["6.1 inches","6 GB","128 GB"], source:"" },
  { slug:"iphone-air-256gb", name:"iPhone Air 256GB | Chính hãng", brand:"Apple", category:"iphone", image:"/products/iphone-air-256gb.jpg", badge:"", tagline:"iPhone Air 256GB | Chính hãng", price:"22.990.000đ", colors:["#111111"], specs:["6.5 inches","256 GB"], source:"" },
  { slug:"iphone-17-pro-max-1tb", name:"iPhone 17 Pro Max 1TB | Chính hãng", brand:"Apple", category:"iphone", image:"/products/iphone-17-pro-max-1tb.jpg", badge:"", tagline:"iPhone 17 Pro Max 1TB | Chính hãng", price:"47.990.000đ", colors:["#111111"], specs:["6.9 inches","1 TB"], source:"" },
  { slug:"iphone-17e", name:"iPhone 17e 256GB | Chính hãng", brand:"Apple", category:"iphone", image:"/products/iphone-17e.png", badge:"", tagline:"iPhone 17e 256GB | Chính hãng", price:"17.490.000đ", colors:["#111111"], specs:["6.1 inches","256 GB"], source:"" },
  { slug:"iphone-17-pro-max-2tb", name:"iPhone 17 Pro Max 2TB | Chính hãng", brand:"Apple", category:"iphone", image:"/products/iphone-17-pro-max-2tb.jpg", badge:"", tagline:"iPhone 17 Pro Max 2TB | Chính hãng", price:"60.490.000đ", colors:["#111111"], specs:["6.9 inches","2 TB"], source:"" },
  { slug:"iphone-13", name:"iPhone 13 128GB | Chính hãng VN/A", brand:"Apple", category:"iphone", image:"/products/iphone-13.jpg", badge:"", tagline:"iPhone 13 128GB | Chính hãng VN/A", price:"13.790.000đ", colors:["#111111"], specs:["6.1 inches","4 GB","128 GB"], source:"" },
  { slug:"iphone-17-pro-512gb", name:"iPhone 17 Pro 512GB | Chính hãng", brand:"Apple", category:"iphone", image:"/products/iphone-17-pro-512gb.jpg", badge:"", tagline:"iPhone 17 Pro 512GB | Chính hãng", price:"37.790.000đ", colors:["#111111"], specs:["6.3 inches","512 GB"], source:"" },
  { slug:"iphone-16e", name:"iPhone 16e 128GB | Chính hãng VN/A", brand:"Apple", category:"iphone", image:"/products/iphone-16e.png", badge:"", tagline:"iPhone 16e 128GB | Chính hãng VN/A", price:"13.690.000đ", colors:["#111111"], specs:["6.1 inches","128 GB"], source:"" },
  { slug:"iphone-17-512gb", name:"iPhone 17 512GB | Chính hãng", brand:"Apple", category:"iphone", image:"/products/iphone-17-512gb.jpg", badge:"", tagline:"iPhone 17 512GB | Chính hãng", price:"29.790.000đ", colors:["#111111"], specs:["6.3 inches","512 GB"], source:"" },
  { slug:"iphone-14", name:"iPhone 14 128GB | Chính hãng VN/A", brand:"Apple", category:"iphone", image:"/products/iphone-14.jpg", badge:"", tagline:"iPhone 14 128GB | Chính hãng VN/A", price:"15.290.000đ", colors:["#111111"], specs:["6.1 inches","6 GB","128 GB"], source:"" },
  { slug:"iphone-15-256gb", name:"iPhone 15 256GB | Chính hãng VN/A", brand:"Apple", category:"iphone", image:"/products/iphone-15-256gb.png", badge:"", tagline:"iPhone 15 256GB | Chính hãng VN/A", price:"20.890.000đ", colors:["#111111"], specs:["6.1 inches","6 GB","256 GB"], source:"" },
  { slug:"iphone-16", name:"iPhone 16 128GB | Chính hãng VN/A", brand:"Apple", category:"iphone", image:"/products/iphone-16.png", badge:"", tagline:"iPhone 16 128GB | Chính hãng VN/A", price:"20.290.000đ", colors:["#111111"], specs:["6.1 inches","8 GB","128 GB"], source:"" },
  { slug:"iphone-16-pro-max-512gb", name:"iPhone 16 Pro Max 512GB | Chính hãng VN/A", brand:"Apple", category:"iphone", image:"/products/iphone-16-pro-max-512gb.png", badge:"", tagline:"iPhone 16 Pro Max 512GB | Chính hãng VN/A", price:"38.990.000đ", colors:["#111111"], specs:["6.9 inches","512 GB"], source:"" },
  { slug:"iphone-15-plus", name:"iPhone 15 Plus 128GB | Chính hãng VN/A", brand:"Apple", category:"iphone", image:"/products/iphone-15-plus.png", badge:"", tagline:"iPhone 15 Plus 128GB | Chính hãng VN/A", price:"17.690.000đ", colors:["#111111"], specs:["6.7 inches","6 GB","128 GB"], source:"" },
  { slug:"iphone-16-plus", name:"iPhone 16 Plus 128GB | Chính hãng VN/A", brand:"Apple", category:"iphone", image:"/products/iphone-16-plus.png", badge:"", tagline:"iPhone 16 Plus 128GB | Chính hãng VN/A", price:"24.290.000đ", colors:["#111111"], specs:["6.7 inches","8 GB","128 GB"], source:"" },
  { slug:"oppo-find-x8-pro", name:"OPPO Find X8 Pro", brand:"OPPO", category:"android", image:"/products/oppo-find-x8-pro.png", badge:"Android", tagline:"Android cao cấp với camera linh hoạt và pin tốt.", price:"22.990.000đ", colors:["#111111"], specs:["6.78 inches","16 GB","512 GB"], source:"" },

  ...expandedProducts,
  ...appleComputerProducts,
  ...appleDesktopProducts,
  ...tuandigiProducts,
  ...retailExpansionProducts,
  ...infinityAccessories,
  ...cameraProducts,
  ...macbookProProducts,
  ...macbookAirProducts,
  ...maytinhgiareLaptopProducts,
];

export const getProduct = (slug: string) => products.find((product) => product.slug === slug);
