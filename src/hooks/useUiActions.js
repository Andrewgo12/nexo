import { readAppData, writeAppData } from '../services/appDatabase';

function persistPreferences(updates, setToast) {
  try {
    writeAppData({ ...readAppData(), ...updates });
    return true;
  } catch (error) {
    console.error('No fue posible guardar las preferencias en este navegador.', error);
    setToast('No se pudieron guardar las preferencias en este navegador.');
    return false;
  }
}

export default function useUiActions(state) {
  const {
    advancedMode,
    executionState,
    notifications,
    setAdvancedMode,
    setExecutionState,
    setModal,
    setNotifications,
    setToast,
  } = state;

  const openModal = (payload) => setModal(payload);

  const closeModal = () => setModal(null);

  const toggleNotification = (notificationId) => {
    if (typeof notificationId !== 'string' || !notifications.some((item) => item.id === notificationId)) {
      throw new RangeError('La preferencia de notificación no existe.');
    }
    const nextNotifications = notifications.map((item) => (
      item.id === notificationId ? { ...item, active: !item.active } : item
    ));

    if (!persistPreferences({
      notifications: nextNotifications,
      advancedMode,
      executionState,
    }, setToast)) return;
    setNotifications(nextNotifications);
    setToast('Preferencia guardada en este navegador; no se programan ni envían alertas.');
  };

  const toggleAdvancedFeature = (key) => {
    if (!Object.hasOwn(advancedMode, key)) {
      throw new RangeError('La opción avanzada no existe.');
    }
    const nextAdvancedMode = { ...advancedMode, [key]: !advancedMode[key] };
    if (!persistPreferences({
      notifications,
      advancedMode: nextAdvancedMode,
      executionState,
    }, setToast)) return;
    setAdvancedMode(nextAdvancedMode);
    setToast('Configuración de recomendación avanzada actualizada.');
  };

  const toggleExecutionTask = (id) => {
    if (!executionState.some((item) => item.id === id)) {
      throw new RangeError('La tarea del checklist no existe.');
    }
    const nextExecutionState = executionState.map((item) => (
      item.id === id ? { ...item, done: !item.done } : item
    ));
    if (!persistPreferences({
      notifications,
      advancedMode,
      executionState: nextExecutionState,
    }, setToast)) return;
    setExecutionState(nextExecutionState);
    setToast('Estado del checklist actualizado.');
  };

  return {
    openModal,
    closeModal,
    toggleNotification,
    toggleAdvancedFeature,
    toggleExecutionTask,
  };
}
