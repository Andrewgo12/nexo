import { afterEach, describe, expect, it, vi } from 'vitest';
import { readAppData, writeAppData } from './appDatabase';

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
});
