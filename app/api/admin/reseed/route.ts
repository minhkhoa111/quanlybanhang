import { reseedProductStore } from '@/db/products';
import { requireOwnerAction } from '@/app/admin-auth';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ ok: false, error: 'Không tìm thấy.' }, { status: 404 });
  }

  try {
    await requireOwnerAction();
    await reseedProductStore();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'Không thể khởi tạo lại dữ liệu.' }, { status: 403 });
  }
}
