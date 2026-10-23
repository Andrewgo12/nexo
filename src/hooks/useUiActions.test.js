import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_APP_DATA, readAppData } from '../services/appDatabase';
import useUiActions from './useUiActions';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function createState() {
  return {
    advancedMode: DEFAULT_APP_DATA.advancedMode,
    authUser: { id: 7, role: 'student' },
    executionState: DEFAULT_APP_DATA.executionState,
    isEmailVerified: true,
    isLoggedIn: true,
    notifications: DEFAULT_APP_DATA.notifications,
    setAdvancedMode: vi.fn(),
    setExecutionState: vi.fn(),
    setModal: vi.fn(),
    setNotifications: vi.fn(),
    setToast: vi.fn(),
  };
}

describe('notification preferences', () => {
  it('requests browser permission and persists the departure reminder preference', async () => {
    class MockNotification {
      static permission = 'default';

      static requestPermission = vi.fn().mockResolvedValue('granted');
    }
    vi.stubGlobal('Notification', MockNotification);
    const state = createState();
    await useUiActions(state).toggleNotification('departure-reminder');

    expect(MockNotification.requestPermission).toHaveBeenCalledOnce();
    expect(state.setNotifications).toHaveBeenCalledWith([
      { ...DEFAULT_APP_DATA.notifications[0], active: true },
      ...DEFAULT_APP_DATA.notifications.slice(1),
    ]);
    expect(readAppData().notifications[0].active).toBe(true);
    expect(state.setToast).toHaveBeenCalledWith(
      'Recordatorio activo: se mostrará dentro de 30 minutos de la salida mientras ViajaU esté abierta.',
    );
  });

  it('does not enable departure reminders when browser permission is denied', async () => {
    class MockNotification {
      static permission = 'denied';

      static requestPermission = vi.fn();
    }
    vi.stubGlobal('Notification', MockNotification);
    const state = createState();
    await useUiActions(state).toggleNotification('departure-reminder');

    expect(MockNotification.requestPermission).not.toHaveBeenCalled();
    expect(state.setNotifications).not.toHaveBeenCalled();
    expect(state.setToast).toHaveBeenCalledWith(
      'El navegador bloqueó las notificaciones. Cambia el permiso del sitio para activar recordatorios.',
    );
  });

  it('does not enable departure reminders when browser notifications are unsupported', async () => {
    vi.stubGlobal('Notification', undefined);
    const state = createState();

    await useUiActions(state).toggleNotification('departure-reminder');

    expect(state.setNotifications).not.toHaveBeenCalled();
    expect(state.setToast).toHaveBeenCalledWith(
      'Este navegador no permite notificaciones locales; la preferencia no se activó.',
    );
  });

  it('restricts departure reminders to verified student accounts', async () => {
    class MockNotification {
      static permission = 'granted';
    }
    vi.stubGlobal('Notification', MockNotification);
    const state = createState();
    state.isEmailVerified = false;

    await useUiActions(state).toggleNotification('departure-reminder');

    expect(state.setNotifications).not.toHaveBeenCalled();
    expect(state.setToast).toHaveBeenCalledWith(
      'El recordatorio de salida solo está disponible para estudiantes con sesión y correo verificados.',
    );
  });

  it('reports storage failures instead of claiming a preference was saved', async () => {
    class MockNotification {
      static permission = 'granted';
    }
    vi.stubGlobal('Notification', MockNotification);
    const state = createState();
    const error = new DOMException('Storage unavailable', 'SecurityError');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw error;
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await useUiActions(state).toggleNotification('departure-reminder');

    expect(consoleError).toHaveBeenCalledWith(
      'No fue posible guardar las preferencias en este navegador.',
      error,
    );
    expect(state.setToast).toHaveBeenCalledWith(
      'No se pudieron guardar las preferencias en este navegador.',
    );
    expect(state.setNotifications).not.toHaveBeenCalled();
  });

  it('rejects ids that do not identify a preference', async () => {
    const state = createState();
    const actions = useUiActions(state);

    await expect(actions.toggleNotification('missing-preference')).rejects.toThrow(RangeError);
    await expect(actions.toggleNotification(1)).rejects.toThrow(RangeError);

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
