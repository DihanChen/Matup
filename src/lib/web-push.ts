import webpush from 'web-push';
import { prisma } from './prisma';
import { haversineDistance } from './geo';

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:notifications@matup.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    eventId?: string;
    [key: string]: unknown;
  };
}

/**
 * Save a push subscription for a user
 */
export async function saveSubscription(
  userId: string,
  subscription: PushSubscriptionData,
  latitude?: number,
  longitude?: number
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: {
      userId_endpoint: {
        userId,
        endpoint: subscription.endpoint,
      },
    },
    update: {
      keysP256dh: subscription.keys.p256dh,
      keysAuth: subscription.keys.auth,
      latitude,
      longitude,
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      keysP256dh: subscription.keys.p256dh,
      keysAuth: subscription.keys.auth,
      latitude,
      longitude,
    },
  });
}

/**
 * Remove a push subscription
 */
export async function removeSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  await prisma.pushSubscription.deleteMany({
    where: {
      userId,
      endpoint,
    },
  });
}

/**
 * Send notification to a single subscription
 */
async function sendToSubscription(
  subscription: { endpoint: string; keysP256dh: string; keysAuth: string },
  payload: NotificationPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keysP256dh,
          auth: subscription.keysAuth,
        },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (error: unknown) {
    const webPushError = error as { statusCode?: number };
    if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: subscription.endpoint },
      }).catch(() => {});
    }
    console.error('Failed to send notification:', error);
    return false;
  }
}

/**
 * Send notification to a specific user
 */
export async function sendToUser(
  userId: string,
  payload: NotificationPayload
): Promise<number> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  let successCount = 0;
  for (const sub of subscriptions) {
    const success = await sendToSubscription(sub, payload);
    if (success) successCount++;
  }

  return successCount;
}

/**
 * Send notification to users within a radius of a location
 */
export async function sendToNearbyUsers(
  eventLat: number,
  eventLng: number,
  payload: NotificationPayload,
  radiusKm: number = 10,
  excludeUserId?: string
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...(excludeUserId && { userId: { not: excludeUserId } }),
    },
  });

  const nearbySubscriptions = subscriptions.filter((sub) => {
    if (sub.latitude === null || sub.longitude === null) return false;
    const distance = haversineDistance(
      eventLat,
      eventLng,
      sub.latitude,
      sub.longitude
    );
    return distance <= radiusKm;
  });

  // Deduplicate by userId
  const userSubscriptions = new Map<string, typeof nearbySubscriptions[0]>();
  for (const sub of nearbySubscriptions) {
    if (!userSubscriptions.has(sub.userId)) {
      userSubscriptions.set(sub.userId, sub);
    }
  }

  let sent = 0;
  let failed = 0;

  for (const sub of userSubscriptions.values()) {
    const success = await sendToSubscription(sub, payload);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Get VAPID public key for client
 */
export function getVapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY || '';
}
