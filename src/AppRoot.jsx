import { useMemo } from 'react';
import AuthenticatedShell from './components/app-shell/AuthenticatedShell';
import { initialStudent, universities } from './config/appConfig';
import useAccountDataEffects from './hooks/useAccountDataEffects';
import useAdminEffects from './hooks/useAdminEffects';
import useAppActions from './hooks/useAppActions';
import useAppState from './hooks/useAppState';
import useAppViewModel from './hooks/useAppViewModel';
import useSafetyEffects from './hooks/useSafetyEffects';
import useSearchMatchEffects from './hooks/useSearchMatchEffects';
import useSessionEffects from './hooks/useSessionEffects';
import useTripEffects from './hooks/useTripEffects';
import { readAppData } from './services/appDatabase';

export default function AppRoot() {
  const persisted = useMemo(() => readAppData(), []);
  const state = useAppState(persisted, { initialStudent, universities });
  const viewModel = useAppViewModel(state);
  const actions = useAppActions(state, viewModel);

  useSessionEffects(state, { applyAuthenticatedUser: actions.applyAuthenticatedUser });
  useAdminEffects(state);
  useAccountDataEffects(state);
  useSearchMatchEffects(state, { searchFilters: viewModel.searchFilters });
  useSafetyEffects(state, { safetyTripOptions: viewModel.safetyTripOptions });
  useTripEffects(state);

  return <AuthenticatedShell state={state} actions={actions} viewModel={viewModel} />;
}
