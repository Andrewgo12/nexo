import { useEffect, useRef } from 'react';
import { buildUpcomingTrips } from '../services/dashboardSummary';
import { hasDeliveredTripReminder, recordDeliveredTripReminder, getTripsNeedingReminder } from '../services/tripReminders';

export default function useTripReminders(state) {
  const { authUser, dashboardTrips, isEmailVerified, isLoggedIn, notifications, setToast } = state;
  const inSessionReminders = useRef(new Set());
  const storageErrorReported = useRef(false);

  useEffect(() => {
    const departureReminderEnabled = notifications.some(
      (notification) => notification.id === 'departure-reminder' && notification.active,
    );
    if (
      !isLoggedIn
      || !isEmailVerified
      || authUser?.role !== 'student'
      || !authUser?.id
      || !departureReminderEnabled
      || typeof window === 'undefined'
      || !window.Notification
      || window.Notification.permission !== 'granted'
    ) return undefined;

    const userId = String(authUser.id);
    const checkUpcomingTrips = () => {
      const now = Date.now();
      const upcomingTrips = buildUpcomingTrips(dashboardTrips, now);
      for (const reminder of getTripsNeedingReminder(upcomingTrips, now)) {
        const sessionKey = `${userId}:${reminder.key}`;
        if (inSessionReminders.current.has(sessionKey)) continue;
        try {
          if (hasDeliveredTripReminder(window.localStorage, userId, reminder.key, now)) {
            inSessionReminders.current.add(sessionKey);
            continue;
          }

          new window.Notification('Tu viaje es pronto', {
            body: 'Tienes un viaje programado dentro de 30 minutos. Abre ViajaU para revisar los detalles.',
            tag: `viajau-trip-${reminder.key}`,
            renotify: false,
          });
          inSessionReminders.current.add(sessionKey);
          recordDeliveredTripReminder(window.localStorage, userId, reminder.key, now);
        } catch (error) {
          console.error('No fue posible emitir el recordatorio de viaje en este navegador.', error);
          if (!storageErrorReported.current) {
            storageErrorReported.current = true;
            setToast('No se pudo emitir o registrar el recordatorio local. Revisa los permisos y el almacenamiento del navegador.');
          }
        }
      }
    };

    checkUpcomingTrips();
    const intervalId = window.setInterval(checkUpcomingTrips, 60_000);
    return () => window.clearInterval(intervalId);
  }, [authUser?.id, authUser?.role, dashboardTrips, isEmailVerified, isLoggedIn, notifications, setToast]);
}
