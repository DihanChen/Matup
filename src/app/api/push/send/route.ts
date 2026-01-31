import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendToNearbyUsers } from '@/lib/web-push';

export async function POST(request: NextRequest) {
  try {
    // Verify auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      eventId,
      eventTitle,
      eventLocation,
      latitude,
      longitude,
      radiusKm = 10,
    } = body as {
      eventId: string;
      eventTitle: string;
      eventLocation: string;
      latitude: number;
      longitude: number;
      radiusKm?: number;
    };

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Event location coordinates are required' },
        { status: 400 }
      );
    }

    const payload = {
      title: 'Workout Now!',
      body: `${eventTitle} - ${eventLocation}`,
      data: {
        url: `/events/${eventId}`,
        eventId,
      },
    };

    const result = await sendToNearbyUsers(
      latitude,
      longitude,
      payload,
      radiusKm,
      user.id // Exclude the creator
    );

    return NextResponse.json({
      success: true,
      message: `Notified ${result.sent} nearby users`,
      ...result,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
