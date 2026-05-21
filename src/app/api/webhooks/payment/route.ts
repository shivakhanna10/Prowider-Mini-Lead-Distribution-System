import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WebhookEvent from '@/models/WebhookEvent';
import Provider from '@/models/Provider';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, providerId } = body;

    if (!eventId || !providerId) {
      return NextResponse.json({ error: 'eventId and providerId are required' }, { status: 400 });
    }

    await dbConnect();

    // 1. Idempotency Check using MongoDB unique index on eventId
    // We attempt an upsert. If this eventId has already been processed,
    // the upsert will effectively do nothing (or throw duplicate key if not using upsert correctly,
    // but with setOnInsert it's safe).
    // Let's use an insert and catch the E11000 duplicate key error, which is the most robust way.
    try {
      const event = new WebhookEvent({ eventId, providerId });
      await event.save();
    } catch (error: any) {
      // E11000 is the MongoDB duplicate key error code
      if (error.code === 11000) {
        // Event already processed! We return 200 OK immediately without doing the side effect.
        console.log(`Idempotency hit: Event ${eventId} already processed.`);
        return NextResponse.json({ message: 'Event already processed' }, { status: 200 });
      }
      // If it's some other error, throw it
      throw error;
    }

    // 2. Perform the side effect: Reset Provider Quota to 10
    const updatedProvider = await Provider.findByIdAndUpdate(
      providerId,
      { $set: { quota: 10 } },
      { new: true }
    );

    if (!updatedProvider) {
       return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Quota successfully reset', 
      providerId,
      newQuota: updatedProvider.quota 
    }, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
