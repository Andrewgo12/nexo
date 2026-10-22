import { updateAdminUser, createInstitutionalCatalogEntry, deactivateInstitutionalCatalogEntry, importTransitFeed, moderateAdminReport } from '../services/authApi';

export default function useAdminActions(state, helpers = {}) {
  const { adminCatalogForm, adminFeedVersion, adminRoutesFile, adminSelectedUniversity, adminStopsFile, authUser, setAdminCatalogForm, setAdminFeedVersion, setAdminLatestFeed, setAdminManagementAction, setAdminManagementError, setAdminManagementRefresh, setAdminRoutesFile, setAdminStopsFile, setReputationAction, setReputationError, setReputationRefresh, setToast } = state;
  const { currentAdminDashboard } = helpers;

  const refreshAdminManagement = () => setAdminManagementRefresh((value) => value + 1)

  const saveAdminUser = async (user, changes) => {
      setAdminManagementAction(`user-${user.id}`);
      setAdminManagementError('');
      try {
        await updateAdminUser(user.id, changes);
        refreshAdminManagement();
        setToast('Cuenta estudiantil actualizada.');
      } catch (error) {
        setAdminManagementError(error.message || 'No fue posible actualizar la cuenta.');
      } finally {
        setAdminManagementAction('');
      }
    }

  const createAdminCatalogEntry = async (event) => {
      event.preventDefault();
      setAdminManagementAction('catalog');
      setAdminManagementError('');
      try {
        await createInstitutionalCatalogEntry({
          ...(authUser?.role === 'admin' ? { university: adminSelectedUniversity } : {}),
          ...adminCatalogForm,
        });
        setAdminCatalogForm((current) => ({ ...current, name: '' }));
        refreshAdminManagement();
        setToast('Elemento del catálogo institucional creado.');
      } catch (error) {
        setAdminManagementError(error.message || 'No fue posible crear el elemento.');
      } finally {
        setAdminManagementAction('');
      }
    }

  const deactivateAdminCatalogEntry = async (entry) => {
      setAdminManagementAction(`catalog-${entry.id}`);
      setAdminManagementError('');
      try {
        await deactivateInstitutionalCatalogEntry(entry.id);
        refreshAdminManagement();
        setToast('Elemento del catálogo desactivado.');
      } catch (error) {
        setAdminManagementError(error.message || 'No fue posible desactivar el elemento.');
      } finally {
        setAdminManagementAction('');
      }
    }

  const submitAdminTransitFeed = async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!adminStopsFile || !adminRoutesFile) {
        setAdminManagementError('Selecciona stops.txt y routes.txt antes de importar.');
        return;
      }
      setAdminManagementAction('gtfs');
      setAdminManagementError('');
      try {
        const response = await importTransitFeed({
          feed_version: adminFeedVersion,
          stops: adminStopsFile,
          routes: adminRoutesFile,
        });
        setAdminLatestFeed(response.data);
        setAdminStopsFile(null);
        setAdminRoutesFile(null);
        setAdminFeedVersion('');
        form.reset();
        setToast('Feed GTFS validado e importado. La interfaz no afirmará horarios activos.');
      } catch (error) {
        setAdminManagementError(error.message || 'No fue posible importar el feed GTFS.');
      } finally {
        setAdminManagementAction('');
      }
    }

  const moderateReputationReport = async (reportId, status) => {
      const resolutionNote = window.prompt('Nota de resolución (opcional):');
      if (resolutionNote === null) return;
      setReputationAction(`report-${reportId}`);
      setReputationError('');
      try {
        await moderateAdminReport(reportId, { status, resolution_note: resolutionNote });
        setReputationRefresh((value) => value + 1);
        setToast('Reporte moderado.');
      } catch (error) {
        setReputationError(error.message || 'No fue posible actualizar el reporte.');
      } finally {
        setReputationAction('');
      }
    }

  const exportAdminAnalytics = () => {
      if (!currentAdminDashboard) return;
      const contents = JSON.stringify({
        exported_at: new Date().toISOString(),
        scope: currentAdminDashboard.scope,
        stats: currentAdminDashboard.stats,
        distribution: currentAdminDashboard.distribution,
      }, null, 2);
      const file = new Blob([contents], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `viajau-analytics-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setToast('Se descargaron métricas agregadas sin datos personales.');
    }

  return {
    refreshAdminManagement,
    saveAdminUser,
    createAdminCatalogEntry,
    deactivateAdminCatalogEntry,
    submitAdminTransitFeed,
    moderateReputationReport,
    exportAdminAnalytics,
  };

}
