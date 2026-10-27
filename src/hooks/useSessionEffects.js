import { useEffect } from 'react';
import { clearAuthToken, getCurrentAccount } from '../services/authApi';
import { writeAppData } from '../services/appDatabase';

export default function useSessionEffects(state, helpers = {}) {
  const {
    active,
    executionState,
    notifications,
    privacy,
    setIsBooting,
    setIsLoggedIn,
    setToast,
    setActive,
  } = state;
  const { applyAuthenticatedUser } = helpers;

  useEffect(() => {
      let cancelled = false;
      const restoreSession = async () => {
        if (new URLSearchParams(window.location.search).get('verified') === '1') {
          setToast('Correo institucional verificado. Ya puedes iniciar sesión.');
        }

        // Modo demostración temporal para revisar todas las vistas sin depender de XAMPP/PHP.
        // Se puede desactivar definiendo VITE_DEMO_MODE=false en el entorno de Vite.
        if (import.meta.env.VITE_DEMO_MODE !== 'false') {
          if (!cancelled) {
            applyAuthenticatedUser({
              id: 'demo-user',
              name: 'Usuario demo',
              email: 'demo@uniajc.edu.co',
              role: 'admin',
              email_verified_at: new Date().toISOString(),
            });
            setIsLoggedIn(true);
            setActive('routes');
            setIsBooting(false);
          }
          return;
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
          executionState: executionState,
          activeTab: active,
          privacy,
        });
      } catch (error) {
        console.error('No se pudieron guardar las preferencias de ViajaU.', error);
        setToast('No se pudieron guardar tus preferencias en este navegador. Revisa el espacio disponible o la configuración de almacenamiento.');
      }
    }, [notifications, executionState, active, privacy, setToast]);
}
