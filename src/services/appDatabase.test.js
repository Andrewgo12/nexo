import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_APP_DATA, readAppData, writeAppData } from './appDatabase';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('appDatabase', () => {
  it('does not write while reading sanitized saved preferences', () => {
    localStorage.setItem('viajau-local-db-v1', JSON.stringify({ activeTab: 'dashboard' }));
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    expect(readAppData().activeTab).toBe('dashboard');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('propagates storage write failures so the caller can report them', () => {
    const storageError = new DOMException('Storage quota exceeded', 'QuotaExceededError');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw storageError;
    });

    expect(() => writeAppData({ activeTab: 'dashboard' })).toThrow(storageError);
  });

  it('keeps preferences attached to stable notification ids after reordering', () => {
    localStorage.setItem('viajau-local-db-v1', JSON.stringify({
      notifications: [
        { id: 'route-change', active: true },
        { id: 'departure-reminder', active: false },
      ],
    }));

    const notifications = readAppData().notifications;

    expect(notifications.find(({ id }) => id === 'route-change').active).toBe(true);
    expect(notifications.find(({ id }) => id === 'departure-reminder').active).toBe(false);
    expect(notifications.find(({ id }) => id === 'arrival-check-in').active).toBe(false);
  });

  it('continues reading preferences saved before notification ids existed', () => {
    localStorage.setItem('viajau-local-db-v1', JSON.stringify({
      notifications: [
        { active: true },
        { active: false },
        { active: true },
      ],
    }));

    expect(readAppData().notifications.map(({ active }) => active)).toEqual([
      true,
      false,
      true,
      DEFAULT_APP_DATA.notifications[3].active,
    ]);
  });

  it('persists only supported privacy preference values', () => {
    writeAppData({ privacy: 'Privacidad máxima' });
    expect(readAppData().privacy).toBe('Privacidad máxima');

    writeAppData({ privacy: 'Share exact home address' });
    expect(readAppData().privacy).toBe(DEFAULT_APP_DATA.privacy);
  });
});
