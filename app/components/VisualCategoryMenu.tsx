import Image from "next/image";
import Link from "next/link";

const categories = [
  { label: "iPhone", href: "/iphone", image: "/products/iphone-17-pro.png" },
  { label: "iPad", href: "/ipad", image: "/products/apple/ipad-air/apple-hero.png" },
  { label: "MacBook", href: "/macbook", image: "/products/apple/macbook-air/apple-hero.png" },
  { label: "Mac mini & Studio", href: "/mac-mini-studio", image: "/products/apple/mac-studio/front.jpg" },
  { label: "iMac", href: "/imac", image: "/products/apple/imac/hero.jpg" },
  { label: "Laptop", href: "/laptop", image: "/products/expanded/rog-scar18.jpg" },
  { label: "Samsung", href: "/samsung", image: "/category-menu/samsung.jpg" },
  { label: "Android", href: "/android", image: "/category-menu/android.png" },
] as const;

export default function VisualCategoryMenu() {
  return (
    <nav className="visual-category-menu" aria-label="Danh mục sản phẩm nổi bật">
      <div className="shell visual-category-scroll">
        <div className="visual-category-list">
          {categories.map((category) => (
            <Link
              className="visual-category-item"
              href={category.href}
              key={category.label}
            >
              <span className="visual-category-image" aria-hidden="true">
                <Image
                  src={category.image}
                  alt=""
                  fill
                  sizes="(max-width: 760px) 120px, 150px"
                  unoptimized
                />
              </span>
              <span className="visual-category-label">{category.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
