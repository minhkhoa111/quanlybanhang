import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/app/admin-auth";
import AdminProductForm from "../../AdminProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string; status?: string }> }) {
  const [query, user] = await Promise.all([searchParams, requireAdminPage("/admin/products/new")]);
  if (user.role === "inventory") redirect("/admin/inventory");
  return (
    <>
      <div className="admin-topline">
        <div><span>Sản phẩm</span><h1>Thêm sản phẩm</h1></div>
        <Link className="admin-button" href="/admin/products">Quay lại</Link>
      </div>
      {query.error && <p className="admin-alert error">{query.error}</p>}
      {query.status && <p className="admin-alert success">Đã lưu sản phẩm.</p>}
      <AdminProductForm />
    </>
  );
}
