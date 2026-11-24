import { NextResponse } from "next/server";

const API_KEY = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY || "";

export async function POST(req: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: "Helius API key not configured" }, { status: 500 });
  }

  const body = await req.json();
  const rpcUrl = `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
