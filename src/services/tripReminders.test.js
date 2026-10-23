import { describe, expect, it, vi } from 'vitest';
import {
  getTripsNeedingReminder,
  hasDeliveredTripReminder,
  recordDeliveredTripReminder,
  TRIP_REMINDER_WINDOW_MS,
} from './tripReminders';

describe('trip reminders', () => {
  it('selects future departures inside the reminder window only', () => {
    const now = 1_800_000_000_000;
    const upcomingTrips = [
      { id: 1, departureAt: now },
      { id: 2, departureAt: now + 5 * 60_000 },
      { id: 3, departureAt: now + TRIP_REMINDER_WINDOW_MS },
      { id: 4, departureAt: now + TRIP_REMINDER_WINDOW_MS + 1 },
    ];

    expect(getTripsNeedingReminder(upcomingTrips, now)).toEqual([
      { key: `2:${now + 5 * 60_000}`, tripId: '2', departureAt: now + 5 * 60_000 },
      { key: `3:${now + TRIP_REMINDER_WINDOW_MS}`, tripId: '3', departureAt: now + TRIP_REMINDER_WINDOW_MS },
    ]);
  });

  it('persists delivered reminders and avoids duplicates', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };

    expect(hasDeliveredTripReminder(storage, 7, 'trip:time', 1000)).toBe(false);
    expect(recordDeliveredTripReminder(storage, 7, 'trip:time', 1000)).toBe(true);
    storage.getItem.mockReturnValue(storage.setItem.mock.calls[0][1]);

    expect(hasDeliveredTripReminder(storage, 7, 'trip:time', 1001)).toBe(true);
    expect(recordDeliveredTripReminder(storage, 7, 'trip:time', 1001)).toBe(false);
    expect(storage.setItem).toHaveBeenCalledOnce();
  });

  it('expires old reminder keys and reports malformed stored data', () => {
    const storage = {
      getItem: vi.fn(() => JSON.stringify([{ key: 'old', sentAt: 1 }])),
      setItem: vi.fn(),
    };

    expect(hasDeliveredTripReminder(storage, 7, 'old', 10_000_000_000)).toBe(false);
    storage.getItem.mockReturnValue('{');
    expect(() => hasDeliveredTripReminder(storage, 7, 'key', 1000))
      .toThrow('El registro local de recordatorios está dañado.');
  });
});
