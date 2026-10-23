import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_APP_DATA, readAppData } from '../services/appDatabase';
import useUiActions from './useUiActions';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

function createState() {
  return {
    advancedMode: DEFAULT_APP_DATA.advancedMode,
    executionState: DEFAULT_APP_DATA.executionState,
    notifications: DEFAULT_APP_DATA.notifications,
    setAdvancedMode: vi.fn(),
    setExecutionState: vi.fn(),
    setModal: vi.fn(),
    setNotifications: vi.fn(),
    setToast: vi.fn(),
  };
}

describe('notification preferences', () => {
  it('persists the changed preference in browser storage', () => {
    const state = createState();
    useUiActions(state).toggleNotification('departure-reminder');

    expect(state.setNotifications).toHaveBeenCalledWith([
      { ...DEFAULT_APP_DATA.notifications[0], active: true },
      ...DEFAULT_APP_DATA.notifications.slice(1),
    ]);
    expect(readAppData().notifications[0].active).toBe(true);
    expect(state.setToast).toHaveBeenCalledWith(
      'Preferencia guardada en este navegador; no se programan ni envían alertas.',
    );
  });

  it('reports storage failures instead of claiming the preference was saved', () => {
    const state = createState();
    const error = new DOMException('Storage unavailable', 'SecurityError');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw error;
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    useUiActions(state).toggleNotification('departure-reminder');

    expect(consoleError).toHaveBeenCalledWith(
      'No fue posible guardar las preferencias en este navegador.',
      error,
    );
    expect(state.setToast).toHaveBeenCalledWith(
      'No se pudieron guardar las preferencias en este navegador.',
    );
    expect(state.setNotifications).not.toHaveBeenCalled();
    expect(state.setToast).not.toHaveBeenCalledWith(
      'Preferencia guardada en este navegador; no se programan ni envían alertas.',
    );
  });

  it('rejects ids that do not identify a preference', () => {
    const state = createState();
    const actions = useUiActions(state);

    expect(() => actions.toggleNotification('missing-preference')).toThrow(RangeError);
    expect(() => actions.toggleNotification(1)).toThrow(RangeError);

    expect(state.setNotifications).not.toHaveBeenCalled();
    expect(state.setToast).not.toHaveBeenCalled();
  });

  it('persists advanced settings and checklist changes without claiming alert delivery', () => {
    const state = createState();
    useUiActions(state).toggleAdvancedFeature('night');

    expect(readAppData().advancedMode.night).toBe(false);
    expect(state.setAdvancedMode).toHaveBeenCalledWith({
      ...DEFAULT_APP_DATA.advancedMode,
      night: false,
    });

    state.advancedMode = { ...DEFAULT_APP_DATA.advancedMode, night: false };
    useUiActions(state).toggleExecutionTask('domain-validation');

    expect(readAppData().advancedMode.night).toBe(false);
    expect(readAppData().executionState[0].done).toBe(false);
    expect(state.setExecutionState).toHaveBeenCalledWith([
      { ...DEFAULT_APP_DATA.executionState[0], done: false },
      ...DEFAULT_APP_DATA.executionState.slice(1),
    ]);
    expect(state.setToast).toHaveBeenLastCalledWith('Estado del checklist actualizado.');
  });
});
