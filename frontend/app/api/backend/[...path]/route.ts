import { NextRequest, NextResponse } from 'next/server';

const backendBaseUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';
const normalizedBackendBaseUrl = backendBaseUrl.endsWith('/')
  ? backendBaseUrl
  : `${backendBaseUrl}/`;

async function proxy(req: NextRequest, path: string[]) {
  try {
    const url = new URL(path.join('/'), normalizedBackendBaseUrl);
    url.search = req.nextUrl.search;

    const method = req.method;
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const rawBody = hasBody ? await req.text() : undefined;

    const upstream = await fetch(url, {
      method,
      headers: {
        'Content-Type': req.headers.get('content-type') ?? 'application/json',
      },
      body: hasBody ? rawBody : undefined,
      cache: 'no-store',
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha de conexão com o backend';
    return NextResponse.json(
      { detail: `Erro ao chamar backend (${backendBaseUrl}): ${message}` },
      { status: 502 },
    );
  }
}

type Params = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(req, path);
}
