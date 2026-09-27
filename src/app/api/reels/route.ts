import { NextResponse } from 'next/server';
import { getAllReels } from '@/lib/db';

export async function GET() {
  try {
    const reels = getAllReels();
    return NextResponse.json(reels);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
