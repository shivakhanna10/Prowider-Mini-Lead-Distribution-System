import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Provider from '@/models/Provider';
import Lead from '@/models/Lead';
import LeadAssignment from '@/models/LeadAssignment';
import WebhookEvent from '@/models/WebhookEvent';

export async function POST() {
  try {
    await dbConnect();

    // Clear all existing data so unique indexes can be built safely
    await Provider.deleteMany({});
    await Lead.deleteMany({});
    await LeadAssignment.deleteMany({});
    await WebhookEvent.deleteMany({});

    // Seed dummy providers
    const providers = [
      {
        name: 'Plumbing Pros (Always gets plumbing)',
        services: ['plumbing'],
        alwaysReceive: ['plumbing'],
        quota: 10,
      },
      {
        name: 'Alice Plumbing',
        services: ['plumbing'],
        alwaysReceive: [],
        quota: 10,
      },
      {
        name: 'Bob Plumbing & Electrical',
        services: ['plumbing', 'electrical'],
        alwaysReceive: [],
        quota: 10,
      },
      {
        name: 'Charlie Electrical',
        services: ['electrical'],
        alwaysReceive: [],
        quota: 10,
      },
      {
        name: 'Dave Fix-it All',
        services: ['plumbing', 'electrical', 'hvac'],
        alwaysReceive: [],
        quota: 10,
      },
    ];

    await Provider.insertMany(providers);

    // Force index rebuild just in case (Mongoose handles this in background usually)
    await Lead.syncIndexes();
    await LeadAssignment.syncIndexes();
    await WebhookEvent.syncIndexes();

    return NextResponse.json({ message: 'Database seeded successfully with 5 providers and indexes synced' }, { status: 200 });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
