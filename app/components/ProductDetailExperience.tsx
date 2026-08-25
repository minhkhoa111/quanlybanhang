"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product, ProductColor, ProductVariant } from "@/app/products";
import { formatOrderMoney, productUnitPrice } from "@/app/order-pricing";
import { useCart } from "@/app/cart";

function normalize(value?: string) {
  return (value ?? "").trim().toLocaleLowerCase("vi");
}

function matchingVariants(product: Product, storage: string, ram = "") {
  const variants = product.variants ?? [];
  return variants.filter((variant) =>
    (!storage || normalize(variant.storage) === normalize(storage)) &&
    (!ram || normalize(variant.ram) === normalize(ram)),
  );
}

function colorsForConfiguration(product: Product, storage: string, ram: string): ProductColor[] {
  const variants = matchingVariants(product, storage, ram).filter((variant) => variant.color);
  const variantColors = variants
    .filter((variant, index, list) => list.findIndex((item) => normalize(item.color) === normalize(variant.color)) === index)
    .map((variant) => ({ name: variant.color as string, hex: variant.colorHex || "#111111" }));

  if (variantColors.length) return variantColors;
  if (product.colorOptions?.length) return product.colorOptions;
  return product.colors.map((hex, index) => ({ name: `Màu ${index + 1}`, hex }));
}

function findVariant(product: Product, storage: string, ram: string, color: string): ProductVariant | undefined {
  const candidates = matchingVariants(product, storage, ram);
  return candidates.find((variant) => normalize(variant.color) === normalize(color)) ?? candidates[0];
}

function uniqueImages(images: Array<string | undefined>) {
  return images.filter((image): image is string => Boolean(image)).filter((image, index, list) => list.indexOf(image) === index);
}

export default function ProductDetailExperience({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const storageOptions = useMemo(() => product.storageOptions ?? [], [product.storageOptions]);
  const ramOptions = useMemo(() => Array.from(new Set((product.variants ?? []).map((variant) => variant.ram).filter((ram): ram is string => Boolean(ram)))), [product]);
  const [ram, setRam] = useState(ramOptions[0] ?? "");
  const availableStorageOptions = useMemo(() => {
    if (!ram) return storageOptions;
    return Array.from(new Set(matchingVariants(product, "", ram).map((variant) => variant.storage).filter((item): item is string => Boolean(item))));
  }, [product, ram, storageOptions]);
  const [storage, setStorage] = useState(availableStorageOptions[0] ?? storageOptions[0] ?? "");
  const activeStorage = availableStorageOptions.includes(storage) ? storage : availableStorageOptions[0] ?? storage;
  const availableColors = useMemo(() => colorsForConfiguration(product, activeStorage, ram), [activeStorage, product, ram]);
  const [color, setColor] = useState(availableColors[0]?.name ?? "");
  const activeColor = availableColors.find((item) => normalize(item.name) === normalize(color))?.name ?? availableColors[0]?.name ?? "";
  const selectedVariant = useMemo(() => findVariant(product, activeStorage, ram, activeColor), [activeColor, activeStorage, product, ram]);
  const gallery = useMemo(
    () => uniqueImages([selectedVariant?.image, product.image, ...(product.images ?? []), ...(product.variants ?? []).map((variant) => variant.image)]),
    [product, selectedVariant?.image],
  );
  const [chosenImage, setChosenImage] = useState("");
  const activeImage = gallery.includes(chosenImage) ? chosenImage : selectedVariant?.image || gallery[0] || product.image;
  const selectedPrice = productUnitPrice(product, activeStorage, activeColor, ram);
  const orderHref = `/dat-hang?may=${encodeURIComponent(product.slug)}${ram ? `&ram=${encodeURIComponent(ram)}` : ""}${activeStorage ? `&dung-luong=${encodeURIComponent(activeStorage)}` : ""}${activeColor ? `&mau=${encodeURIComponent(activeColor)}` : ""}`;

  return (
    <section className="product-detail shell">
      <div className="detail-gallery">
        <div className="detail-image">
          <Image src={activeImage} alt={`${product.name}${activeColor ? ` - ${activeColor}` : ""}`} fill unoptimized priority sizes="(max-width: 900px) 90vw, 50vw" />
        </div>
        {gallery.length > 1 && (
          <div className="detail-thumbnails" aria-label="Ảnh chi tiết sản phẩm">
            {gallery.map((image, index) => (
              <button key={`${image}-${index}`} type="button" className={activeImage === image ? "is-active" : ""} onClick={() => setChosenImage(image)} aria-label={`Xem ảnh ${index + 1}`}>
                <Image src={image} alt="" fill unoptimized sizes="88px" />
              </button>
            ))}
          </div>
        )}
        <p>Ảnh sản phẩm và màu sắc được tổng hợp từ nguồn nhà cung cấp.</p>
      </div>

      <div className="detail-info">
        <p className="eyebrow">{product.brand} · {product.badge}</p>
        <h1>{product.name}</h1>
        <p className="detail-tagline">{product.tagline}</p>

        <div className="detail-price"><span>Giá cấu hình đã chọn</span><strong>{selectedPrice ? formatOrderMoney(selectedPrice) : product.price}</strong></div>

        {ramOptions.length > 0 && (
          <div className="detail-block">
            <h2>RAM</h2>
            <div className="detail-option-list">
              {ramOptions.map((option) => {
                const firstStorage = matchingVariants(product, "", option).find((variant) => variant.storage)?.storage ?? "";
                return (
                  <button key={option} type="button" className={ram === option ? "is-active" : ""} onClick={() => { setRam(option); setStorage(firstStorage); setColor(colorsForConfiguration(product, firstStorage, option)[0]?.name ?? ""); setChosenImage(""); }}>
                    <span>{option}</span>
                    <small>Từ {formatOrderMoney(productUnitPrice(product, firstStorage, "", option))}</small>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {availableStorageOptions.length > 0 && (
          <div className="detail-block">
            <h2>{ramOptions.length ? "Ổ cứng SSD" : "Dung lượng"}</h2>
            <div className="detail-option-list">
              {availableStorageOptions.map((option) => (
                <button key={option} type="button" className={activeStorage === option ? "is-active" : ""} onClick={() => { setStorage(option); setColor(colorsForConfiguration(product, option, ram)[0]?.name ?? ""); setChosenImage(""); }}>
                  <span>{option}</span>
                  <small>{formatOrderMoney(productUnitPrice(product, option, "", ram))}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {availableColors.length > 0 && (
          <div className="detail-block">
            <h2>Màu sắc</h2>
            <div className="detail-color-options">
              {availableColors.map((option) => (
                <button key={option.name} type="button" className={normalize(activeColor) === normalize(option.name) ? "is-active" : ""} onClick={() => { setColor(option.name); setChosenImage(findVariant(product, activeStorage, ram, option.name)?.image ?? ""); }}>
                  <span style={{ backgroundColor: option.hex }} />
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="detail-block">
          <h2>Cấu hình sản phẩm</h2>
          <ul>{product.specs.map((spec) => <li key={spec}><span>✓</span>{spec}</li>)}</ul>
          <p className="detail-spec-source">Thông tin được tổng hợp từ nhà sản xuất và nguồn nhà cung cấp của sản phẩm.</p>
        </div>

        <div className="detail-media-links">
          {product.mediaLinks?.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}
          {product.source && <a href={product.source} target="_blank" rel="noreferrer">Nguồn sản phẩm</a>}
        </div>

        <div className="detail-actions">
          <Link className="button button-primary" href={orderHref}>Đặt cấu hình này</Link>
          <button className="button button-cart" type="button" onClick={() => {
            addItem({ productSlug: product.slug, productName: product.name, image: activeImage, ram, storage: activeStorage, color: activeColor, unitPrice: selectedPrice });
            setAddedToCart(true);
            window.setTimeout(() => setAddedToCart(false), 1800);
          }}>{addedToCart ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}</button>
          <a className="button button-secondary" href="tel:0839745735">Gọi 0839 745 735</a>
        </div>

        <p className="detail-note">Giá và tồn kho được xác nhận lại trước khi giao. Màu hiển thị có thể chênh lệch nhẹ tùy màn hình.</p>
      </div>
    </section>
  );
}
