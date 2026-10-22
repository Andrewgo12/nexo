import { getCurrentDeviceLocation } from '../services/locationApi';
import { createSafetyAlert, resolveSafetyAlert } from '../services/authApi';

export default function useSafetyActions(state, helpers = {}) {
  const { includeSafetyLocation, setAlertFeed, setSafetyActionLoading, setSafetyError, setSafetyLocationError, setSafetyRefreshKey, setToast } = state;
  const { closeModal } = helpers;

  const activatePanic = async (attachLocation = includeSafetyLocation) => {
      setSafetyActionLoading('panic');
      setSafetyError('');
      try {
        let location = {};
        if (attachLocation) {
          try {
            const currentLocation = await getCurrentDeviceLocation();
            location = {
              latitude: currentLocation.lat,
              longitude: currentLocation.lng,
              ...(currentLocation.accuracy !== null && currentLocation.accuracy <= 100000
                ? { accuracy_meters: Math.round(currentLocation.accuracy) }
                : {}),
            };
            setSafetyLocationError('');
          } catch (error) {
            setSafetyLocationError(error.message || 'No fue posible obtener el GPS.');
            return false;
          }
        }

        const response = await createSafetyAlert(location);
        setAlertFeed((current) => [response.data, ...current]);
        const deliveryStatuses = response.data.notification_deliveries || [];
        const pendingDeliveries = deliveryStatuses.filter((delivery) => delivery.status === 'pending').length;
        const failedDeliveries = deliveryStatuses.filter((delivery) => ['failed', 'skipped'].includes(delivery.status)).length;
        setToast(pendingDeliveries
          ? `SOS registrado. ${pendingDeliveries} aviso(s) a tu contacto quedaron en cola.`
          : failedDeliveries
            ? `SOS registrado, pero ${failedDeliveries} canal(es) de contacto no están configurados o fallaron. El equipo de seguridad puede ver la alerta.`
            : 'SOS registrado para el equipo de seguridad. La notificación externa requiere consentimiento del contacto y configuración de proveedores.');
        return true;
      } catch (error) {
        setSafetyError(error.message || 'No fue posible registrar la alerta de emergencia.');
        throw error;
      } finally {
        setSafetyActionLoading('');
      }
    }

  const confirmEmergency = async (sendWithoutLocation = false) => {
      try {
        const registered = await activatePanic(sendWithoutLocation ? false : includeSafetyLocation);
        if (registered) closeModal();
      } catch {
        setToast('No se pudo registrar el SOS. Revisa el error mostrado en Seguridad.');
      }
    }

  const handleResolveSafetyAlert = async (alertId) => {
      setSafetyActionLoading(`resolve-${alertId}`);
      setSafetyError('');
      try {
        await resolveSafetyAlert(alertId);
        setSafetyRefreshKey((current) => current + 1);
        setToast('Alerta marcada como atendida.');
      } catch (error) {
        setSafetyError(error.message || 'No fue posible actualizar la alerta.');
      } finally {
        setSafetyActionLoading('');
      }
    }

  return {
    activatePanic,
    confirmEmergency,
    handleResolveSafetyAlert,
  };

}
