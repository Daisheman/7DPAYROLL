import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:4000/api";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const target = new URL(`${API_URL}/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  const forwardHeaders: Record<string, string> = {
    "host": new URL(API_URL).host,
    "content-type": request.headers.get("content-type") ?? "application/json",
  };

  const cookie = request.headers.get("cookie");
  if (cookie) forwardHeaders["cookie"] = cookie;

  const csrf = request.headers.get("x-csrf-token");
  if (csrf) forwardHeaders["x-csrf-token"] = csrf;

  const upstream = await fetch(target.toString(), {
    method,
    headers: forwardHeaders,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) responseHeaders.set("set-cookie", setCookie);
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
