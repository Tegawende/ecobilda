import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const convexUrl = process.env.CONVEX_INTERNAL_URL || 'http://convex-backend:3210';
  const searchParams = request.nextUrl.searchParams.toString();
  const upstreamUrl = `${convexUrl}/api/storage/upload${searchParams ? `?${searchParams}` : ''}`;

  const body = await request.arrayBuffer();
  const contentType = request.headers.get('content-type') || 'application/octet-stream';

  const response = await fetch(upstreamUrl, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: body,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
