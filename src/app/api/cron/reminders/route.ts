import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendToUser, NotificationPayload } from '@/lib/web-push';

interface Event {
  id: string;
  title: string;
  location: string;
  datetime: string;
  reminder_minutes: number | null;
  creator_id: string;
}

interface Participant {
  user_id: string;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours === 1) {
    return '1 hour';
  }
  if (hours < 24) {
    return `${hours} hours`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sends this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In development, allow without secret
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();

    // Get events that need reminders sent
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('id, title, location, datetime, reminder_minutes, creator_id')
      .not('reminder_minutes', 'is', null)
      .gt('datetime', now.toISOString())
      .returns<Event[]>();

    if (error) {
      console.error('Error fetching events for reminders:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ message: 'No events to process', sent: 0 });
    }

    let totalSent = 0;

    for (const event of events) {
      if (!event.reminder_minutes) continue;

      const eventTime = new Date(event.datetime);
      const reminderTime = new Date(eventTime.getTime() - event.reminder_minutes * 60 * 1000);

      // Check if reminder should be sent now (within 2-minute window)
      const diffMs = Math.abs(now.getTime() - reminderTime.getTime());
      const withinWindow = diffMs < 2 * 60 * 1000;

      if (!withinWindow) continue;

      // Check if reminder was already sent
      const existingReminder = await prisma.eventReminder.findUnique({
        where: { eventId: event.id },
      });

      if (existingReminder) continue;

      // Get all participants including creator
      const { data: participants } = await supabaseAdmin
        .from('event_participants')
        .select('user_id')
        .eq('event_id', event.id)
        .returns<Participant[]>();

      const userIds = new Set<string>();
      userIds.add(event.creator_id);

      if (participants) {
        participants.forEach(p => userIds.add(p.user_id));
      }

      // Send notifications
      const payload: NotificationPayload = {
        title: 'Event Reminder',
        body: `${event.title} starts in ${formatMinutes(event.reminder_minutes)}`,
        data: {
          url: `/events/${event.id}`,
          eventId: event.id,
        },
      };

      for (const userId of userIds) {
        const count = await sendToUser(userId, payload);
        totalSent += count;
      }

      // Mark reminder as sent
      await prisma.eventReminder.create({
        data: { eventId: event.id },
      }).catch(() => {});

      console.log(`Sent reminder for event "${event.title}"`);
    }

    return NextResponse.json({
      success: true,
      message: `Processed reminders`,
      sent: totalSent,
    });
  } catch (error) {
    console.error('Reminder cron error:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
