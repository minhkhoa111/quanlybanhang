export type PreorderProduct = {
  id: string;
  family: "iphone" | "macbook" | "ipad";
  familyLabel: string;
  name: string;
  description: string;
  image: string;
  capacities: string[];
  colors: string[];
};

export const preorderProducts: PreorderProduct[] = [
  {
    id: "iphone-18",
    family: "iphone",
    familyLabel: "iPhone 18 Series",
    name: "iPhone 18",
    description: "Đăng ký phiên bản tiêu chuẩn thế hệ mới.",
    image: "/campaigns/iphone-18-titanium-lineup.jpg",
    capacities: ["256GB", "512GB"],
    colors: ["Đen", "Bạc", "Băng Thanh", "Đỏ Burgundy"],
  },
  {
    id: "iphone-18-pro",
    family: "iphone",
    familyLabel: "iPhone 18 Series",
    name: "iPhone 18 Pro",
    description: "Dòng Pro nhỏ gọn dành cho hiệu năng và camera cao cấp.",
    image: "/campaigns/apple-iphone-18-pro-official.jpg",
    capacities: ["256GB", "512GB", "1TB", "2TB"],
    colors: ["Đen", "Bạc", "Băng Thanh", "Đỏ Burgundy"],
  },
  {
    id: "iphone-18-pro-max",
    family: "iphone",
    familyLabel: "iPhone 18 Series",
    name: "iPhone 18 Pro Max",
    description: "Màn hình lớn và cấu hình cao nhất trong dòng iPhone 18.",
    image: "/campaigns/iphone-18-pro-flagship-hero.jpg",
    capacities: ["256GB", "512GB", "1TB", "2TB"],
    colors: ["Đen", "Bạc", "Băng Thanh", "Đỏ Burgundy"],
  },
  {
    id: "macbook-air-m5-new",
    family: "macbook",
    familyLabel: "MacBook mới",
    name: "MacBook Air M5 mới",
    description: "Lựa chọn mỏng nhẹ mới với hai kích thước màn hình.",
    image: "/campaigns/apple-macbook-air-m5-official.jpg",
    capacities: ["13 inch · 16GB/512GB", "13 inch · 24GB/1TB", "15 inch · 16GB/512GB", "15 inch · 24GB/1TB"],
    colors: ["Xanh Da Trời", "Bạc", "Ánh Sao", "Đêm Xanh Thẳm"],
  },
  {
    id: "macbook-pro-m5-new",
    family: "macbook",
    familyLabel: "MacBook mới",
    name: "MacBook Pro M5 mới",
    description: "Dành cho công việc chuyên nghiệp và hiệu năng cao.",
    image: "/campaigns/apple-macbook-pro-m5-official.jpg",
    capacities: ["14 inch · M5/16GB/512GB", "14 inch · M5 Pro/24GB/1TB", "16 inch · M5 Pro/24GB/1TB"],
    colors: ["Đen Không Gian", "Bạc"],
  },
  {
    id: "ipad-air-m4-new",
    family: "ipad",
    familyLabel: "iPad mới",
    name: "iPad Air M4 mới",
    description: "iPad mỏng nhẹ dành cho học tập, làm việc và sáng tạo.",
    image: "/products/apple/ipad-air/apple-hero.png",
    capacities: ["11 inch · 128GB", "11 inch · 256GB", "13 inch · 128GB", "13 inch · 256GB"],
    colors: ["Xám Không Gian", "Xanh Dương", "Tím", "Ánh Sao"],
  },
  {
    id: "ipad-pro-m5-new",
    family: "ipad",
    familyLabel: "iPad mới",
    name: "iPad Pro M5 mới",
    description: "Màn hình cao cấp và sức mạnh M5 cho nhu cầu chuyên nghiệp.",
    image: "/products/apple/ipad-pro/apple-hero.jpg",
    capacities: ["11 inch · 256GB", "11 inch · 512GB", "13 inch · 256GB", "13 inch · 512GB"],
    colors: ["Đen Không Gian", "Bạc"],
  },
];
