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
    authUser,
    isEmailVerified,
    isLoggedIn,
    setAdvancedMode,
    setExecutionState,
    setModal,
    setNotifications,
    setToast,
  } = state;

  const openModal = (payload) => setModal(payload);

  const closeModal = () => setModal(null);

  const toggleNotification = async (notificationId) => {
    if (typeof notificationId !== 'string' || !notifications.some((item) => item.id === notificationId)) {
      throw new RangeError('La preferencia de notificación no existe.');
    }
    const notification = notifications.find((item) => item.id === notificationId);
    const enabling = !notification.active;
    if (notificationId === 'departure-reminder' && enabling) {
      if (!isLoggedIn || !isEmailVerified || authUser?.role !== 'student') {
        setToast('El recordatorio de salida solo está disponible para estudiantes con sesión y correo verificados.');
        return false;
      }
      if (typeof window === 'undefined' || !window.Notification) {
        setToast('Este navegador no permite notificaciones locales; la preferencia no se activó.');
        return false;
      }
      if (window.Notification.permission === 'denied') {
        setToast('El navegador bloqueó las notificaciones. Cambia el permiso del sitio para activar recordatorios.');
        return false;
      }
      try {
        const permission = window.Notification.permission === 'granted'
          ? 'granted'
          : await window.Notification.requestPermission();
        if (permission !== 'granted') {
          setToast('No se concedió permiso para notificaciones; la preferencia no se activó.');
          return false;
        }
      } catch (error) {
        console.error('No fue posible solicitar permiso para recordatorios locales.', error);
        setToast('No fue posible solicitar permiso para notificaciones del navegador.');
        return false;
      }
    }
    const nextNotifications = notifications.map((item) => (
      item.id === notificationId ? { ...item, active: !item.active } : item
    ));

    if (!persistPreferences({
      notifications: nextNotifications,
      advancedMode,
      executionState,
    }, setToast)) return false;
    setNotifications(nextNotifications);
    setToast(notificationId === 'departure-reminder' && enabling
      ? 'Recordatorio activo: se mostrará dentro de 30 minutos de la salida mientras ViajaU esté abierta.'
      : notificationId === 'departure-reminder'
        ? 'Recordatorio local de salida desactivado.'
        : 'Preferencia guardada; no programa ni envía alertas externas.');
    return true;
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
