import { notFound } from "next/navigation";
import Link from "next/link";
import { getManagedProductById } from "@/db/products";
import AdminProductForm from "../../AdminProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ status?: string; error?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const product = await getManagedProductById(id);
  if (!product) notFound();

  return (
    <>
      <div className="admin-topline">
        <div><span>Sản phẩm</span><h1>Chỉnh sửa sản phẩm</h1></div>
        <Link className="admin-button" href="/admin/products">Quay lại</Link>
      </div>
      {query.status && <p className="admin-alert success">Đã lưu thay đổi.</p>}
      {query.error && <p className="admin-alert error">{query.error}</p>}
      <AdminProductForm product={product} />
    </>
  );
}
