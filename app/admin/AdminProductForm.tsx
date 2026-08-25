"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ManagedProduct } from "@/db/products";
import type { ProductVariant } from "@/app/products";
import { saveAdminProductAction } from "./actions";
import {
  CATEGORY_OPTIONS,
  PRODUCT_FIELD_CONFIG,
  editableCategory,
  technicalValuesFromSpecs,
  type EditableCategory,
} from "./product-fields";

export default function AdminProductForm({ product }: { product?: ManagedProduct }) {
  const initialImages = product?.images?.length ? product.images : product?.image ? [product.image] : [];
  const [images, setImages] = useState(initialImages);
  const [primaryImage, setPrimaryImage] = useState(product?.image ?? initialImages[0] ?? "");
  const [previews, setPreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants ?? []);
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState<EditableCategory>(editableCategory(product?.category));
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice ?? product?.price ?? "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [status, setStatus] = useState(product?.status ?? (product?.active === false ? "inactive" : "active"));
  const [specsText, setSpecsText] = useState(product?.specs?.join("\n") ?? "");
  const [technicalValues, setTechnicalValues] = useState<Record<string, string>>(() => technicalValuesFromSpecs(product?.specs));
  const [imageWarnings, setImageWarnings] = useState<string[]>([]);

  const previewImage = primaryImage || previews[0] || images[0] || "/products/iphone-16.png";
  const tags = useMemo(() => product?.tags?.join(", ") ?? "", [product]);
  const fieldConfig = PRODUCT_FIELD_CONFIG[category];

  function onFiles(files: FileList | null) {
    if (!files) return;
    const accepted = Array.from(files).filter((file) => file.type.startsWith("image/") && file.size <= 6 * 1024 * 1024);
    const rejected = Array.from(files).filter((file) => !file.type.startsWith("image/") || file.size > 6 * 1024 * 1024);
    const next = accepted.map((file) => URL.createObjectURL(file));
    setPreviews(next);
    setImageWarnings(rejected.map((file) => `${file.name}: chỉ nhận ảnh tối đa 6 MB.`));
    accepted.forEach((file) => validateImageDimensions(file));
    if (!primaryImage && next[0]) setPrimaryImage(next[0]);
  }

  function validateImageDimensions(file: File) {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      if (image.naturalWidth < 600 || image.naturalHeight < 600) {
        setImageWarnings((items) => [...items, `${file.name}: ảnh ${image.naturalWidth}×${image.naturalHeight}px, nên dùng tối thiểu 600×600px.`]);
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
      { id: crypto.randomUUID(), name: "", color: "", colorHex: "#111111", ram: "", storage: "", version: "", sku: "", price: sellingPrice, stock: 0, image: "" },
    ]);
  }

  function updateVariant(id: string, key: keyof ProductVariant, value: string) {
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

      <section className="admin-editor-main">
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <span>Thông tin cơ bản</span>
              <h2>Sản phẩm</h2>
            </div>
            <select name="status" value={status} onChange={(event) => setStatus(event.target.value as "draft" | "active" | "inactive")}>
              <option value="active">Đang bán</option>
              <option value="draft">Bản nháp</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
          </div>
          <div className="admin-form-grid">
            <label className="admin-field admin-span-2">Tên sản phẩm<input name="name" value={name} onChange={(event) => setName(event.target.value)} required placeholder="iPhone 17 Pro Max" /></label>
            <label className="admin-field">SKU<input name="sku" defaultValue={product?.sku} placeholder="IP17PM-256-TN" /></label>
            <label className="admin-field">Hãng sản xuất<input name="brand" defaultValue={product?.brand ?? "Apple"} required placeholder="Apple" /></label>
            <label className="admin-field">Danh mục<select name="category" value={category} onChange={(event) => setCategory(event.target.value as EditableCategory)}>{CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="admin-field">Nhãn nổi bật<input name="badge" defaultValue={product?.badge} placeholder="Mới / Giá tốt" /></label>
            <label className="admin-field admin-span-2">Mô tả chi tiết<textarea name="description" rows={4} defaultValue={product?.description ?? product?.tagline} placeholder="Mô tả dễ hiểu về sản phẩm cho khách hàng." /></label>
            <label className="admin-field admin-span-2">Mô tả ngắn<input name="tagline" defaultValue={product?.tagline} placeholder="Dòng giới thiệu ngắn hiển thị ngoài website" /></label>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head"><div><span>Giá & tồn kho</span><h2>Thông tin bán hàng</h2></div></div>
          <div className="admin-form-grid">
            <label className="admin-field">Giá nhập<input name="costPrice" defaultValue={product?.costPrice} placeholder="25.000.000đ" /></label>
            <label className="admin-field">Giá bán<input name="sellingPrice" value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} placeholder="31.290.000đ" /></label>
            <label className="admin-field">Giá khuyến mãi<input name="salePrice" defaultValue={product?.salePrice} placeholder="29.990.000đ" /></label>
            <label className="admin-field">Số lượng tồn kho<input name="stock" type="number" min="0" value={stock} onChange={(event) => setStock(event.target.value)} /></label>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head"><div><span>Ảnh sản phẩm</span><h2>Thư viện hình ảnh</h2></div></div>
          <label className="admin-dropzone">
            <input name="imageFiles" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple onChange={(event) => onFiles(event.target.files)} />
            <strong>Kéo thả hoặc chọn nhiều ảnh</strong>
            <small>PNG, JPG, WEBP, GIF, AVIF. Tối đa 6 MB mỗi ảnh.</small>
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

        <div className="admin-card">
          <div className="admin-card-head">
            <div><span>Cấu hình theo danh mục</span><h2>{fieldConfig.title}</h2><p>{fieldConfig.description}</p></div>
            <button type="button" className="admin-button" onClick={addVariant}>Thêm cấu hình</button>
          </div>
          <div className="admin-technical-grid">
            {fieldConfig.technicalFields.map((field) => (
              <label className="admin-field" key={`${category}-${field.key}`}>{field.label}
                <input value={technicalValues[field.key] ?? ""} onChange={(event) => updateTechnicalField(field.key, field.label, event.target.value)} placeholder={field.placeholder} />
              </label>
            ))}
          </div>
          <div className="admin-form-grid">
            <label className="admin-field">Màu sản phẩm<input name="colors" defaultValue={product?.colors?.join(", ") ?? "#111111"} placeholder="#111111, #f5f5f7" /></label>
            <label className="admin-field">Nhãn tìm kiếm<input name="tags" defaultValue={tags} placeholder="iphone, flagship, 256gb" /></label>
            <label className="admin-field admin-span-2">Thông số bổ sung<textarea name="specs" rows={5} value={specsText} onChange={(event) => setSpecsText(event.target.value)} placeholder={"Mỗi dòng một thông số\nChống nước IP68\nKhối lượng 199g"} /></label>
          </div>
          <datalist id={`storage-options-${category}`}>{fieldConfig.storageOptions.map((option) => <option key={option} value={option} />)}</datalist>
          <datalist id={`ram-options-${category}`}>{fieldConfig.ramOptions.map((option) => <option key={option} value={option} />)}</datalist>
          <datalist id={`version-options-${category}`}>{fieldConfig.versionOptions.map((option) => <option key={option} value={option} />)}</datalist>
          <datalist id={`size-options-${category}`}>{fieldConfig.sizeOptions.map((option) => <option key={option} value={option} />)}</datalist>
          <div className="admin-variant-list">
            {variants.length === 0 && <p className="admin-empty-state">Chưa có cấu hình. Sản phẩm sẽ chỉ hiện dung lượng được ghi trong tên cho đến khi bạn thêm cấu hình tại đây.</p>}
            {variants.map((variant, index) => (
              <div className="admin-variant" key={variant.id}>
                <div className="admin-variant-head"><strong>Cấu hình {index + 1}</strong><button type="button" onClick={() => removeVariant(variant.id)}>Xóa</button></div>
                <label><span>Tên cấu hình</span><input value={variant.name} onChange={(event) => updateVariant(variant.id, "name", event.target.value)} placeholder="256GB - Đen" /></label>
                <label><span>{fieldConfig.storageLabel}</span><input list={`storage-options-${category}`} value={variant.storage ?? ""} onChange={(event) => updateVariant(variant.id, "storage", event.target.value)} placeholder={fieldConfig.storagePlaceholder} /></label>
                <label><span>{fieldConfig.ramLabel}</span><input list={`ram-options-${category}`} inputMode="numeric" value={variant.ram ?? ""} onChange={(event) => updateVariant(variant.id, "ram", event.target.value)} placeholder={fieldConfig.ramPlaceholder} /></label>
                <label><span>{fieldConfig.versionLabel}</span><input list={`version-options-${category}`} value={variant.version ?? ""} onChange={(event) => updateVariant(variant.id, "version", event.target.value)} placeholder={fieldConfig.versionPlaceholder} /></label>
                <label><span>{fieldConfig.sizeLabel}</span><input list={`size-options-${category}`} value={variant.size ?? ""} onChange={(event) => updateVariant(variant.id, "size", event.target.value)} placeholder={fieldConfig.sizePlaceholder} /></label>
                <label><span>Màu</span><input value={variant.color ?? ""} onChange={(event) => updateVariant(variant.id, "color", event.target.value)} placeholder="Titan Đen" /></label>
                <label><span>Mã màu</span><input type="color" value={variant.colorHex || "#111111"} onChange={(event) => updateVariant(variant.id, "colorHex", event.target.value)} /></label>
                <label><span>SKU riêng</span><input value={variant.sku ?? ""} onChange={(event) => updateVariant(variant.id, "sku", event.target.value)} placeholder="IP16-256-BLK" /></label>
                <label><span>Giá cấu hình</span><input value={variant.price ?? ""} onChange={(event) => updateVariant(variant.id, "price", event.target.value)} placeholder="24.990.000đ" /></label>
                <label><span>Tồn kho</span><input type="number" min="0" value={String(variant.stock ?? 0)} onChange={(event) => updateVariant(variant.id, "stock", event.target.value)} /></label>
                <label className="admin-variant-image"><span>Ảnh đúng màu</span>{variant.image && <Image src={variant.image} alt="" width={44} height={44} unoptimized />}<input name={`variantImage_${variant.id}`} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" /></label>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head"><div><span>SEO</span><h2>Hiển thị trên công cụ tìm kiếm</h2></div></div>
          <div className="admin-form-grid">
            <label className="admin-field admin-span-2">Tiêu đề SEO<input name="seoTitle" defaultValue={product?.seoTitle} placeholder={name || "Tên sản phẩm"} /></label>
            <label className="admin-field admin-span-2">Mô tả SEO<textarea name="seoDescription" rows={3} defaultValue={product?.seoDescription} /></label>
            <label className="admin-field admin-span-2">Nguồn tham khảo<input name="source" defaultValue={product?.source} placeholder="https://..." /></label>
            <label className="admin-check"><input type="checkbox" name="featured" defaultChecked={product?.featured} /> Sản phẩm nổi bật</label>
          </div>
        </div>
      </section>

      <aside className="admin-editor-side">
        <div className="admin-preview-card">
          <div className="admin-preview-image">
            {previewImage.startsWith("blob:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewImage} alt="" />
            ) : (
              <Image src={previewImage} alt="" fill unoptimized sizes="320px" />
            )}
          </div>
          <span>{status === "draft" ? "Bản nháp" : status === "inactive" ? "Tạm ẩn" : "Đang bán"}</span>
          <h3>{name || "Tên sản phẩm"}</h3>
          <p>{sellingPrice || "Liên hệ giá tốt"}</p>
          <small>{stock} sản phẩm trong kho</small>
        </div>
        <div className="admin-sticky-actions">
          <button className="admin-button admin-button-muted" name="mode" value="draft" type="submit" onClick={() => setStatus("draft")}>Lưu bản nháp</button>
          <button className="admin-button admin-button-primary" name="mode" value="save" type="submit">Lưu sản phẩm</button>
          <button className="admin-button" name="mode" value="another" type="submit">Lưu và thêm sản phẩm khác</button>
          <Link className="admin-button admin-button-muted" href="/admin/products">Hủy</Link>
        </div>
      </aside>
    </form>
  );
}
