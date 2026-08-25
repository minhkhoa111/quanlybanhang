export type Promo = {
  image: string;
  href: string;
  alt?: string;
};

const promos: Promo[] = [
  // Save the attached promo image to public/ads/promo-m5.jpg
  { image: "/ads/promo-m5.jpg", href: "/san-pham/iphone-17-pro", alt: "Apple M5 - iPhone 17 Pro" },
  // Additional placeholders (optional)
  { image: "/ads/promo-2.jpg", href: "/san-pham/iphone-17-pro-max", alt: "Khuyến mãi 2" },
  { image: "/ads/promo-3.jpg", href: "/san-pham/iphone-17-256gb", alt: "Khuyến mãi 3" },
];

export default promos;
