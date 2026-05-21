import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Provider from '@/models/Provider';
import LeadAssignment from '@/models/LeadAssignment';

const MAX_PROVIDERS_PER_LEAD = 3;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phoneNumber, city, service, description } = body;

    // Feature 1 validation
    if (!name || !phoneNumber || !city || !service) {
      return NextResponse.json({ error: 'Name, Phone Number, City, and Service are required' }, { status: 400 });
    }

    await dbConnect();

    // 1. Create the lead
    let lead;
    try {
      lead = new Lead({ name, phoneNumber, city, service, description, status: 'unassigned' });
      await lead.save();
    } catch (error: any) {
      // Catch MongoDB unique constraint violation (E11000)
      if (error.code === 11000) {
        return NextResponse.json({ 
          error: 'Duplicate Lead Error: This phone number has already submitted a request for this service.' 
        }, { status: 409 });
      }
      throw error;
    }

    // 2. Find eligible providers for this service
    const eligibleProviders = await Provider.find({
      services: service,
      quota: { $gt: 0 }
    }).lean();

    if (eligibleProviders.length === 0) {
      return NextResponse.json({ message: 'Lead created, but no eligible providers found', lead }, { status: 201 });
    }

    // 3. Separate into "Always Receive" and "Fair Distribution"
    const alwaysReceiveProviders = [];
    const fairDistributionProviders = [];

    for (const p of eligibleProviders) {
      if (p.alwaysReceive && p.alwaysReceive.includes(service)) {
        alwaysReceiveProviders.push(p);
      } else {
        fairDistributionProviders.push(p);
      }
    }

    // 4. Sort Fair Distribution by least recently assigned
    fairDistributionProviders.sort((a, b) => {
      const timeA = new Date(a.lastAssignedAt || 0).getTime();
      const timeB = new Date(b.lastAssignedAt || 0).getTime();
      return timeA - timeB;
    });

    const candidatesToTry = [...alwaysReceiveProviders, ...fairDistributionProviders];

    // 5. Attempt atomic assignment
    let assignmentsMade = 0;
    const assignedProviderIds = [];

    for (const candidate of candidatesToTry) {
      if (assignmentsMade >= MAX_PROVIDERS_PER_LEAD) {
        break; 
      }

      // Feature 2: Atomic update to prevent overdrawing quota under concurrent load
      const updatedProvider = await Provider.findOneAndUpdate(
        { _id: candidate._id, quota: { $gt: 0 } },
        { 
          $inc: { quota: -1, assignedCount: 1 }, 
          $set: { lastAssignedAt: new Date() } 
        },
        { new: true } 
      );

      if (updatedProvider) {
        try {
          // Feature 2: Record assignment (protected by DB-level unique constraint leadId + providerId)
          await LeadAssignment.create({
            leadId: lead._id,
            providerId: updatedProvider._id
          });
          
          assignmentsMade++;
          assignedProviderIds.push(updatedProvider._id);
        } catch (assignmentError: any) {
          // If assignment unique constraint fails (shouldn't happen here, but robust to catch)
          if (assignmentError.code !== 11000) {
            console.error('Assignment error', assignmentError);
          }
        }
      }
    }

    // 6. Update Lead status
    if (assignmentsMade > 0) {
      lead.status = 'assigned';
      await lead.save();
    }

    return NextResponse.json({ 
      message: 'Lead processed successfully', 
      lead,
      assignmentsMade,
      assignedProviderIds
    }, { status: 201 });

  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
