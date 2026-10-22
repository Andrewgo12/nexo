export default function useUiActions(state) {
  const { setAdvancedMode, setExecutionState, setModal, setNotifications, setToast } = state;

  const openModal = (payload) => setModal(payload)

  const closeModal = () => setModal(null)

  const toggleNotification = (index) => {
      setNotifications((current) => current.map((item, idx) => idx === index ? { ...item, active: !item.active } : item));
      setToast('Recordatorio actualizado correctamente.');
    }

  const toggleAdvancedFeature = (key) => {
      setAdvancedMode((current) => ({ ...current, [key]: !current[key] }));
      setToast('Configuración de recomendación avanzada actualizada.');
    }

  const toggleExecutionTask = (id) => {
      setExecutionState((current) => current.map((item) => item.id === id ? { ...item, done: !item.done } : item));
      setToast('Estado del checklist actualizado.');
    }

  return {
    openModal,
    closeModal,
    toggleNotification,
    toggleAdvancedFeature,
    toggleExecutionTask,
  };

}
