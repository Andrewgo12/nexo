export const TRIP_REMINDER_WINDOW_MS = 30 * 60 * 1000;

const REMINDER_STORAGE_PREFIX = 'viajau-trip-reminders-v1:';
const REMINDER_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_STORED_REMINDERS = 100;

export function getTripsNeedingReminder(upcomingTrips, now = Date.now()) {
  return upcomingTrips
    .filter((trip) => trip.departureAt > now && trip.departureAt <= now + TRIP_REMINDER_WINDOW_MS)
    .map((trip) => ({
      key: `${trip.id}:${trip.departureAt}`,
      tripId: String(trip.id),
      departureAt: trip.departureAt,
    }));
}

function readStoredReminders(storage, userId, now) {
  const serialized = storage.getItem(`${REMINDER_STORAGE_PREFIX}${userId}`);
  if (serialized === null) return [];

  let reminders;
  try {
    reminders = JSON.parse(serialized);
  } catch (error) {
    throw new Error('El registro local de recordatorios está dañado.', { cause: error });
  }
  if (!Array.isArray(reminders)) {
    throw new TypeError('El registro local de recordatorios tiene un formato inválido.');
  }

  return reminders.filter((reminder) => (
    reminder
    && typeof reminder.key === 'string'
    && Number.isFinite(reminder.sentAt)
    && reminder.sentAt >= now - REMINDER_RETENTION_MS
  ));
}

export function hasDeliveredTripReminder(storage, userId, key, now = Date.now()) {
  return readStoredReminders(storage, userId, now).some((reminder) => reminder.key === key);
}

export function recordDeliveredTripReminder(storage, userId, key, now = Date.now()) {
  const reminders = readStoredReminders(storage, userId, now);
  if (reminders.some((reminder) => reminder.key === key)) return false;

  reminders.push({ key, sentAt: now });
  storage.setItem(
    `${REMINDER_STORAGE_PREFIX}${userId}`,
    JSON.stringify(reminders.slice(-MAX_STORED_REMINDERS)),
  );
  return true;
}
