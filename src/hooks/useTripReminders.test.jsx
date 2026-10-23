import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useTripReminders from './useTripReminders';

const deliveredNotifications = [];

function MockNotification(title, options) {
  deliveredNotifications.push({ title, options });
}

MockNotification.permission = 'granted';

function makeState(overrides = {}) {
  return {
    authUser: { id: 42, role: 'student' },
    dashboardTrips: { offers: [], requests: [] },
    isEmailVerified: true,
    isLoggedIn: true,
    notifications: [{ id: 'departure-reminder', active: true }],
    setToast: vi.fn(),
    ...overrides,
  };
}

function tripDepartingAt(timestamp, id = 7) {
  const departure = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, '0');
  return {
    id,
    status: 'oferta-activa',
    departure_date: `${departure.getFullYear()}-${pad(departure.getMonth() + 1)}-${pad(departure.getDate())}`,
    departure_time: `${pad(departure.getHours())}:${pad(departure.getMinutes())}`,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
  deliveredNotifications.length = 0;
});

describe('useTripReminders', () => {
  it('notifies once for an upcoming trip without exposing its route', () => {
    vi.useFakeTimers();
    const now = new Date(2026, 9, 22, 10, 0).getTime();
    vi.setSystemTime(now);
    vi.stubGlobal('Notification', MockNotification);
    const trip = tripDepartingAt(now + 10 * 60_000);
    const departureAt = new Date(`${trip.departure_date}T${trip.departure_time}:00`).getTime();
    const state = makeState({
      dashboardTrips: {
        offers: [{
          ...trip,
          origin: 'Private origin',
          destination: 'Private destination',
        }],
        requests: [],
      },
    });
    const { unmount } = renderHook(() => useTripReminders(state));

    expect(deliveredNotifications).toEqual([{
      title: 'Tu viaje es pronto',
      options: {
        body: 'Tienes un viaje programado dentro de 30 minutos. Abre ViajaU para revisar los detalles.',
        tag: `viajau-trip-7:${departureAt}`,
        renotify: false,
      },
    }]);
    expect(deliveredNotifications[0].options.body).not.toContain('Private');
    expect(localStorage.getItem('viajau-trip-reminders-v1:42')).toContain(`"key":"7:${departureAt}"`);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(deliveredNotifications).toHaveLength(1);
    unmount();
  });

  it('does not notify when the preference, permission, or account is unavailable', () => {
    vi.stubGlobal('Notification', Object.assign(function () {}, { permission: 'denied' }));
    renderHook(() => useTripReminders(makeState({
      notifications: [{ id: 'departure-reminder', active: false }],
    })));
    renderHook(() => useTripReminders(makeState({
      authUser: { id: 42, role: 'admin' },
    })));
    expect(deliveredNotifications).toHaveLength(0);
  });

  it('waits until departure is within 30 minutes and detects it on the next check', () => {
    vi.useFakeTimers();
    const now = new Date(2026, 9, 22, 10, 0).getTime();
    vi.setSystemTime(now);
    vi.stubGlobal('Notification', MockNotification);
    const state = makeState({
      dashboardTrips: {
        offers: [tripDepartingAt(now + 31 * 60_000)],
        requests: [],
      },
    });
    const { unmount } = renderHook(() => useTripReminders(state));

    expect(deliveredNotifications).toHaveLength(0);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(deliveredNotifications).toHaveLength(1);
    unmount();
  });
});
