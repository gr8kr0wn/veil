import { NextResponse, type NextRequest } from "next/server";
import { allow } from "@/lib/rate-limit";
import { HELIUS_HOST } from "@/lib/config";

/**
 * Server-side proxy to Helius. Keeps HELIUS_API_KEY off the client.
 *   /api/helius            -> JSON-RPC
 *   /api/helius/v1/spr/**  -> Zolana indexer + prover gateway
 */
const UPSTREAM_HOST = HELIUS_HOST;
const MAX_BODY_BYTES = 512 * 1024;
const TIMEOUT_MS = 60_000;
const SAFE_SEGMENT = /^[A-Za-z0-9._~-]+$/;

const STRIP_REQUEST = new Set([
  "host", "connection", "content-length", "cookie", "authorization", "origin", "referer",
  "accept-encoding", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-real-ip",
  "x-vercel-id", "x-vercel-forwarded-for", "x-vercel-deployment-url",
]);
const STRIP_RESPONSE = new Set([
  "content-encoding", "content-length", "transfer-encoding", "connection", "set-cookie",
]);

type Ctx = { params: Promise<{ path?: string[] }> };

function fail(status: number, message: string) {
  return NextResponse.json(
    { jsonrpc: "2.0", id: null, error: { code: -32000, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

// Browsers always send Origin on cross-origin and POST requests; require it to match our host.
function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === req.headers.get("host");
    } catch {
      return false;
    }
  }
  return req.headers.get("sec-fetch-site") === "same-origin";
}

function clientId(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

async function forward(req: NextRequest, ctx: Ctx): Promise<Response> {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) return fail(503, "Helius is not configured");
  if (!isSameOrigin(req)) return fail(403, "Forbidden");
  if (!allow(clientId(req))) return fail(429, "Too many requests");

  const { path = [] } = await ctx.params;
  if (!path.every((s) => SAFE_SEGMENT.test(s) && s !== "." && s !== "..")) return fail(400, "Bad path");
  if (path.length > 0 && !(path[0] === "v1" && path[1] === "spr")) return fail(404, "Not found");

  let body: ArrayBuffer | undefined;
  if (req.method === "POST") {
    if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return fail(413, "Payload too large");
    body = await req.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) return fail(413, "Payload too large");
  }

  const url = new URL(`https://${UPSTREAM_HOST}/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key.toLowerCase() !== "api-key") url.searchParams.append(key, value);
  });
  url.searchParams.set("api-key", apiKey);

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!STRIP_REQUEST.has(key.toLowerCase())) headers.set(key, value);
  });

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return fail(502, "Upstream unavailable");
  }

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE.has(key.toLowerCase())) out.set(key, value);
  });
  out.set("Cache-Control", "no-store");
  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

export const GET = forward;
export const POST = forward;
