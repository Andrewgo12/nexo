import InsuranceMembershipPanel from '../InsuranceMembershipPanel';
import DashboardSection from '../DashboardSection';
import AdminManagementSection from './AdminManagementSection';
import AdvancedSection from './AdvancedSection';
import AlertsSection from './AlertsSection';
import AuthSection from './AuthSection';
import BackendSection from './BackendSection';
import ComplianceSection from './ComplianceSection';
import MatchSection from './MatchSection';
import PrivacySection from './PrivacySection';
import RoadmapSection from './RoadmapSection';
import RoutesSection from './RoutesSection';
import SafetySection from './SafetySection';
import SearchSection from './SearchSection';
import TripManagementSection from './TripManagementSection';
import TrustSection from './TrustSection';
import {
  adminChecklist,
  adminUniversities,
  catalogTypes,
  field,
  formatInsurancePremium,
  insuranceStatusLabel,
  membershipPaymentStatusLabel,
  tripStatusLabels,
  universities,
} from '../../config/appConfig';
import {
  requestTravelSeat,
  stopSharingTripLocation,
  updateTravelOfferStatus,
  updateTravelRequest,
} from '../../services/authApi';

export default function AppSectionContent({ appState: state, actions, viewModel: model }) {
  return (
    <>
      {state.active === 'auth' && (
        <AuthSection
          uni={state.uni}
          universities={universities}
          email={state.email}
          validEmail={model.validEmail}
          student={state.student}
          privacy={state.privacy}
          authUser={state.authUser}
          field={field}
          passwordForm={state.passwordForm}
          onStudentChange={(key, value) => state.setStudent((current) => ({ ...current, [key]: value }))}
          onTrustedContactConsentChange={(consent) => state.setStudent((current) => ({
            ...current,
            trusted_contact_consent: consent,
            ...(consent ? {} : { trusted_contact_email: '', trusted_contact_phone: '' }),
          }))}
          onPrivacyChange={state.setPrivacy}
          onSaveProfile={() => actions.openModal({
            type: 'profile',
            title: 'Guardar perfil',
            accent: '#10b981',
            message: `Se guardarán los datos de perfil de ${state.student.name}, incluida la jornada ${state.student.shift}, el barrio ${state.student.neighborhood} y el contacto de emergencia.`,
            confirmText: 'Guardar cambios',
            onConfirm: actions.confirmProfile,
          })}
          onProfilePhotoSelect={(event) => state.setProfilePhotoFile(event.target.files?.[0] || null)}
          onProfilePhotoUpload={actions.handleProfilePhotoUpload}
          onPasswordChange={(key, value) => state.setPasswordForm((current) => ({ ...current, [key]: value }))}
          onChangePassword={actions.handleChangePassword}
        />
      )}

      {state.active === 'routes' && (
        <RoutesSection
          route={state.route}
          routeLocations={state.routeLocations}
          routeSearchResults={state.routeSearchResults}
          routeSearchLoading={state.routeSearchLoading}
          routeLoading={state.routeLoading}
          routeError={state.routeError}
          routeResult={state.routeResult}
          deviceLocation={state.deviceLocation}
          locationLoading={state.locationLoading}
          summary={model.summary}
          field={field}
          onChangeLocation={(fieldName, value) => {
            state.setRoute((current) => ({ ...current, [fieldName]: value }));
            state.setRouteLocations((current) => ({ ...current, [fieldName]: null }));
            state.setRouteSearchResults((current) => ({ ...current, [fieldName]: [] }));
            state.setRouteResult(null);
          }}
          onSearchLocation={actions.searchRouteLocation}
          onUseDeviceLocation={actions.useDeviceLocation}
          onSelectLocation={actions.selectRouteLocation}
          onChangeMode={(mode) => {
            state.setRoute((current) => ({ ...current, mode }));
            state.setRouteResult(null);
          }}
          onChangeTime={(time) => state.setRoute((current) => ({ ...current, time }))}
          onCalculateRoute={actions.calculateRouteNow}
        />
      )}

      {state.active === 'search' && (
        <SearchSection
          searchState={state.searchState}
          universities={universities}
          filteredResults={model.filteredResults}
          searchLoading={state.searchLoading}
          searchError={state.searchError}
          searchLoaded={state.searchLoaded}
          searchTruncated={state.searchTruncated}
          field={field}
          onFilterChange={actions.updateSearchFilter}
          onLoadMore={() => state.setSearchCursor(state.searchNextCursor)}
          onSortChange={(sort) => state.setSearchState((current) => ({ ...current, sort }))}
          onClearFilters={() => {
            state.setSearchState({
              zone: '',
              time: '',
              faculty: '',
              university: 'Cualquiera',
              transport: 'Cualquiera',
              date_from: '',
              date_to: '',
              sort: 'Compatibilidad',
            });
            state.setSearchCursor(null);
            state.setSearchNextCursor(null);
            state.setSearchResults([]);
            state.setSearchLoading(true);
            state.setSearchError('');
            state.setSearchLoaded(false);
          }}
        />
      )}

      {state.active === 'match' && (
        <MatchSection
          matchLoading={state.matchLoading}
          matchError={state.matchError}
          matchLoaded={state.matchLoaded}
          matchProfileAvailable={state.matchProfileAvailable}
          matchResults={state.matchResults}
          matchTruncated={state.matchTruncated}
          matchCanLoadMore={Boolean(state.matchNextCursor)}
          field={field}
          onLoadMore={() => {
            if (!state.matchLoading && state.matchNextCursor) {
              state.setMatchCursor(state.matchNextCursor);
            }
          }}
          onNavigate={state.setActive}
          onViewOffers={() => {
            state.setSearchState((current) => ({
              ...current,
              zone: state.student.neighborhood || '',
              time: '',
              transport: 'Cualquiera',
              sort: 'Compatibilidad',
            }));
            state.setSearchCursor(null);
            state.setSearchNextCursor(null);
            state.setSearchResults([]);
            state.setSearchLoading(true);
            state.setSearchError('');
            state.setSearchLoaded(false);
            state.setActive('search');
          }}
        />
      )}

      {state.active === 'trips' && (
        <TripManagementSection
          authUser={state.authUser}
          calculateTravelCost={actions.calculateTravelCost}
          field={field}

          myTripData={state.myTripData}
          recordTripCheckIn={actions.recordTripCheckIn}
          requestTravelSeat={requestTravelSeat}
          runTripAction={actions.runTripAction}
          safetyActionLoading={state.safetyActionLoading}
          safetyTripOptions={model.safetyTripOptions}
          selectedSafetyTripId={state.selectedSafetyTripId}
          setSafetyError={state.setSafetyError}
          setSelectedSafetyTripId={state.setSelectedSafetyTripId}
          setSharingTripLocation={state.setSharingTripLocation}
          setTripOfferForm={state.setTripOfferForm}
          sharingTripLocation={state.sharingTripLocation}
          startTripLocationSharing={actions.startTripLocationSharing}
          stopSharingTripLocation={stopSharingTripLocation}
          stopTripLocationSharing={actions.stopTripLocationSharing}
          submitTripOffer={actions.submitTripOffer}
          tripActionLoading={state.tripActionLoading}
          tripCards={state.tripCards}
          tripError={state.tripError}
          tripLoading={state.tripLoading}
          tripLocationUpdateRef={state.tripLocationUpdateRef}
          tripOfferForm={state.tripOfferForm}
          tripSafetyStatus={state.tripSafetyStatus}
          tripStatusLabels={tripStatusLabels}
          updateTravelOfferStatus={updateTravelOfferStatus}
          updateTravelRequest={updateTravelRequest}
        />
      )}

      {state.active === 'safety' && (
        <SafetySection
          authUser={state.authUser}
          safetyError={state.safetyError}
          safetyAlertsLoading={state.safetyAlertsLoading}
          alertFeed={state.alertFeed}
          safetyActionLoading={state.safetyActionLoading}
          field={field}
          onResolveAlert={actions.handleResolveSafetyAlert}
          onRequestSOS={() => {
            state.setIncludeSafetyLocation(false);
            state.setSafetyLocationError('');
            actions.openModal({
              type: 'panic',
              title: 'Registrar alerta SOS',
              accent: '#ef4444',
              message: `Se registrará una alerta SOS de ${state.student.name} para el equipo de seguridad. Si eliges incluir tu GPS, el navegador pedirá permiso y las coordenadas se enviarán junto con la alerta. La app no avisará automáticamente a autoridades ni contactos.`,
              confirmText: 'Activar SOS',
              onConfirm: actions.confirmEmergency,
            });
          }}
        />
      )}

      {state.active === 'admin' && (
        <AdminManagementSection
          adminCatalog={state.adminCatalog}
          adminCatalogForm={state.adminCatalogForm}
          adminChecklist={adminChecklist}
          adminDashboardError={state.adminDashboardError}
          adminDashboardLoading={state.adminDashboardLoading}
          adminFeedVersion={state.adminFeedVersion}
          adminIncidentMeta={state.adminIncidentMeta}
          adminIncidentStatus={state.adminIncidentStatus}
          adminIncidents={state.adminIncidents}
          adminLatestFeed={state.adminLatestFeed}
          adminManagementAction={state.adminManagementAction}
          adminManagementError={state.adminManagementError}
          adminManagementLoading={state.adminManagementLoading}
          adminSelectedUniversity={state.adminSelectedUniversity}
          adminUniversities={adminUniversities}
          adminUserFilters={state.adminUserFilters}
          adminUserMeta={state.adminUserMeta}
          adminUserSearch={state.adminUserSearch}
          adminUsers={state.adminUsers}
          authUser={state.authUser}
          catalogTypes={catalogTypes}
          createAdminCatalogEntry={actions.createAdminCatalogEntry}
          currentAdminDashboard={model.currentAdminDashboard}
          deactivateAdminCatalogEntry={actions.deactivateAdminCatalogEntry}
          exportAdminAnalytics={actions.exportAdminAnalytics}
          field={field}
          saveAdminUser={actions.saveAdminUser}
          setAdminCatalogForm={state.setAdminCatalogForm}
          setAdminFeedVersion={state.setAdminFeedVersion}
          setAdminIncidentPage={state.setAdminIncidentPage}
          setAdminIncidentStatus={state.setAdminIncidentStatus}
          setAdminRoutesFile={state.setAdminRoutesFile}
          setAdminSelectedUniversity={state.setAdminSelectedUniversity}
          setAdminStopsFile={state.setAdminStopsFile}
          setAdminUserFilters={state.setAdminUserFilters}
          setAdminUserSearch={state.setAdminUserSearch}
          submitAdminTransitFeed={actions.submitAdminTransitFeed}
        />
      )}

      {state.active === 'trust' && (
        <TrustSection
          authUser={state.authUser}
          reputationLoading={state.reputationLoading}
          reputationError={state.reputationError}
          reputationData={state.reputationData}
          reputationAction={state.reputationAction}
          reviewForm={state.reviewForm}
          reportForm={state.reportForm}
          adminReports={state.adminReports}
          adminReportsMeta={state.adminReportsMeta}
          field={field}
          onReviewFormChange={(key, value) => state.setReviewForm((current) => ({
            ...current,
            [key]: value,
            ...(key === 'trip_id' ? { reviewee_profile_id: '' } : {}),
          }))}
          onReportFormChange={(key, value) => state.setReportForm((current) => ({
            ...current,
            [key]: value,
            ...(key === 'trip_id' ? { reported_profile_id: '' } : {}),
          }))}
          onSubmitReview={actions.submitReputationReview}
          onSubmitReport={actions.submitReputationReport}
          onModerateReport={actions.moderateReputationReport}
          onAdminReportsPageChange={state.setAdminReportsPage}
        />
      )}

      {state.active === 'payments' && (
        <InsuranceMembershipPanel
          authUser={state.authUser}
          adminInsuranceEnrollments={state.adminInsuranceEnrollments}
          downloadInsurancePolicy={actions.downloadInsurancePolicy}
          field={field}
          formatInsurancePremium={formatInsurancePremium}
          insuranceAction={state.insuranceAction}
          insuranceError={state.insuranceError}
          insuranceLoading={state.insuranceLoading}
          insuranceMonthlyBudget={model.insuranceMonthlyBudget}
          insuranceProducts={state.insuranceProducts}
          insuranceStatusLabel={insuranceStatusLabel}
          membershipInfo={state.membershipInfo}
          membershipPaymentStatusLabel={membershipPaymentStatusLabel}
          moderateInsuranceEnrollment={actions.moderateInsuranceEnrollment}
          myInsuranceEnrollments={state.myInsuranceEnrollments}
          openWompiMembershipCheckout={actions.openWompiMembershipCheckout}
          submitAdminInsuranceQuote={actions.submitAdminInsuranceQuote}
          submitInsurancePolicyForm={actions.submitInsurancePolicyForm}
          submitInsuranceQuoteRequest={actions.submitInsuranceQuoteRequest}
        />
      )}

      {state.active === 'dashboard' && (
        <DashboardSection
          authUser={state.authUser}
          dashboardError={state.dashboardError}
          dashboardLoading={state.dashboardLoading}
          dashboardTrips={state.dashboardTrips}
          dashboardReputation={state.dashboardReputation}
          dashboardConversations={state.dashboardConversations}
          selectedChatTripId={state.selectedChatTripId}
          chatError={state.chatError}
          chatLoading={state.chatLoading}
          chatHasOlder={state.chatHasOlder}
          chatLoadingOlder={state.chatLoadingOlder}
          chatMessages={state.chatMessages}
          chatReadOnly={state.chatReadOnly}
          chatAction={state.chatAction}
          chatDraft={state.chatDraft}
          field={field}
          tripStatusLabels={tripStatusLabels}
          onNavigate={state.setActive}
          onSelectChatTrip={actions.selectDashboardConversation}
          onChatDraftChange={state.setChatDraft}
          onLoadOlderMessages={actions.loadOlderChatMessages}
          onSubmitMessage={actions.submitDashboardMessage}
        />
      )}

      {state.active === 'privacy' && <PrivacySection />}
      {state.active === 'alerts' && (
        <AlertsSection notifications={state.notifications} onToggleNotification={actions.toggleNotification} />
      )}
      {state.active === 'advanced' && (
        <AdvancedSection advancedMode={state.advancedMode} onToggleFeature={actions.toggleAdvancedFeature} />
      )}
      {state.active === 'backend' && <BackendSection />}
      {state.active === 'checklist' && (
        <ComplianceSection executionState={state.executionState} onToggleTask={actions.toggleExecutionTask} />
      )}
      {state.active === 'roadmap' && <RoadmapSection />}
    </>
  );
}
