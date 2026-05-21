import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LeadAssignment from '@/models/LeadAssignment';
import Lead from '@/models/Lead';

// This is required for Next.js to not buffer the SSE response
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get('providerId');

  if (!providerId) {
    return NextResponse.json({ error: 'providerId is required' }, { status: 400 });
  }

  await dbConnect();

  const stream = new ReadableStream({
    async start(controller) {
      let lastCheckedTime = new Date();

      const sendEvent = (data: any) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial connection success event
      sendEvent({ type: 'connected', time: new Date() });

      // Poll every 2 seconds
      const intervalId = setInterval(async () => {
        try {
          // Find any new assignments for this provider since last check
          const newAssignments = await LeadAssignment.find({
            providerId,
            createdAt: { $gt: lastCheckedTime }
          }).populate('leadId'); // Populate to get lead details

          if (newAssignments.length > 0) {
            // Update last checked time to the newest assignment
            lastCheckedTime = new Date(Math.max(...newAssignments.map(a => new Date(a.createdAt).getTime())));
            
            for (const assignment of newAssignments) {
              sendEvent({
                type: 'new_lead',
                assignment,
                lead: assignment.leadId // The populated lead
              });
            }
          }
        } catch (error) {
          console.error('SSE Polling Error:', error);
          // Don't close connection on temporary db error
        }
      }, 2000);

      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
