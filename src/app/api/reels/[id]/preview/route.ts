import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  // Validate ID
  if (!/^[a-z0-9-]+$/.test(id)) {
    return new NextResponse('Invalid ID', { status: 400 });
  }

  // Check 2: First frame is free via distinct path, served from public/
  const previewPath = path.join(process.cwd(), 'public', 'reels', id, 'preview.jpg');

  if (!fs.existsSync(previewPath)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const buffer = fs.readFileSync(previewPath);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
