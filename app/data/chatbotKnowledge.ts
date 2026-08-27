export type ChatIntent =
  | "greeting"
  | "products"
  | "product_price"
  | "product_search"
  | "warranty"
  | "shipping"
  | "payment"
  | "store_information"
  | "contact"
  | "promotion"
  | "order_status"
  | "thanks"
  | "goodbye"
  | "unknown";

export type IntentKnowledge = {
  phrases: string[];
  keywords: string[];
  response: string;
};

export type ShippingKnowledge = {
  id: "methods" | "delivery_time" | "express" | "province" | "carrier" | "fee";
  phrases: string[];
  keywords: string[];
  response: string;
};

export const CHATBOT_OPENING = "Xin chào 👋 Tôi là trợ lý tư vấn. Tôi có thể giúp gì cho bạn?";

export const CHATBOT_UNKNOWN = "Xin lỗi, mình chưa hiểu chính xác câu hỏi của bạn 😅 Bạn có thể chọn một trong các mục bên dưới.";

export const CHATBOT_QUICK_REPLIES = [
  "Sản phẩm",
  "Giá sản phẩm",
  "Chính sách bảo hành",
  "Giao hàng",
  "Thanh toán",
  "Liên hệ tư vấn",
] as const;

// Chỉnh các câu trả lời và cụm từ nhận diện chatbot tại đây.
export const CHATBOT_KNOWLEDGE: Record<ChatIntent, IntentKnowledge> = {
  greeting: {
    phrases: ["xin chào", "chào shop", "hello", "hi", "alo", "có ai không"],
    keywords: ["chào", "hello", "alo"],
    response: CHATBOT_OPENING,
  },
  products: {
    phrases: ["sản phẩm", "shop bán gì", "có những sản phẩm nào", "danh mục sản phẩm", "có mac mini không", "có mac studio không", "có imac không"],
    keywords: ["sản phẩm", "danh mục", "bán gì", "mặt hàng", "mac mini", "mac studio", "imac"],
    response: "Infinity Company hiện có iPhone, iPad, MacBook, Mac mini, Mac Studio, iMac, Samsung, Android khác và Laptop Windows. Bạn hãy nhập tên model để mình tìm đúng sản phẩm, giá và cấu hình đang có.",
  },
  product_price: {
    phrases: ["giá sản phẩm", "giá bao nhiêu", "bao nhiêu tiền", "xin giá", "báo giá"],
    keywords: ["giá", "bao nhiêu", "bao tiền", "báo giá"],
    response: "Bạn muốn xem giá model nào? Hãy nhập tên sản phẩm, ví dụ: iPhone 15 Pro Max hoặc Redmi Note 15.",
  },
  product_search: {
    phrases: ["tìm sản phẩm", "tìm máy", "có máy này không", "kiểm tra sản phẩm"],
    keywords: ["tìm", "model", "máy", "cấu hình"],
    response: "Bạn hãy nhập tên model cần tìm. Mình sẽ kiểm tra giá và thông tin đang có trong catalog.",
  },
  warranty: {
    phrases: ["bảo hành bao lâu", "bảo hành thế nào", "chính sách bảo hành", "máy lỗi có bảo hành không", "bh thế nào"],
    keywords: ["bảo hành", "bh", "máy lỗi", "đổi trả", "sửa chữa"],
    response: "Thời hạn và điều kiện bảo hành phụ thuộc từng sản phẩm, tình trạng máy và chính sách nhà cung cấp. Cửa hàng sẽ xác nhận rõ trên đơn hoặc phiếu bảo hành trước khi giao máy.",
  },
  shipping: {
    phrases: [
      "ship không", "có giao hàng không", "ship tỉnh được không", "gửi về tỉnh không", "giao hàng thế nào",
      "bao ngày có", "mấy ngày nhận được", "bao lâu nhận hàng", "ship hình thức nào", "có giao hỏa tốc không",
      "giao qua viettel post", "giao qua j&t express", "giao qua spx",
    ],
    keywords: [
      "ship", "giao hàng", "gửi tỉnh", "vận chuyển", "nhận hàng", "hỏa tốc", "bao ngày",
      "viettel post", "viettelpost", "j&t express", "jtexpress", "jtexpres", "spx",
    ],
    response: "Infinity Company hỗ trợ nhận tại cửa hàng, giao hỏa tốc nội thành TP.HCM và giao tiêu chuẩn qua Viettel Post, J&T Express hoặc SPX. Thời gian và phí được xác nhận theo địa chỉ trước khi gửi.",
  },
  payment: {
    phrases: ["thanh toán", "thanh toán thế nào", "có trả góp không", "chuyển khoản", "trả tiền khi nhận"],
    keywords: ["thanh toán", "chuyển khoản", "cod", "momo", "apple pay", "trả góp", "qr"],
    response: "Bạn có thể chọn thanh toán khi nhận máy, chuyển khoản Techcombank 24/7 bằng QR, MoMo, Apple Pay hoặc đăng ký trả góp tài chính. Trả góp áp dụng cho đơn từ 8.000.000đ và cần được đơn vị tài chính xét duyệt.",
  },
  store_information: {
    phrases: ["địa chỉ cửa hàng", "shop ở đâu", "mấy giờ mở cửa", "thông tin cửa hàng"],
    keywords: ["địa chỉ", "cửa hàng", "shop ở đâu", "mở cửa", "đường đi"],
    response: "Cửa hàng Infinity Company tại 122/4 Cô Giang, P. Cầu Kiệu, TP.HCM. Bạn nên liên hệ trước để cửa hàng xác nhận giờ phục vụ và tồn kho.",
  },
  contact: {
    phrases: ["liên hệ tư vấn", "số điện thoại", "gọi shop", "zalo shop", "cần tư vấn"],
    keywords: ["liên hệ", "tư vấn", "điện thoại", "hotline", "zalo", "gọi"],
    response: "Bạn có thể gọi hoặc nhắn Zalo cửa hàng qua số 02879797999. Nhân viên sẽ kiểm tra giá, màu và tồn kho trước khi xác nhận đơn.",
  },
  promotion: {
    phrases: ["khuyến mãi", "có giảm giá không", "mã giảm giá", "voucher", "ưu đãi"],
    keywords: ["khuyến mãi", "giảm giá", "voucher", "ưu đãi", "mã giảm"],
    response: "Ưu đãi và voucher có thể thay đổi theo thời điểm. Nếu có mã voucher, bạn nhập tại bước thanh toán để hệ thống kiểm tra điều kiện áp dụng.",
  },
  order_status: {
    phrases: ["kiểm tra đơn hàng", "đơn hàng của tôi", "đơn tới đâu", "tra cứu đơn", "trạng thái đơn"],
    keywords: ["đơn hàng", "mã đơn", "trạng thái", "tra cứu", "đơn tới đâu"],
    response: "Bạn hãy gửi mã đơn có dạng HA và 10 ký tự phía sau để mình kiểm tra trạng thái trên hệ thống nội bộ.",
  },
  thanks: {
    phrases: ["cảm ơn", "thank you", "thanks", "cám ơn shop"],
    keywords: ["cảm ơn", "cám ơn", "thanks"],
    response: "Rất vui được hỗ trợ bạn. Khi cần xem thêm sản phẩm hoặc giá, bạn cứ nhắn tên model nhé.",
  },
  goodbye: {
    phrases: ["tạm biệt", "bye", "hẹn gặp lại", "kết thúc"],
    keywords: ["tạm biệt", "bye", "hẹn gặp"],
    response: "Chào bạn. Infinity Company luôn sẵn sàng hỗ trợ khi bạn cần tìm máy hoặc kiểm tra đơn hàng.",
  },
  unknown: {
    phrases: [],
    keywords: [],
    response: CHATBOT_UNKNOWN,
  },
};

// Các câu trả lời giao hàng chi tiết. Có thể sửa thời gian, đơn vị và chính sách tại đây.
export const CHATBOT_SHIPPING_KNOWLEDGE: ShippingKnowledge[] = [
  {
    id: "express",
    phrases: ["giao hỏa tốc", "ship hỏa tốc", "hỏa tốc không", "giao nhanh trong ngày", "nhận trong ngày"],
    keywords: ["hỏa tốc", "hoả tốc", "giao nhanh", "trong ngày"],
    response: "Có. Infinity Company hỗ trợ giao hỏa tốc trong ngày tại khu vực nội thành TP.HCM sau khi xác nhận đơn và tồn kho. Thời gian cụ thể phụ thuộc địa chỉ, thời điểm đặt hàng và tình trạng tài xế; nhân viên sẽ báo thời gian cùng phí trước khi giao.",
  },
  {
    id: "delivery_time",
    phrases: ["bao ngày có", "bao nhiêu ngày có", "mấy ngày nhận được", "bao lâu nhận hàng", "khi nào nhận được", "ship mất bao lâu", "giao hàng bao lâu"],
    keywords: ["bao ngày", "mấy ngày", "bao lâu", "khi nào nhận", "thời gian giao"],
    response: "Thời gian dự kiến: hỏa tốc nội thành TP.HCM trong ngày; giao tiêu chuẩn tại TP.HCM khoảng 1-2 ngày; giao tỉnh khoảng 2-5 ngày làm việc; khu vực xa có thể 3-7 ngày. Cửa hàng sẽ chốt thời gian chính xác theo địa chỉ và đơn vị vận chuyển trước khi gửi.",
  },
  {
    id: "carrier",
    phrases: [
      "giao qua viettel post", "ship viettel post", "viettelpost", "giao qua j&t express", "ship j&t",
      "jtexpress", "jtexpres", "giao qua spx", "ship spx", "đơn vị vận chuyển nào",
    ],
    keywords: ["viettel post", "viettelpost", "j&t", "j t express", "jtexpress", "jtexpres", "spx", "đơn vị vận chuyển"],
    response: "Cửa hàng có thể gửi hàng qua Viettel Post, J&T Express hoặc SPX. Bạn có thể báo đơn vị muốn sử dụng khi đặt hàng; cửa hàng sẽ kiểm tra tuyến giao, phí và thời gian rồi xác nhận trước khi bàn giao kiện hàng.",
  },
  {
    id: "province",
    phrases: ["ship tỉnh được không", "gửi về tỉnh", "giao hàng tỉnh", "ship toàn quốc", "gửi đi tỉnh"],
    keywords: ["giao tỉnh", "gửi tỉnh", "về tỉnh", "toàn quốc", "ngoại tỉnh"],
    response: "Có, Infinity Company hỗ trợ giao tỉnh qua Viettel Post, J&T Express hoặc SPX. Thời gian thường khoảng 2-5 ngày làm việc, khu vực xa có thể 3-7 ngày. Phí và thời gian cụ thể được xác nhận theo địa chỉ nhận hàng trước khi gửi.",
  },
  {
    id: "fee",
    phrases: ["phí ship bao nhiêu", "ship có mất phí không", "giao hàng miễn phí không", "tiền vận chuyển"],
    keywords: ["phí ship", "phí giao", "miễn phí", "tiền ship", "cước vận chuyển"],
    response: "Phí giao hàng phụ thuộc địa chỉ, hình thức hỏa tốc hay tiêu chuẩn và đơn vị Viettel Post, J&T Express hoặc SPX. Cửa hàng sẽ báo rõ phí trước khi xác nhận gửi hàng, không tự phát sinh thêm sau khi chốt đơn.",
  },
  {
    id: "methods",
    phrases: ["ship hình thức nào", "có những cách giao nào", "giao hàng thế nào", "hình thức vận chuyển", "nhận hàng bằng cách nào"],
    keywords: ["hình thức giao", "cách giao", "phương thức giao", "nhận tại cửa hàng"],
    response: "Bạn có 3 lựa chọn: nhận trực tiếp tại cửa hàng; giao hỏa tốc nội thành TP.HCM; hoặc giao tiêu chuẩn qua Viettel Post, J&T Express, SPX. Hình thức phù hợp sẽ được xác nhận theo địa chỉ và nhu cầu nhận hàng của bạn.",
  },
];

export const CHATBOT_SYNONYMS: Record<string, string> = {
  "bh": "bảo hành",
  "ship": "giao hàng",
  "ship nhanh": "giao hỏa tốc",
  "hoả tốc": "hỏa tốc",
  "gửi về tỉnh": "giao hàng tỉnh",
  "gửi tỉnh": "giao hàng tỉnh",
  "viettelpost": "viettel post",
  "jtexpress": "j t express",
  "jtexpres": "j t express",
  "j&t express": "j t express",
  "sp": "sản phẩm",
  "máy": "sản phẩm",
  "giá bn": "giá bao nhiêu",
  "bao tiền": "giá bao nhiêu",
  "km": "khuyến mãi",
  "sdt": "số điện thoại",
  "đơn tới đâu": "trạng thái đơn hàng",
  "ck": "chuyển khoản",
};
