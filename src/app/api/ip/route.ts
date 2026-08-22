export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");
  return Response.json({
    ip: forwarded ? forwarded.split(",")[0].trim() : realIp ?? headers.get("x-client-ip") ?? "unavailable (proxied request)",
    forwardedFor: forwarded ?? null,
    userAgent: headers.get("user-agent") ?? null,
    acceptLanguage: headers.get("accept-language") ?? null,
    host: headers.get("host") ?? null,
    protocol: headers.get("x-forwarded-proto") ?? "http",
    note: "Headers are read server-side from this request only — nothing is stored or logged.",
    timestamp: new Date().toISOString(),
  });
}
