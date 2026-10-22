import { useCallback } from 'react';
import { universities } from '../config/appConfig';
import useAdminActions from './useAdminActions';
import useAuthActions from './useAuthActions';
import useDashboardActions from './useDashboardActions';
import useInsuranceActions from './useInsuranceActions';
import useReputationActions from './useReputationActions';
import useRouteActions from './useRouteActions';
import useSafetyActions from './useSafetyActions';
import useTripActions from './useTripActions';
import useUiActions from './useUiActions';

export default function useAppActions(state, viewModel) {
  const { setAuthUser, setEmail, setIsEmailVerified, setStudent, setUni, setActive } = state;
  const applyAuthenticatedUser = useCallback((user) => {
    setAuthUser(user);
    const matchingUniversity = universities.find((item) => item.name === user.university);
    if (matchingUniversity) setUni(matchingUniversity);
    setStudent((current) => ({
      ...current,
      name: user.name,
      email: user.email,
      career: user.career || '',
      semester: user.semester || '',
      shift: user.shift || '',
      neighborhood: user.neighborhood || '',
      emergency: user.emergency_contact || '',
      trusted_contact_email: user.trusted_contact_email || '',
      trusted_contact_phone: user.trusted_contact_phone || '',
      trusted_contact_consent: Boolean(user.trusted_contact_consent),
    }));
    setEmail(user.email);
    setIsEmailVerified(Boolean(user.email_verified_at));
    if (user.role === 'security') setActive('safety');
    else if (!['admin', 'university'].includes(user.role)) setActive('auth');
  }, [setStudent, setEmail, setUni, setIsEmailVerified, setActive, setAuthUser]);

  const ui = useUiActions(state);
  const admin = useAdminActions(state, { currentAdminDashboard: viewModel.currentAdminDashboard });
  const reputation = useReputationActions(state);
  const dashboard = useDashboardActions(state);
  const insurance = useInsuranceActions(state);
  const routes = useRouteActions(state);
  const trips = useTripActions(state, {
    geofenceRouteFingerprint: viewModel.geofenceRouteFingerprint,
    hasCurrentGeofencePreview: viewModel.hasCurrentGeofencePreview,
  });
  const safety = useSafetyActions(state, { closeModal: ui.closeModal });
  const auth = useAuthActions(state, {
    applyAuthenticatedUser,
    closeModal: ui.closeModal,
    resetParams: new URLSearchParams(window.location.search),
  });

  return {
    applyAuthenticatedUser,
    ...ui,
    ...admin,
    ...reputation,
    ...dashboard,
    ...insurance,
    ...routes,
    ...trips,
    ...safety,
    ...auth,
  };
}
