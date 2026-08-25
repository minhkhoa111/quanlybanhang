import type { Product } from "./products";

export type CategoryCampaign = {
  brand: string;
  headline: string;
  description: string;
  image: string;
  imageAlt: string;
  sourceLabel: string;
  sourceUrl: string;
  sectionTitle: string;
  sectionNote: string;
  offers: string[];
  facts: string[];
  dark?: boolean;
};

export const categoryCampaigns: Partial<Record<Product["category"], CategoryCampaign>> = {
  iphone: {
    brand: "Apple | iPhone 17 Pro",
    headline: "Hiệu năng Pro. Camera sẵn sàng cho mọi khung hình.",
    description: "Khám phá dòng iPhone hiện hành với đầy đủ dung lượng, màu hoàn thiện và giá theo từng cấu hình.",
    image: "/products/apple/iphone-17-pro-official/cosmic-orange.jpg",
    imageAlt: "iPhone 17 Pro màu Cam Vũ Trụ",
    sourceLabel: "Hình ảnh sản phẩm từ Apple",
    sourceUrl: "https://www.apple.com/vn/iphone-17-pro/",
    sectionTitle: "iPhone nổi bật",
    sectionNote: "Các model hiện hành và sản phẩm được quan tâm tại cửa hàng",
    offers: ["Thu cũ đổi mới", "Trả góp linh hoạt", "Giao nhanh nội thành"],
    facts: ["Chip A19 và A19 Pro", "Camera Fusion 48MP", "Màu sắc theo đúng từng model"],
    dark: true,
  },
  macbook: {
    brand: "Apple | MacBook",
    headline: "MacBook mới. Làm việc nhanh, sáng tạo liền mạch.",
    description: "Từ MacBook Air mỏng nhẹ đến MacBook Pro hiệu năng cao, mỗi model đều có RAM, SSD, màu và giá riêng.",
    image: "/products/apple/macbook-air/apple-hero.png",
    imageAlt: "MacBook Air màu Xanh Da Trời",
    sourceLabel: "Hình ảnh sản phẩm từ Apple",
    sourceUrl: "https://www.apple.com/vn/mac/",
    sectionTitle: "MacBook đang có",
    sectionNote: "Tách đúng MacBook Air và MacBook Pro, chọn cấu hình ngay trên trang sản phẩm",
    offers: ["Thu cũ đổi mới", "Ưu đãi học sinh sinh viên", "Trả góp linh hoạt"],
    facts: ["MacBook Air mỏng nhẹ", "MacBook Pro cho công việc chuyên sâu", "RAM và SSD theo từng cấu hình"],
  },
  "mac-mini-studio": {
    brand: "Apple | Mac mini & Mac Studio",
    headline: "Apple silicon cho bàn làm việc gọn gàng và mạnh mẽ.",
    description: "Chọn Mac mini nhỏ gọn hoặc Mac Studio hiệu năng cao, với RAM và SSD đúng theo từng cấu hình.",
    image: "/products/apple/mac-mini/hero.jpg",
    imageAlt: "Mac mini với chip Apple silicon",
    sourceLabel: "Thông số chính thức từ Apple",
    sourceUrl: "https://www.apple.com/vn/mac/desktop/",
    sectionTitle: "Mac mini và Mac Studio",
    sectionNote: "Giá tham khảo theo Tuấn Digi, cấu hình và hình ảnh đối chiếu từ Apple",
    offers: ["Cấu hình rõ ràng", "Trả góp linh hoạt", "Hỗ trợ thiết lập"],
    facts: ["Mac mini nhỏ gọn", "Mac Studio cho công việc chuyên nghiệp", "RAM và SSD theo từng cấu hình"],
  },
  imac: {
    brand: "Apple | iMac",
    headline: "Màn hình 4.5K và Apple silicon trong một thiết kế liền mạch.",
    description: "Khám phá iMac 24 inch với nhiều màu hoàn thiện, cấu hình RAM, SSD và mức giá riêng.",
    image: "/products/apple/imac/hero.jpg",
    imageAlt: "Bộ sưu tập iMac 24 inch nhiều màu",
    sourceLabel: "Thông số chính thức từ Apple",
    sourceUrl: "https://www.apple.com/vn/imac/",
    sectionTitle: "iMac đang có",
    sectionNote: "Các phiên bản M4 và M3 với đủ màu sắc, RAM và SSD",
    offers: ["Bảy màu hoàn thiện", "Trả góp linh hoạt", "Hỗ trợ thiết lập"],
    facts: ["Màn hình Retina 4.5K 24 inch", "Camera Center Stage", "Thiết kế all-in-one"],
  },
  samsung: {
    brand: "Samsung Galaxy",
    headline: "Galaxy mới. Camera, màn hình và trải nghiệm AI trong một thiết bị.",
    description: "Khám phá Galaxy S, Galaxy Z và Galaxy A với cấu hình, màu sắc và giá bán rõ ràng.",
    image: "/products/dien-thoai-samsung-galaxy-s26-ultra.jpg",
    imageAlt: "Samsung Galaxy S26 Ultra",
    sourceLabel: "Khám phá điện thoại Galaxy tại Samsung",
    sourceUrl: "https://www.samsung.com/vn/smartphones/",
    sectionTitle: "Samsung Galaxy nổi bật",
    sectionNote: "Galaxy S, dòng gập và Galaxy A đang được quan tâm",
    offers: ["Đổi máy cũ", "Trả góp linh hoạt", "Giao hàng toàn quốc"],
    facts: ["Galaxy S hiệu năng cao", "Galaxy Z gập linh hoạt", "Galaxy A dễ tiếp cận"],
  },
  android: {
    brand: "Android flagship",
    headline: "Nhiều lựa chọn hơn từ Huawei, Xiaomi, OPPO và Redmi.",
    description: "So sánh nhanh camera, hiệu năng, dung lượng pin và sạc nhanh trước khi chọn máy.",
    image: "/products/expanded/huawei-pura80-ultra.png",
    imageAlt: "Huawei Pura 80 Ultra",
    sourceLabel: "Khám phá điện thoại Huawei",
    sourceUrl: "https://consumer.huawei.com/vn/phones/",
    sectionTitle: "Android đáng chú ý",
    sectionNote: "Các model nổi bật theo camera, hiệu năng và mức giá",
    offers: ["Nhiều thương hiệu", "Trả góp linh hoạt", "Giao hàng toàn quốc"],
    facts: ["Camera đa tiêu cự", "Sạc nhanh", "Nhiều lựa chọn RAM và bộ nhớ"],
    dark: true,
  },
  ipad: {
    brand: "Apple | iPad",
    headline: "iPad cho sáng tạo, học tập và công việc di động.",
    description: "Chọn đúng kích thước màn hình, dung lượng và màu sắc cho cách bạn sử dụng iPad.",
    image: "/products/apple/ipad-air/apple-hero.png",
    imageAlt: "iPad Air",
    sourceLabel: "Hình ảnh sản phẩm từ Apple",
    sourceUrl: "https://www.apple.com/vn/ipad/",
    sectionTitle: "iPad đang có",
    sectionNote: "iPad Pro, iPad Air và iPad tiêu chuẩn",
    offers: ["Apple Pencil", "Trả góp linh hoạt", "Giao nhanh nội thành"],
    facts: ["Màn hình Liquid Retina", "Chip Apple silicon", "Nhiều lựa chọn dung lượng"],
  },
  laptop: {
    brand: "Laptop hiệu năng cao",
    headline: "Sẵn sàng cho gaming, đồ họa và quy trình AI.",
    description: "Laptop hiệu năng cao với cấu hình RAM, SSD và card đồ họa theo từng nhu cầu chuyên biệt.",
    image: "/products/expanded/rog-scar18.jpg",
    imageAlt: "Laptop ASUS ROG hiệu năng cao",
    sourceLabel: "Xem toàn bộ laptop",
    sourceUrl: "/laptop",
    sectionTitle: "Laptop nổi bật",
    sectionNote: "Các cấu hình hiệu năng cao đang có trong danh mục",
    offers: ["Cấu hình rõ ràng", "Hỗ trợ nâng cấp", "Giao hàng toàn quốc"],
    facts: ["GPU rời hiệu năng cao", "RAM và SSD tùy cấu hình", "Màn hình tần số quét cao"],
    dark: true,
  },
};
