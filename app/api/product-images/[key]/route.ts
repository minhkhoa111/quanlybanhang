import { env } from "cloudflare:workers";

type Bindings = {
  PRODUCT_IMAGES: R2Bucket;
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!/^[a-zA-Z0-9._-]+$/.test(key)) {
    return new Response("Invalid image key", { status: 400 });
  }

  const bucket = (env as unknown as Bindings).PRODUCT_IMAGES;
  if (!bucket) return new Response("Image storage unavailable", { status: 503 });
  const object = await bucket.get(key);
  if (!object) return new Response("Image not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
