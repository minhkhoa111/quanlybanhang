"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ManagedProduct } from "@/db/products";
import type { ProductVariant } from "@/app/products";
import { saveAdminProductAction } from "./actions";
import {
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_IMAGE_LABEL,
  RECOMMENDED_PRODUCT_IMAGE_EDGE,
} from "@/app/product-image-policy";
import {
  CATEGORY_OPTIONS,
  CURRENT_MACBOOK_CHIPS,
  PRODUCT_FIELD_CONFIG,
  editableCategory,
  technicalValuesFromSpecs,
  type EditableCategory,
} from "./product-fields";

type MacbookColor = { name: string; hex: string; note: string };

const MACBOOK_COLORS: MacbookColor[] = [
  { name: "Bạc (Silver)", hex: "#E3E4E5", note: "MacBook Air & Pro" },
  { name: "Xám không gian (Space Gray)", hex: "#7D7E80", note: "Các đời MacBook trước" },
  { name: "Đen không gian (Space Black)", hex: "#2E2C2E", note: "MacBook Pro" },
  { name: "Đêm xanh (Midnight)", hex: "#2E3642", note: "MacBook Air" },
  { name: "Ánh sao (Starlight)", hex: "#F0E4D3", note: "MacBook Air" },
  { name: "Xanh da trời (Sky Blue)", hex: "#A7C1D9", note: "MacBook Air" },
  { name: "Vàng (Gold)", hex: "#D4B99A", note: "Các đời MacBook Air trước" },
  { name: "Vàng hồng (Rose Gold)", hex: "#E5B8A8", note: "Các đời MacBook trước" },
];

export default function AdminProductForm({ product }: { product?: ManagedProduct }) {
  const initialImages = product?.images?.length ? product.images : product?.image ? [product.image] : [];
  const [images, setImages] = useState(initialImages);
  const [primaryImage, setPrimaryImage] = useState(product?.image ?? initialImages[0] ?? "");
  const [previews, setPreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants ?? []);
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "Apple");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [category, setCategory] = useState<EditableCategory>(editableCategory(product?.category));
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice ?? product?.price ?? "");
  const [salePrice, setSalePrice] = useState(product?.salePrice ?? "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [status, setStatus] = useState(product?.status ?? (product?.active === false ? "inactive" : "active"));
  const [previewMode, setPreviewMode] = useState<"card" | "detail">("card");
  const [specsText, setSpecsText] = useState(product?.specs?.join("\n") ?? "");
  const [technicalValues, setTechnicalValues] = useState<Record<string, string>>(() => technicalValuesFromSpecs(product?.specs));
  const [imageWarnings, setImageWarnings] = useState<string[]>([]);
  const [matrixRam, setMatrixRam] = useState("8GB, 16GB");
  const [matrixStorage, setMatrixStorage] = useState("256GB, 512GB");
  const [matrixColorNames, setMatrixColorNames] = useState("");
  const [matrixVersion, setMatrixVersion] = useState("");
  const [matrixSize, setMatrixSize] = useState("");
  const [matrixMessage, setMatrixMessage] = useState("");
  const [selectedMacbookColors, setSelectedMacbookColors] = useState<string[]>(() => initialMacbookColors(product));
  const [modelChip, setModelChip] = useState(() => productSpecValue(product, ["Chip / CPU", "Chip xử lý"]) || product?.variants?.[0]?.version || "");
  const [screenSize, setScreenSize] = useState(() => productSpecValue(product, ["Kích thước màn hình"]) || product?.variants?.[0]?.size || "");
  const [modelYear, setModelYear] = useState(() => productSpecValue(product, ["Năm ra mắt", "Năm"]) || "");
  const [bulkCostPrice, setBulkCostPrice] = useState("");
  const [bulkSellingPrice, setBulkSellingPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");

  const previewImage = primaryImage || previews[0] || images[0] || "/products/iphone-16.png";
  const tags = useMemo(() => product?.tags?.join(", ") ?? "", [product]);
  const fieldConfig = PRODUCT_FIELD_CONFIG[category];
  const supportsConfigurationMatrix = ["macbook", "mac-mini-studio", "imac", "laptop"].includes(category);
  const matrixRams = useMemo(() => parseConfigurationValues(matrixRam, "ram"), [matrixRam]);
  const matrixStorages = useMemo(() => parseConfigurationValues(matrixStorage, "storage"), [matrixStorage]);
  const matrixColors = category === "macbook"
    ? MACBOOK_COLORS.filter((color) => selectedMacbookColors.includes(color.name))
    : parseCustomColors(matrixColorNames);
  const matrixCount = matrixRams.length * matrixStorages.length * Math.max(1, matrixColors.length);
  const productColorCodes = matrixColors.length
    ? matrixColors.map((color) => color.hex).join(", ")
    : product?.colors?.join(", ") ?? "#111111";
  const hasProductImage = Boolean(primaryImage || previews.length || images.length);
  const readinessItems = [
    { label: "Tên sản phẩm", ready: Boolean(name.trim()) },
    { label: "Giá bán", ready: Boolean(sellingPrice.trim()) },
    { label: "Ảnh chính", ready: hasProductImage },
    { label: "Danh mục", ready: Boolean(category) },
  ];
  const readinessCount = readinessItems.filter((item) => item.ready).length;
  const categoryLabel = CATEGORY_OPTIONS.find(([value]) => value === category)?.[1] ?? category;
  const customerPrice = salePrice.trim() || sellingPrice.trim() || "Liên hệ giá tốt";
  const previewVariants = variants.filter((variant) => variant.status !== "inactive").slice(0, 4);

  function renderPreviewImage(sizes = "320px") {
    return previewImage.startsWith("blob:") ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={previewImage} alt={name || "Ảnh xem trước sản phẩm"} />
    ) : (
      <Image src={previewImage} alt={name || "Ảnh xem trước sản phẩm"} fill unoptimized sizes={sizes} />
    );
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    const accepted = Array.from(files).filter((file) => file.type.startsWith("image/") && file.size <= MAX_PRODUCT_IMAGE_BYTES);
    const rejected = Array.from(files).filter((file) => !file.type.startsWith("image/") || file.size > MAX_PRODUCT_IMAGE_BYTES);
    const next = accepted.map((file) => URL.createObjectURL(file));
    setPreviews(next);
    setImageWarnings(rejected.map((file) => `${file.name}: chỉ nhận ảnh tối đa ${MAX_PRODUCT_IMAGE_LABEL}.`));
    accepted.forEach((file) => validateImageDimensions(file));
    if (!primaryImage && next[0]) setPrimaryImage(next[0]);
  }

  function validateImageDimensions(file: File) {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      if (image.naturalWidth < RECOMMENDED_PRODUCT_IMAGE_EDGE || image.naturalHeight < RECOMMENDED_PRODUCT_IMAGE_EDGE) {
        setImageWarnings((items) => [...items, `${file.name}: ảnh ${image.naturalWidth}×${image.naturalHeight}px có thể bị mờ; nên dùng tối thiểu ${RECOMMENDED_PRODUCT_IMAGE_EDGE}×${RECOMMENDED_PRODUCT_IMAGE_EDGE}px.`]);
      }
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      setImageWarnings((items) => [...items, `${file.name}: trình duyệt không đọc được ảnh.`]);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }

  function addVariant() {
    setVariants((items) => [
      ...items,
      { id: crypto.randomUUID(), name: "", color: "", colorHex: "#111111", ram: "", storage: "", version: modelChip, size: screenSize, sku: "", barcode: "", costPrice: "", price: sellingPrice, salePrice: "", stock: 0, status: "active", serials: [], image: "" },
    ]);
  }

  function duplicateVariant(variant: ProductVariant) {
    setVariants((items) => [...items, { ...variant, id: crypto.randomUUID(), sku: "", barcode: "", serials: [], name: variant.name ? `${variant.name} · bản sao` : "" }]);
  }

  function applyBulkVariantValues() {
    setVariants((items) => items.map((variant) => ({
      ...variant,
      costPrice: bulkCostPrice.trim() || variant.costPrice,
      price: bulkSellingPrice.trim() || variant.price,
      stock: bulkStock.trim() ? Math.max(0, Number(bulkStock) || 0) : variant.stock,
    })));
  }

  function updateModelSpec(label: string, aliases: string[], nextValue: string) {
    setSpecsText((current) => {
      const lines = current.split("\n").map((line) => line.trim()).filter(Boolean);
      const normalizedAliases = aliases.map((alias) => `${alias}:`.toLocaleLowerCase("vi"));
      const index = lines.findIndex((line) => normalizedAliases.some((prefix) => line.toLocaleLowerCase("vi").startsWith(prefix)));
      const nextLine = nextValue.trim() ? `${label}: ${nextValue.trim()}` : "";
      if (index >= 0 && nextLine) lines[index] = nextLine;
      else if (index >= 0) lines.splice(index, 1);
      else if (nextLine) lines.push(nextLine);
      return lines.join("\n");
    });
  }

  function selectModelChip(chip: string) {
    setModelChip(chip);
    setMatrixVersion(chip);
    updateModelSpec("Chip / CPU", ["Chip / CPU", "Chip xử lý"], chip);
  }

  function toggleMatrixOption(kind: "ram" | "storage", option: string) {
    const current = kind === "ram" ? matrixRams : matrixStorages;
    const selected = current.includes(option);
    const next = selected ? current.filter((item) => item !== option) : [...current, option];
    if (kind === "ram") setMatrixRam(next.join(", "));
    else setMatrixStorage(next.join(", "));
    setMatrixMessage("");
  }

  function toggleMacbookColor(colorName: string) {
    setSelectedMacbookColors((current) => current.includes(colorName)
      ? current.filter((name) => name !== colorName)
      : [...current, colorName]);
    setMatrixMessage("");
  }

  function generateVariantMatrix() {
    if (!matrixRams.length || !matrixStorages.length) {
      setMatrixMessage("Nhập ít nhất một mức RAM và một mức SSD.");
      return;
    }
    const additions: ProductVariant[] = [];
    const colorsToCreate: Array<MacbookColor | undefined> = matrixColors.length ? matrixColors : [undefined];
    for (const ram of matrixRams) {
      for (const storage of matrixStorages) {
        for (const color of colorsToCreate) {
          const duplicate = [...variants, ...additions].some((item) =>
            normalizeConfiguration(item.ram) === normalizeConfiguration(ram) &&
            normalizeConfiguration(item.storage) === normalizeConfiguration(storage) &&
            normalizeConfiguration(item.version) === normalizeConfiguration(matrixVersion) &&
            normalizeConfiguration(item.size) === normalizeConfiguration(matrixSize) &&
            normalizeConfiguration(item.color) === normalizeConfiguration(color?.name),
          );
          if (duplicate) continue;
          additions.push({
            id: crypto.randomUUID(),
            // Keep generated names automatic so later edits cannot leave an outdated display name.
            name: "",
            color: color?.name ?? "",
            colorHex: color?.hex ?? "#111111",
            ram,
            storage,
            version: matrixVersion.trim() || modelChip.trim(),
            size: matrixSize.trim() || screenSize.trim(),
            sku: "",
            barcode: "",
            costPrice: bulkCostPrice.trim(),
            price: sellingPrice,
            salePrice: "",
            stock: 0,
            status: "active",
            serials: [],
            image: "",
          });
        }
      }
    }
    setVariants((items) => [...items, ...additions]);
    setMatrixMessage(additions.length
      ? `Đã tạo ${additions.length} cấu hình. Bạn chỉ cần điền giá hoặc tồn kho khác nếu cần.`
      : "Các tổ hợp này đã có sẵn, hệ thống không tạo trùng.");
  }

  function setVariantMacbookColor(id: string, colorName: string) {
    const color = MACBOOK_COLORS.find((item) => item.name === colorName);
    setVariants((items) => items.map((item) => item.id === id
      ? { ...item, color: colorName, colorHex: color?.hex ?? item.colorHex ?? "#111111" }
      : item));
  }

  function updateVariant(id: string, key: keyof ProductVariant, value: ProductVariant[keyof ProductVariant]) {
    setVariants((items) =>
      items.map((item) => (item.id === id ? { ...item, [key]: key === "stock" ? Number(value) || 0 : value } : item)),
    );
  }

  function removeVariant(id: string) {
    setVariants((items) => items.filter((item) => item.id !== id));
  }

  function removeExistingImage(image: string) {
    setImages((items) => items.filter((item) => item !== image));
    if (primaryImage === image) setPrimaryImage(images.find((item) => item !== image) ?? previews[0] ?? "");
  }

  function updateTechnicalField(key: string, label: string, nextValue: string) {
    setTechnicalValues((items) => ({ ...items, [key]: nextValue }));
    setSpecsText((current) => {
      const lines = current.split("\n").map((line) => line.trim()).filter(Boolean);
      const index = lines.findIndex((line) => line.toLocaleLowerCase("vi").startsWith(`${label}:`.toLocaleLowerCase("vi")));
      const nextLine = nextValue.trim() ? `${label}: ${nextValue.trim()}` : "";
      if (index >= 0 && nextLine) lines[index] = nextLine;
      else if (index >= 0) lines.splice(index, 1);
      else if (nextLine) lines.push(nextLine);
      return lines.join("\n");
    });
  }

  return (
    <form action={saveAdminProductAction} className="admin-editor-grid">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="slug" value={product?.slug ?? ""} />
      <input type="hidden" name="existingImages" value={images.join("\n")} />
      <input type="hidden" name="primaryImage" value={primaryImage && !primaryImage.startsWith("blob:") ? primaryImage : ""} />
      <input type="hidden" name="primaryUploadIndex" value={primaryImage.startsWith("blob:") ? previews.indexOf(primaryImage) : -1} />
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />

      <header className="admin-product-editor-hero">
        <div><span>PRODUCT WORKSPACE</span><h2>{product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2><p>Nhập phần quan trọng trước, mở thông tin nâng cao khi cần.</p></div>
        <ol aria-label="Các bước nhập sản phẩm">
          <li className="is-current"><b>01</b><span>Sản phẩm</span></li>
          <li><b>02</b><span>Hình ảnh</span></li>
          <li><b>03</b><span>Cấu hình</span></li>
          <li><b>04</b><span>Xuất bản</span></li>
        </ol>
      </header>

      <section className="admin-editor-main">
        <div className="admin-card admin-product-step-card">
          <div className="admin-card-head">
            <div className="admin-product-step-title"><b>01</b><div><span>Thông tin chính</span><h2>Sản phẩm &amp; bán hàng</h2><p>Các trường cần thiết để sản phẩm xuất hiện đúng ngoài cửa hàng.</p></div></div>
            <label className="admin-product-status"><span>Trạng thái</span><select name="status" value={status} onChange={(event) => setStatus(event.target.value as "draft" | "active" | "inactive")}><option value="active">Đang bán</option><option value="draft">Bản nháp</option><option value="inactive">Tạm ẩn</option></select></label>
          </div>
          <div className="admin-form-grid admin-product-essential-grid">
            <label className="admin-field admin-span-2">Tên model <em>Bắt buộc</em><input name="name" value={name} onChange={(event) => setName(event.target.value)} required placeholder={'Ví dụ: MacBook Air M3 13"'} /></label>
            <label className="admin-field">Loại sản phẩm <em>Bắt buộc</em><select name="category" value={category} onChange={(event) => setCategory(event.target.value as EditableCategory)}>{CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="admin-field">Thương hiệu <em>Bắt buộc</em><input name="brand" value={brand} onChange={(event) => setBrand(event.target.value)} required placeholder="Apple" /></label>
            <label className="admin-field">Chip / CPU<input list={`model-chip-options-${category}`} value={modelChip} onChange={(event) => { setModelChip(event.target.value); setMatrixVersion(event.target.value); updateModelSpec("Chip / CPU", ["Chip / CPU", "Chip xử lý"], event.target.value); }} placeholder="Apple M5 / Intel Core Ultra 7" /></label>
            <label className="admin-field">Kích thước màn hình<input value={screenSize} onChange={(event) => { setScreenSize(event.target.value); updateModelSpec("Kích thước màn hình", ["Kích thước màn hình"], event.target.value); }} placeholder="13.6 inch" /></label>
            <label className="admin-field">Năm ra mắt<input inputMode="numeric" value={modelYear} onChange={(event) => { setModelYear(event.target.value); updateModelSpec("Năm ra mắt", ["Năm ra mắt", "Năm"], event.target.value); }} placeholder="2024" /></label>
            <label className="admin-field">Giá bán <em>Bắt buộc</em><input name="sellingPrice" value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} placeholder="31.290.000đ" /></label>
            <label className="admin-field">Tồn kho chung<input name="stock" type="number" min="0" value={stock} onChange={(event) => setStock(event.target.value)} /></label>
            <label className="admin-field admin-span-2">Mô tả ngắn<input name="tagline" value={tagline} onChange={(event) => setTagline(event.target.value)} placeholder="Một câu ngắn giúp khách hiểu ngay điểm nổi bật" /></label>
          </div>
          <datalist id={`model-chip-options-${category}`}>{fieldConfig.versionOptions.map((option) => <option key={option} value={option} />)}</datalist>
          {category === "macbook" && <section className="admin-macbook-chip-picker" aria-label="Chip Apple hiện tại cho MacBook">
            <header><div><span>CHIP APPLE HIỆN TẠI</span><strong>Chọn nhanh chip cho model MacBook</strong></div><small>Vẫn có thể nhập M1–M4 hoặc chip khác ở ô phía trên.</small></header>
            <div>{CURRENT_MACBOOK_CHIPS.map((chip) => <button className={modelChip === chip.value ? "is-selected" : ""} type="button" aria-pressed={modelChip === chip.value} onClick={() => selectModelChip(chip.value)} key={chip.value}><i>{chip.value.replace("Apple ", "")}</i><span><strong>{chip.value}</strong><small>{chip.family} · {chip.note}</small></span><b>{modelChip === chip.value ? "✓" : "+"}</b></button>)}</div>
          </section>}
          <details className="admin-product-optional">
            <summary><span>Thông tin nâng cao</span><small>SKU, giá nhập, khuyến mãi, nhãn và mô tả chi tiết</small></summary>
            <div className="admin-form-grid">
              <label className="admin-field">SKU<input name="sku" defaultValue={product?.sku} placeholder="MBA-M4-13" /></label>
              <label className="admin-field">Nhãn nổi bật<input name="badge" value={badge} onChange={(event) => setBadge(event.target.value)} placeholder="Mới / Giá tốt" /></label>
              <label className="admin-field">Giá nhập<input name="costPrice" defaultValue={product?.costPrice} placeholder="25.000.000đ" /></label>
              <label className="admin-field">Giá khuyến mãi<input name="salePrice" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} placeholder="29.990.000đ" /></label>
              <label className="admin-field admin-span-2">Mô tả chi tiết<textarea name="description" rows={4} defaultValue={product?.description ?? product?.tagline} placeholder="Thông tin chi tiết giúp khách hiểu rõ sản phẩm." /></label>
            </div>
          </details>
        </div>

        <div className="admin-card admin-product-step-card">
          <div className="admin-card-head"><div className="admin-product-step-title"><b>02</b><div><span>Hình ảnh</span><h2>Thư viện hình ảnh</h2><p>Ảnh đầu tiên được chọn làm ảnh đại diện ngoài cửa hàng.</p></div></div><em className="admin-product-count">{images.length + previews.length} ảnh</em></div>
          <label className="admin-dropzone">
            <input name="imageFiles" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple onChange={(event) => onFiles(event.target.files)} />
            <strong>Kéo thả hoặc chọn nhiều ảnh</strong>
            <small>PNG, JPG, WEBP, GIF, AVIF · tối đa {MAX_PRODUCT_IMAGE_LABEL}/ảnh · giữ nguyên chất lượng gốc.</small>
            <small>Để ảnh nét trên màn hình lớn, nên dùng từ {RECOMMENDED_PRODUCT_IMAGE_EDGE}×{RECOMMENDED_PRODUCT_IMAGE_EDGE}px.</small>
          </label>
          {imageWarnings.length > 0 && <div className="admin-image-warnings" role="status">{imageWarnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
          <div className="admin-image-grid">
            {[...images, ...previews].map((image, index) => (
              <div key={`${image}-${index}`} className={`admin-image-item${primaryImage === image ? " is-primary" : ""}`}>
                <button type="button" className="admin-image-select" onClick={() => setPrimaryImage(image)} aria-label="Chọn làm ảnh chính">
                  {image.startsWith("blob:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="Ảnh sản phẩm mới" />
                  ) : (
                    <Image src={image} alt="Ảnh sản phẩm" width={160} height={120} unoptimized />
                  )}
                  <span>{primaryImage === image ? "Ảnh chính" : "Chọn chính"}</span>
                </button>
                {!image.startsWith("blob:") && <button type="button" className="admin-image-remove" onClick={() => removeExistingImage(image)} aria-label="Xóa ảnh" title="Xóa ảnh">×</button>}
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card admin-product-step-card">
          <div className="admin-card-head">
            <div className="admin-product-step-title"><b>03</b><div><span>Cấu hình theo danh mục</span><h2>{fieldConfig.title}</h2><p>{fieldConfig.description}</p></div></div>
            <button type="button" className="admin-button" onClick={addVariant}>Thêm thủ công</button>
          </div>
          {supportsConfigurationMatrix && (
            <section className="admin-config-builder" aria-labelledby="config-builder-title">
              <div className="admin-config-builder-head">
                <div>
                  <span>PLUG &amp; PLAY</span>
                  <h3 id="config-builder-title">Tạo nhanh RAM × SSD × Màu</h3>
                  <p>Chọn nhiều RAM, SSD và màu; hệ thống tự tạo từng phiên bản để quản lý giá và tồn kho riêng.</p>
                </div>
                <strong>{matrixCount} tổ hợp</strong>
              </div>
              <div className="admin-config-builder-grid">
                <div className="admin-config-choice">
                  <label>RAM muốn bán<input value={matrixRam} onChange={(event) => { setMatrixRam(event.target.value); setMatrixMessage(""); }} placeholder="8GB, 16GB" /></label>
                  <div aria-label="RAM gợi ý">
                    {fieldConfig.ramOptions.map((option) => <button type="button" className={matrixRams.includes(option) ? "is-selected" : ""} onClick={() => toggleMatrixOption("ram", option)} key={option}>{option}</button>)}
                  </div>
                </div>
                <div className="admin-config-choice">
                  <label>{fieldConfig.storageLabel} muốn bán<input value={matrixStorage} onChange={(event) => { setMatrixStorage(event.target.value); setMatrixMessage(""); }} placeholder="256GB, 512GB" /></label>
                  <div aria-label={`${fieldConfig.storageLabel} gợi ý`}>
                    {fieldConfig.storageOptions.map((option) => <button type="button" className={matrixStorages.includes(option) ? "is-selected" : ""} onClick={() => toggleMatrixOption("storage", option)} key={option}>{option}</button>)}
                  </div>
                </div>
                <label className="admin-config-meta"><span>{fieldConfig.versionLabel} dùng chung</span><input list={`version-options-${category}`} value={matrixVersion} onChange={(event) => setMatrixVersion(event.target.value)} placeholder={`${fieldConfig.versionPlaceholder} (không bắt buộc)`} /></label>
                <label className="admin-config-meta"><span>{fieldConfig.sizeLabel} dùng chung</span><input list={`size-options-${category}`} value={matrixSize} onChange={(event) => setMatrixSize(event.target.value)} placeholder={`${fieldConfig.sizePlaceholder} (không bắt buộc)`} /></label>
              </div>
              {category === "macbook" && (
                <div className="admin-macbook-colors">
                  <div className="admin-macbook-colors-head">
                    <div><strong>Màu MacBook</strong><span>Chọn cùng lúc nhiều màu đang có hàng</span></div>
                    <em>{matrixColors.length ? `${matrixColors.length} màu đã chọn` : "Chưa phân màu"}</em>
                  </div>
                  <div className="admin-macbook-color-grid" aria-label="Bảng màu MacBook">
                    {MACBOOK_COLORS.map((color) => {
                      const selected = selectedMacbookColors.includes(color.name);
                      return (
                        <button key={color.name} type="button" aria-pressed={selected} className={selected ? "is-selected" : ""} onClick={() => toggleMacbookColor(color.name)}>
                          <i style={{ backgroundColor: color.hex }} />
                          <span><strong>{color.name}</strong><small>{color.hex} · {color.note}</small></span>
                          <b aria-hidden="true">{selected ? "✓" : "+"}</b>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {category !== "macbook" && <div className="admin-config-choice admin-config-custom-colors"><label>Màu muốn bán<input value={matrixColorNames} onChange={(event) => { setMatrixColorNames(event.target.value); setMatrixMessage(""); }} placeholder="Đen, Bạc, Xám" /></label><small>Có thể nhập nhiều màu, cách nhau bằng dấu phẩy.</small></div>}
              <div className="admin-config-preview">
                <span>Sẽ tạo</span>
                <div>{matrixRams.flatMap((ram) => matrixStorages.flatMap((storage) => (matrixColors.length ? matrixColors : [undefined]).map((color) => <em key={`${ram}-${storage}-${color?.name ?? "none"}`}>{ram} / {storage}{color ? ` / ${color.name}` : ""}</em>)))}</div>
              </div>
              <div className="admin-config-builder-action">
                <button className="admin-button admin-button-primary" type="button" onClick={generateVariantMatrix} disabled={!matrixCount}>Tạo {matrixCount || ""} cấu hình</button>
                {matrixMessage && <p role="status">{matrixMessage}</p>}
              </div>
            </section>
          )}
          <details className="admin-product-optional admin-product-specs">
            <summary><span>Thông số và tìm kiếm</span><small>Thông tin kỹ thuật, mã màu, nhãn tìm kiếm và thông số bổ sung</small></summary>
            <div className="admin-technical-grid">
              {fieldConfig.technicalFields.map((field) => (
                <label className="admin-field" key={`${category}-${field.key}`}>{field.label}
                  <input value={technicalValues[field.key] ?? ""} onChange={(event) => updateTechnicalField(field.key, field.label, event.target.value)} placeholder={field.placeholder} />
                </label>
              ))}
            </div>
            <div className="admin-form-grid">
              {category === "macbook" ? (
                <label className="admin-field">Mã màu đã chọn<input name="colors" value={productColorCodes} readOnly aria-describedby="macbook-color-help" /><small id="macbook-color-help">Mã màu tự đồng bộ từ bảng chọn phía trên.</small></label>
              ) : (
                <label className="admin-field">Màu sản phẩm<input name="colors" defaultValue={product?.colors?.join(", ") ?? "#111111"} placeholder="#111111, #f5f5f7" /></label>
              )}
              <label className="admin-field">Nhãn tìm kiếm<input name="tags" defaultValue={tags} placeholder="iphone, flagship, 256gb" /></label>
              <label className="admin-field admin-span-2">Thông số bổ sung<textarea name="specs" rows={5} value={specsText} onChange={(event) => setSpecsText(event.target.value)} placeholder={"Mỗi dòng một thông số\nChống nước IP68\nKhối lượng 199g"} /></label>
            </div>
          </details>
          <datalist id={`storage-options-${category}`}>{fieldConfig.storageOptions.map((option) => <option key={option} value={option} />)}</datalist>
          <datalist id={`ram-options-${category}`}>{fieldConfig.ramOptions.map((option) => <option key={option} value={option} />)}</datalist>
          <datalist id={`version-options-${category}`}>{fieldConfig.versionOptions.map((option) => <option key={option} value={option} />)}</datalist>
          <datalist id={`size-options-${category}`}>{fieldConfig.sizeOptions.map((option) => <option key={option} value={option} />)}</datalist>
          <div className="admin-variant-section-head"><div><span>Danh sách cấu hình</span><strong>{variants.length} biến thể · {variants.filter((variant) => variant.status !== "inactive").length} đang bán</strong></div><p>Sửa trực tiếp từng dòng, tắt cấu hình tạm hết hoặc xóa tổ hợp không được bán.</p></div>
          {variants.length > 0 && <div className="admin-variant-bulkbar">
            <div><span>ÁP DỤNG NHANH</span><strong>Giá và tồn kho hàng loạt</strong></div>
            <label>Giá nhập<input value={bulkCostPrice} onChange={(event) => setBulkCostPrice(event.target.value)} placeholder="20.000.000đ" /></label>
            <label>Giá bán<input value={bulkSellingPrice} onChange={(event) => setBulkSellingPrice(event.target.value)} placeholder="24.990.000đ" /></label>
            <label>Tồn mỗi cấu hình<input type="number" min="0" value={bulkStock} onChange={(event) => setBulkStock(event.target.value)} placeholder="0" /></label>
            <button type="button" onClick={applyBulkVariantValues}>Áp dụng tất cả</button>
          </div>}
          <div className={`admin-variant-list admin-variant-list-compact${category === "macbook" ? " has-color-column" : ""}`}>
            {variants.length === 0 && <p className="admin-empty-state">Chưa có cấu hình. Dùng khung “Tạo nhanh RAM × SSD” phía trên để bắt đầu.</p>}
            {variants.map((variant, index) => (
              <div className={`admin-variant${variant.status === "inactive" ? " is-inactive" : ""}`} key={variant.id}>
                <div className="admin-variant-head"><div><span>{String(index + 1).padStart(2, "0")}</span><strong>{variant.name || [variant.ram, variant.storage, variant.color].filter(Boolean).join(" / ") || `Cấu hình ${index + 1}`}</strong><em>{variant.status === "inactive" ? "Đang tắt" : "Đang bán"}</em></div><nav><button type="button" onClick={() => duplicateVariant(variant)}>Nhân bản</button><button type="button" onClick={() => updateVariant(variant.id, "status", variant.status === "inactive" ? "active" : "inactive")}>{variant.status === "inactive" ? "Bật" : "Tắt"}</button><button className="is-danger" type="button" onClick={() => removeVariant(variant.id)}>Xóa</button></nav></div>
                <label><span>{fieldConfig.storageLabel}</span><input list={`storage-options-${category}`} value={variant.storage ?? ""} onChange={(event) => updateVariant(variant.id, "storage", event.target.value)} placeholder={fieldConfig.storagePlaceholder} /></label>
                <label><span>{fieldConfig.ramLabel}</span><input list={`ram-options-${category}`} inputMode="numeric" value={variant.ram ?? ""} onChange={(event) => updateVariant(variant.id, "ram", event.target.value)} placeholder={fieldConfig.ramPlaceholder} /></label>
                {category === "macbook" && <label className="admin-variant-color"><span>Màu</span><div><i style={{ backgroundColor: variant.colorHex || "#111111" }} /><select value={variant.color ?? ""} onChange={(event) => setVariantMacbookColor(variant.id, event.target.value)}><option value="">Chưa phân màu</option>{variant.color && !MACBOOK_COLORS.some((color) => color.name === variant.color) && <option value={variant.color}>{variant.color}</option>}{MACBOOK_COLORS.map((color) => <option value={color.name} key={color.name}>{color.name}</option>)}</select></div></label>}
                {category !== "macbook" && <label><span>Màu</span><input value={variant.color ?? ""} onChange={(event) => updateVariant(variant.id, "color", event.target.value)} placeholder="Đen / Bạc" /></label>}
                <label><span>Giá nhập</span><input value={variant.costPrice ?? ""} onChange={(event) => updateVariant(variant.id, "costPrice", event.target.value)} placeholder="20.000.000đ" /></label>
                <label><span>Giá bán</span><input value={variant.price ?? ""} onChange={(event) => updateVariant(variant.id, "price", event.target.value)} placeholder="24.990.000đ" /></label>
                <label><span>Giá khuyến mãi</span><input value={variant.salePrice ?? ""} onChange={(event) => updateVariant(variant.id, "salePrice", event.target.value)} placeholder="Không bắt buộc" /></label>
                <label><span>Tồn kho</span><input type="number" min="0" value={String(variant.stock ?? 0)} onChange={(event) => updateVariant(variant.id, "stock", event.target.value)} /></label>
                <details className="admin-variant-advanced">
                  <summary>Thông tin thêm <span>SKU, barcode, serial và ảnh riêng</span></summary>
                  <div>
                    <label><span>Tên cấu hình</span><input value={variant.name} onChange={(event) => updateVariant(variant.id, "name", event.target.value)} placeholder="RAM 16GB · SSD 512GB" /></label>
                    <label><span>{fieldConfig.versionLabel}</span><input list={`version-options-${category}`} value={variant.version ?? ""} onChange={(event) => updateVariant(variant.id, "version", event.target.value)} placeholder={fieldConfig.versionPlaceholder} /></label>
                    <label><span>{fieldConfig.sizeLabel}</span><input list={`size-options-${category}`} value={variant.size ?? ""} onChange={(event) => updateVariant(variant.id, "size", event.target.value)} placeholder={fieldConfig.sizePlaceholder} /></label>
                    {category !== "macbook" && <label><span>Mã màu</span><input type="color" value={variant.colorHex || "#111111"} onChange={(event) => updateVariant(variant.id, "colorHex", event.target.value)} /></label>}
                    <label><span>SKU riêng</span><input value={variant.sku ?? ""} onChange={(event) => updateVariant(variant.id, "sku", event.target.value)} placeholder="MBA-16-512" /></label>
                    <label><span>Barcode</span><input value={variant.barcode ?? ""} onChange={(event) => updateVariant(variant.id, "barcode", event.target.value)} placeholder="Quét hoặc nhập mã vạch" /></label>
                    <label className="admin-span-2"><span>Serial / IMEI</span><textarea rows={3} value={(variant.serials ?? []).join("\n")} onChange={(event) => updateVariant(variant.id, "serials", event.target.value.split("\n").map((serial) => serial.trim()).filter(Boolean))} placeholder={'Mỗi dòng một serial\nABC001\nABC002'} /></label>
                    <label className="admin-variant-image"><span>Ảnh đúng màu · tối đa {MAX_PRODUCT_IMAGE_LABEL}</span>{variant.image && <Image src={variant.image} alt="" width={44} height={44} unoptimized />}<input name={`variantImage_${variant.id}`} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" /></label>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>

        <details className="admin-card admin-product-seo">
          <summary><span className="admin-product-step-title"><b>04</b><span><em>Xuất bản nâng cao</em><strong>SEO &amp; hiển thị nổi bật</strong><small>Không bắt buộc · mở khi cần tối ưu tìm kiếm</small></span></span><i>＋</i></summary>
          <div className="admin-form-grid">
            <label className="admin-field admin-span-2">Tiêu đề SEO<input name="seoTitle" defaultValue={product?.seoTitle} placeholder={name || "Tên sản phẩm"} /></label>
            <label className="admin-field admin-span-2">Mô tả SEO<textarea name="seoDescription" rows={3} defaultValue={product?.seoDescription} /></label>
            <label className="admin-field admin-span-2">Nguồn tham khảo<input name="source" defaultValue={product?.source} placeholder="https://..." /></label>
            <label className="admin-check"><input type="checkbox" name="featured" defaultChecked={product?.featured} /> Sản phẩm nổi bật</label>
          </div>
        </details>
      </section>

      <aside className="admin-editor-side">
        <div className="admin-preview-card">
          <header><span>KHÁCH HÀNG SẼ THẤY</span><em>{readinessCount}/4 mục chính</em></header>
          <div className="admin-customer-preview-tabs" aria-label="Kiểu xem trước">
            <button type="button" className={previewMode === "card" ? "is-active" : ""} aria-pressed={previewMode === "card"} onClick={() => setPreviewMode("card")}>Ngoài danh sách</button>
            <button type="button" className={previewMode === "detail" ? "is-active" : ""} aria-pressed={previewMode === "detail"} onClick={() => setPreviewMode("detail")}>Trang chi tiết</button>
          </div>

          <div className="admin-customer-preview-stage" data-preview-mode={previewMode}>
            {status !== "active" && <div className="admin-customer-preview-visibility"><strong>{status === "draft" ? "Bản nháp" : "Tạm ẩn"}</strong><span>Khách hàng chưa nhìn thấy sản phẩm này.</span></div>}

            {previewMode === "card" ? (
              <article className="admin-customer-product-card" aria-label="Mô phỏng thẻ sản phẩm ngoài cửa hàng">
                <div className="admin-customer-card-badges"><b>{badge.trim() || "Sản phẩm mới"}</b><span>Trả góp 0%</span></div>
                <div className="admin-customer-card-media">{renderPreviewImage("300px")}</div>
                <div className="admin-customer-card-copy">
                  <small>{brand.trim() || categoryLabel} · {categoryLabel}</small>
                  <strong>{name.trim() || "Tên sản phẩm sẽ hiển thị tại đây"}</strong>
                  {tagline.trim() && <span>{tagline}</span>}
                  <div className="admin-customer-card-price"><b>{customerPrice}</b>{salePrice.trim() && sellingPrice.trim() && <del>{sellingPrice}</del>}</div>
                  <em>👑 Infinity Member giảm thêm đến 1%</em>
                  <footer><span>★★★★★</span><small>{Number(stock) > 0 ? `Còn ${stock} sản phẩm` : "Liên hệ tồn kho"}</small></footer>
                </div>
              </article>
            ) : (
              <article className="admin-customer-product-detail" aria-label="Mô phỏng trang chi tiết sản phẩm">
                <div className="admin-customer-detail-topbar"><span>Trang chủ / {categoryLabel}</span><b>{status === "active" ? "Đang bán" : "Chưa xuất bản"}</b></div>
                <div className="admin-customer-detail-media">{renderPreviewImage("300px")}</div>
                <div className="admin-customer-detail-copy">
                  <small>{brand.trim() || categoryLabel}</small>
                  <strong>{name.trim() || "Tên sản phẩm"}</strong>
                  <span>{tagline.trim() || "Mô tả ngắn sẽ xuất hiện tại đây để khách hiểu điểm nổi bật."}</span>
                  <div><b>{customerPrice}</b>{salePrice.trim() && sellingPrice.trim() && <del>{sellingPrice}</del>}</div>
                  {previewVariants.length > 0 && <section><small>Cấu hình lựa chọn</small><div>{previewVariants.map((variant) => <em key={variant.id}>{[variant.ram, variant.storage, variant.color].filter(Boolean).join(" · ") || variant.name || "Cấu hình"}</em>)}</div></section>}
                  <button type="button" tabIndex={-1}>Thêm vào giỏ hàng</button>
                </div>
              </article>
            )}
          </div>

          <div className="admin-customer-preview-note"><i>✦</i><span><strong>Xem trước trực tiếp</strong><small>Nội dung thay đổi ngay khi bạn nhập, chưa cần lưu sản phẩm.</small></span></div>
          <div className="admin-product-readiness">
            {readinessItems.map((item) => <span className={item.ready ? "is-ready" : ""} key={item.label}><i>{item.ready ? "✓" : "·"}</i>{item.label}</span>)}
          </div>
        </div>
        <div className="admin-sticky-actions">
          <button className="admin-button admin-button-primary" name="mode" value="save" type="submit">Lưu sản phẩm</button>
          <button className="admin-button admin-button-muted" name="mode" value="draft" type="submit" onClick={() => setStatus("draft")}>Lưu bản nháp</button>
          <button className="admin-button" name="mode" value="another" type="submit">Lưu và thêm sản phẩm khác</button>
          <Link className="admin-button admin-button-muted" href="/admin/products">Hủy</Link>
        </div>
      </aside>
    </form>
  );
}

function parseConfigurationValues(raw: string, kind: "ram" | "storage") {
  return Array.from(new Set(raw
    .split(/[,;\n/]+/)
    .map((item) => item.trim().replace(/\s+/g, "").toUpperCase())
    .filter(Boolean)
    .map((item) => {
      if (/^\d+$/.test(item)) return `${item}${kind === "storage" && Number(item) <= 8 ? "TB" : "GB"}`;
      return item.replace(/G$/, "GB").replace(/T$/, "TB");
    })));
}

function normalizeConfiguration(value?: string) {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

function parseCustomColors(raw: string): MacbookColor[] {
  return Array.from(new Set(raw.split(/[,;\n]+/).map((color) => color.trim()).filter(Boolean)))
    .map((name) => ({ name, hex: "#7B8794", note: "Màu tùy chọn" }));
}

function productSpecValue(product: ManagedProduct | undefined, labels: string[]) {
  const prefixes = labels.map((label) => `${label}:`.toLocaleLowerCase("vi"));
  const line = product?.specs?.find((spec) => prefixes.some((prefix) => spec.toLocaleLowerCase("vi").startsWith(prefix)));
  return line?.slice(line.indexOf(":") + 1).trim() ?? "";
}

function initialMacbookColors(product?: ManagedProduct) {
  if (!product) return [];
  const variantNames = (product.variants ?? []).map((variant) => normalizeConfiguration(variant.color));
  const variantHexes = (product.variants ?? []).map((variant) => normalizeConfiguration(variant.colorHex));
  const productHexes = (product.colors ?? []).map(normalizeConfiguration);
  return MACBOOK_COLORS
    .filter((color) => {
      const aliases = [color.name, color.name.match(/\(([^)]+)\)/)?.[1] ?? ""].map(normalizeConfiguration);
      const hex = normalizeConfiguration(color.hex);
      return aliases.some((alias) => alias && variantNames.includes(alias)) || variantHexes.includes(hex) || productHexes.includes(hex);
    })
    .map((color) => color.name);
}
