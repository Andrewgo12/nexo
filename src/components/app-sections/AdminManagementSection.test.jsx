import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminManagementSection from './AdminManagementSection';

describe('AdminManagementSection', () => {
  it('describes role scope and operational limits instead of claiming checklist completion', () => {
    render(
      <AdminManagementSection
        adminCatalog={[]}
        adminCatalogForm={{ type: 'campus', name: '' }}
        adminDashboardError=""
        adminDashboardLoading={false}
        adminFeedVersion=""
        adminIncidentMeta={{ total: 0, current_page: 1, last_page: 1 }}
        adminIncidentStatus="all"
        adminIncidents={[]}
        adminLatestFeed={null}
        adminManagementAction=""
        adminManagementError=""
        adminManagementLoading={false}
        adminSelectedUniversity=""
        adminUniversities={[]}
        adminUserFilters={{ status: '', verification: '' }}
        adminUserMeta={{ total: 0, current_page: 1, last_page: 1 }}
        adminUserSearch=""
        adminUsers={[]}
        authUser={{ role: 'university', university: 'UNIAJC' }}
        catalogTypes={[{ value: 'campus', label: 'Sede' }]}
        createAdminCatalogEntry={vi.fn()}
        currentAdminDashboard={null}
        deactivateAdminCatalogEntry={vi.fn()}
        exportAdminAnalytics={vi.fn()}
        field={{}}
        saveAdminUser={vi.fn()}
        setAdminCatalogForm={vi.fn()}
        setAdminFeedVersion={vi.fn()}
        setAdminIncidentPage={vi.fn()}
        setAdminIncidentStatus={vi.fn()}
        setAdminRoutesFile={vi.fn()}
        setAdminSelectedUniversity={vi.fn()}
        setAdminStopsFile={vi.fn()}
        setAdminUserFilters={vi.fn()}
        setAdminUserSearch={vi.fn()}
        submitAdminTransitFeed={vi.fn()}
      />,
    );

    expect(screen.getByText('Alcance y límites administrativos')).toBeTruthy();
    expect(screen.getByText(/respeta[n]? el alcance global del rol administrador o el institucional asignado/i)).toBeTruthy();
    expect(screen.getByText(/no certifican la operación o la cobertura de producción/i)).toBeTruthy();
    expect(screen.queryByText(/Checklist del módulo 7/)).toBeNull();
  });
});
