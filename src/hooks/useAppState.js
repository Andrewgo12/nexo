import { useRef, useState } from 'react';
import { executionChecklist } from '../data/appSectionData';

function localDateString(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export default function useAppState(persisted, { initialStudent, universities }) {
  const [active, setActive] = useState(persisted.activeTab || 'auth');
  const [student, setStudent] = useState(initialStudent);
  const [uni, setUni] = useState(universities[0]);
  const [email, setEmail] = useState('');
  const [privacy, setPrivacy] = useState(persisted.privacy || 'Zona aproximada');
  const [toast, setToast] = useState('');
  const [route, setRoute] = useState({ origin: '', destination: '', mode: 'MIO + caminata', time: '' });
  const [searchState, setSearchState] = useState({
      zone: '',
      time: '',
      faculty: '',
      university: 'Cualquiera',
      transport: 'Cualquiera',
      date_from: '',
      date_to: '',
      sort: 'Compatibilidad',
    });
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [searchTruncated, setSearchTruncated] = useState(false);
  const [searchCursor, setSearchCursor] = useState(null);
  const [searchNextCursor, setSearchNextCursor] = useState(null);
  const [matchResults, setMatchResults] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState('');
  const [matchLoaded, setMatchLoaded] = useState(false);
  const [matchProfileAvailable, setMatchProfileAvailable] = useState(true);
  const [matchTruncated, setMatchTruncated] = useState(false);
  const [matchCursor, setMatchCursor] = useState(null);
  const [matchNextCursor, setMatchNextCursor] = useState(null);
  const [myTripData, setMyTripData] = useState({ offers: [], requests: [] });
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState('');
  const [tripActionLoading, setTripActionLoading] = useState('');
  const [tripRefreshKey, setTripRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState(persisted.notifications || [
      { title: 'Recordatorio de salida (demo)', channel: 'En la app', active: false },
      { title: 'Check-in de llegada', channel: 'En la app', active: false },
      { title: 'Cambio de ruta', channel: 'No configurado', active: false },
      { title: 'Contacto de confianza (no conectado)', channel: 'No configurado', active: false },
    ]);
  const [advancedMode, setAdvancedMode] = useState(persisted.advancedMode || { night: true, safeties: true, hotspots: true, recommendations: true });
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [adminDashboardLoading, setAdminDashboardLoading] = useState(false);
  const [adminDashboardError, setAdminDashboardError] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUserMeta, setAdminUserMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [adminIncidents, setAdminIncidents] = useState([]);
  const [adminIncidentMeta, setAdminIncidentMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [adminIncidentPage, setAdminIncidentPage] = useState(1);
  const [adminIncidentStatus, setAdminIncidentStatus] = useState('all');
  const [adminCatalog, setAdminCatalog] = useState([]);
  const [adminSelectedUniversity, setAdminSelectedUniversity] = useState('');
  const [adminCatalogForm, setAdminCatalogForm] = useState({ type: 'campus', name: '' });
  const [adminUserFilters, setAdminUserFilters] = useState({ status: '', verification: '', search: '' });
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminStopsFile, setAdminStopsFile] = useState(null);
  const [adminRoutesFile, setAdminRoutesFile] = useState(null);
  const [adminFeedVersion, setAdminFeedVersion] = useState('');
  const [adminLatestFeed, setAdminLatestFeed] = useState(null);
  const [adminManagementLoading, setAdminManagementLoading] = useState(false);
  const [adminManagementAction, setAdminManagementAction] = useState('');
  const [adminManagementError, setAdminManagementError] = useState('');
  const [adminManagementRefresh, setAdminManagementRefresh] = useState(0);
  const [reputationData, setReputationData] = useState(null);
  const [reputationLoading, setReputationLoading] = useState(false);
  const [reputationError, setReputationError] = useState('');
  const [reputationAction, setReputationAction] = useState('');
  const [reputationRefresh, setReputationRefresh] = useState(0);
  const [adminReports, setAdminReports] = useState([]);
  const [adminReportsMeta, setAdminReportsMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [adminReportsPage, setAdminReportsPage] = useState(1);
  const [insuranceProducts, setInsuranceProducts] = useState([]);
  const [myInsuranceEnrollments, setMyInsuranceEnrollments] = useState([]);
  const [adminInsuranceEnrollments, setAdminInsuranceEnrollments] = useState([]);
  const [membershipInfo, setMembershipInfo] = useState(null);
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [insuranceError, setInsuranceError] = useState('');
  const [insuranceAction, setInsuranceAction] = useState('');
  const [insuranceRefresh, setInsuranceRefresh] = useState(0);
  const [dashboardTrips, setDashboardTrips] = useState({ offers: [], requests: [] });
  const [dashboardConversations, setDashboardConversations] = useState([]);
  const [dashboardReputation, setDashboardReputation] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [selectedChatTripId, setSelectedChatTripId] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatReadOnly, setChatReadOnly] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatAction, setChatAction] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [reviewForm, setReviewForm] = useState({ trip_id: '', reviewee_profile_id: '', rating: '5', comment: '' });
  const [reportForm, setReportForm] = useState({ trip_id: '', reported_profile_id: '', category: 'conduct', description: '' });
  const [executionState, setExecutionState] = useState(persisted.executionState || executionChecklist);
  const [routeResult, setRouteResult] = useState(null);
  const [routeLocations, setRouteLocations] = useState({ origin: null, destination: null });
  const [routeSearchResults, setRouteSearchResults] = useState({ origin: [], destination: [] });
  const [routeSearchLoading, setRouteSearchLoading] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [tripCards, setTripCards] = useState([]);
  const [tripOfferMinimumDate] = useState(localDateString);
  const [tripOfferForm, setTripOfferForm] = useState({
      origin: 'UNIAJC Sede Sur',
      destination: 'El Caney',
      departure_date: localDateString(),
      departure_time: '19:45',
      mode: 'MIO + caminata',
      seats: '2',
      cost: '2500 COP',
    });
  const [alertFeed, setAlertFeed] = useState([]);
  const [safetyActionLoading, setSafetyActionLoading] = useState('');
  const [safetyError, setSafetyError] = useState('');
  const [safetyLocationError, setSafetyLocationError] = useState('');
  const [includeSafetyLocation, setIncludeSafetyLocation] = useState(false);
  const [safetyRefreshKey, setSafetyRefreshKey] = useState(0);
  const [safetyAlertsLoading, setSafetyAlertsLoading] = useState(false);
  const [safetyTripData, setSafetyTripData] = useState({ offers: [], requests: [] });
  const [selectedSafetyTripId, setSelectedSafetyTripId] = useState('');
  const [tripSafetyStatus, setTripSafetyStatus] = useState({ locations: [], check_ins: [], safety_events: [] });
  const [sharingTripLocation, setSharingTripLocation] = useState(false);
  const tripLocationUpdateRef = useRef(Promise.resolve());
  const [modal, setModal] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authMode, setAuthMode] = useState(resetParams.has('reset_token') ? 'reset' : 'login');
  const [loginForm, setLoginForm] = useState({
      name: '',
      email: resetParams.get('email') || '',
      password: '',
      password_confirmation: '',
      career: '',
      semester: '',
      shift: '',
      neighborhood: '',
      emergency_contact: '',
      remember: false,
    });
  const [profilePhoto, setProfilePhoto] = useState('KG');
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);

  return {
    active, setActive, student, setStudent,
    uni, setUni, email, setEmail,
    privacy, setPrivacy, toast, setToast,
    route, setRoute, searchState, setSearchState,
    searchResults, setSearchResults, searchLoading, setSearchLoading,
    searchError, setSearchError, searchLoaded, setSearchLoaded,
    searchTruncated, setSearchTruncated, searchCursor, setSearchCursor,
    searchNextCursor, setSearchNextCursor, matchResults, setMatchResults,
    matchLoading, setMatchLoading, matchError, setMatchError,
    matchLoaded, setMatchLoaded, matchProfileAvailable, setMatchProfileAvailable,
    matchTruncated, setMatchTruncated, matchCursor, setMatchCursor,
    matchNextCursor, setMatchNextCursor, myTripData, setMyTripData,
    tripLoading, setTripLoading, tripError, setTripError,
    tripActionLoading, setTripActionLoading, tripRefreshKey, setTripRefreshKey,
    notifications, setNotifications, advancedMode, setAdvancedMode,
    adminDashboard, setAdminDashboard, adminDashboardLoading, setAdminDashboardLoading,
    adminDashboardError, setAdminDashboardError, adminUsers, setAdminUsers,
    adminUserMeta, setAdminUserMeta, adminIncidents, setAdminIncidents,
    adminIncidentMeta, setAdminIncidentMeta, adminIncidentPage, setAdminIncidentPage,
    adminIncidentStatus, setAdminIncidentStatus, adminCatalog, setAdminCatalog,
    adminSelectedUniversity, setAdminSelectedUniversity, adminCatalogForm, setAdminCatalogForm,
    adminUserFilters, setAdminUserFilters, adminUserSearch, setAdminUserSearch,
    adminStopsFile, setAdminStopsFile, adminRoutesFile, setAdminRoutesFile,
    adminFeedVersion, setAdminFeedVersion, adminLatestFeed, setAdminLatestFeed,
    adminManagementLoading, setAdminManagementLoading, adminManagementAction, setAdminManagementAction,
    adminManagementError, setAdminManagementError, adminManagementRefresh, setAdminManagementRefresh,
    reputationData, setReputationData, reputationLoading, setReputationLoading,
    reputationError, setReputationError, reputationAction, setReputationAction,
    reputationRefresh, setReputationRefresh, adminReports, setAdminReports,
    adminReportsMeta, setAdminReportsMeta, adminReportsPage, setAdminReportsPage,
    insuranceProducts, setInsuranceProducts, myInsuranceEnrollments, setMyInsuranceEnrollments,
    adminInsuranceEnrollments, setAdminInsuranceEnrollments, membershipInfo, setMembershipInfo,
    insuranceLoading, setInsuranceLoading, insuranceError, setInsuranceError,
    insuranceAction, setInsuranceAction, insuranceRefresh, setInsuranceRefresh,
    dashboardTrips, setDashboardTrips, dashboardConversations, setDashboardConversations,
    dashboardReputation, setDashboardReputation, dashboardLoading, setDashboardLoading,
    dashboardError, setDashboardError, selectedChatTripId, setSelectedChatTripId,
    chatMessages, setChatMessages, chatReadOnly, setChatReadOnly,
    chatLoading, setChatLoading, chatError, setChatError,
    chatAction, setChatAction, chatDraft, setChatDraft,
    reviewForm, setReviewForm, reportForm, setReportForm,
    executionState, setExecutionState, routeResult, setRouteResult,
    routeLocations, setRouteLocations, routeSearchResults, setRouteSearchResults,
    routeSearchLoading, setRouteSearchLoading, routeLoading, setRouteLoading,
    routeError, setRouteError, deviceLocation, setDeviceLocation,
    locationLoading, setLocationLoading, tripCards, setTripCards,
    tripOfferMinimumDate, tripOfferForm, setTripOfferForm, alertFeed, setAlertFeed,
    safetyActionLoading, setSafetyActionLoading, safetyError, setSafetyError,
    safetyLocationError, setSafetyLocationError, includeSafetyLocation, setIncludeSafetyLocation,
    safetyRefreshKey, setSafetyRefreshKey, safetyAlertsLoading, setSafetyAlertsLoading,
    safetyTripData, setSafetyTripData, selectedSafetyTripId, setSelectedSafetyTripId,
    tripSafetyStatus, setTripSafetyStatus, sharingTripLocation, setSharingTripLocation,
    tripLocationUpdateRef, modal, setModal, isBooting,
    setIsBooting, isLoggedIn, setIsLoggedIn, isEmailVerified,
    setIsEmailVerified, authUser, setAuthUser, authMode,
    setAuthMode, loginForm, setLoginForm, profilePhoto,
    setProfilePhoto, passwordForm, setPasswordForm, profilePhotoFile,
    setProfilePhotoFile,
  };
}
