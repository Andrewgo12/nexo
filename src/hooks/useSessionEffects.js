import { useEffect } from 'react';
import { clearAuthToken, getCurrentAccount } from '../services/authApi';
import { writeAppData } from '../services/appDatabase';

export default function useSessionEffects(state, helpers = {}) {
  const { active, advancedMode, executionState, notifications, setIsBooting, setIsLoggedIn, setToast } = state;
  const { applyAuthenticatedUser } = helpers;

  useEffect(() => {
      let cancelled = false;
      const restoreSession = async () => {
        if (new URLSearchParams(window.location.search).get('verified') === '1') {
          setToast('Correo institucional verificado. Ya puedes iniciar sesión.');
        }
        clearAuthToken();
        try {
          const { user } = await getCurrentAccount();
          if (!cancelled) {
            applyAuthenticatedUser(user);
            setIsLoggedIn(true);
          }
        } catch (error) {
          if (!cancelled && error.status !== 401) setToast(error.message);
        }
        if (!cancelled) setIsBooting(false);
      };
      restoreSession();
      return () => { cancelled = true; };
    }, [applyAuthenticatedUser, setToast, setIsLoggedIn, setIsBooting]);

  useEffect(() => {
      try {
        writeAppData({
          notifications: notifications,
          advancedMode: advancedMode,
          executionState: executionState,
          activeTab: active,
        });
      } catch (error) {
        console.error('No se pudieron guardar las preferencias de ViajaU.', error);
        setToast('No se pudieron guardar tus preferencias en este navegador. Revisa el espacio disponible o la configuración de almacenamiento.');
      }
    }, [notifications, advancedMode, executionState, active, setToast]);
}
