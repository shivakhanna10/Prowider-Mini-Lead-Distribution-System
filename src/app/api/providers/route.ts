import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Provider from '@/models/Provider';

// Force dynamic so we don't cache providers (since quota changes frequently)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const providers = await Provider.find({}).lean();
    return NextResponse.json(providers, { status: 200 });
  } catch (error) {
    console.error('Fetch providers error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
