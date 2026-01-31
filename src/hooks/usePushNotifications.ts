"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import {
  isPushSupported,
  getPermissionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from '@/lib/push-notifications';

export type PushStatus = 'loading' | 'unsupported' | 'denied' | 'prompt' | 'subscribed' | 'unsubscribed';

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check initial status
  useEffect(() => {
    async function checkStatus() {
      if (!isPushSupported()) {
        setStatus('unsupported');
        return;
      }

      const permission = getPermissionStatus();

      if (permission === 'denied') {
        setStatus('denied');
        return;
      }

      if (permission === 'default') {
        setStatus('prompt');
        return;
      }

      // Permission granted, check if subscribed
      const subscription = await getCurrentSubscription();
      setStatus(subscription ? 'subscribed' : 'unsubscribed');
    }

    checkStatus();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Please sign in to enable notifications');
      }

      // Get user's location
      let latitude: number | undefined;
      let longitude: number | undefined;

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              maximumAge: 300000, // 5 minutes cache
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch {
          console.log('Location not available, proceeding without it');
        }
      }

      await subscribeToPush(session.access_token, latitude, longitude);
      setStatus('subscribed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(message);

      // Update status based on error
      const permission = getPermissionStatus();
      if (permission === 'denied') {
        setStatus('denied');
      } else {
        setStatus('unsubscribed');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Please sign in');
      }

      await unsubscribeFromPush(session.access_token);
      setStatus('unsubscribed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    status,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    isSupported: status !== 'unsupported',
    isSubscribed: status === 'subscribed',
    canSubscribe: status === 'prompt' || status === 'unsubscribed',
  };
}
