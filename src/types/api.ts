export interface DashboardStats {
  totalEventsSubmitted: number;
  activeSignals: number;
  highRiskAlerts: number;
  apiCallsToday: number;
  totalHrEvents: number;
  totalMnoEvents: number;
}

export interface DashboardActivityPoint {
  date: string;
  hrCount: number;
  mnoCount: number;
}

export interface RecentSubmission {
  eventId: string;
  source: string;
  idNumber: string;
  eventType: string;
  riskScore: number;
  status: string;
  submittedAt: string;
}

export interface DashboardOverview {
  stats: DashboardStats;
  activitySeries: DashboardActivityPoint[];
  recentSubmissions: RecentSubmission[];
  topFraudSignals: FraudSignal[];
}

export type HrEventType =
  | 'EmployeeVerification'
  | 'GhostEmployee'
  | 'PayrollMismatch'
  | 'IdentityFraud';

export type MnoEventType =
  | 'NewSIMApplication'
  | 'ContractApplication'
  | 'RICARegistration'
  | 'PortRequest'
  | 'SIMSwap';

export type ApplicationChannel =
  | 'InStore'
  | 'Online'
  | 'USSD'
  | 'CallCentre'
  | 'ThirdParty';

export type VerificationStatus =
  | 'Confirmed'
  | 'Denied'
  | 'Inconclusive'
  | 'Pending';

export type SignalType = 'HR_Alert' | 'MNO_Alert';

export type SignalCategory =
  | 'EmploymentAnomaly'
  | 'SIMVelocity'
  | 'IdentityMismatch'
  | 'PortingRisk';

export interface FraudSignal {
  signalId: string;
  idNumberHash: string;
  signalType: SignalType;
  signalCategory: SignalCategory;
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
  aggregateRiskScore: number;
  isActive: boolean;
}

export interface FraudSignalCategoryBreakdown {
  signalCategory: SignalCategory;
  occurrenceCount: number;
  signalCount: number;
  maxRiskScore: number;
}

export interface FraudSignalTimelinePoint {
  occurredAt: string;
  occurrenceIndex: number;
  estimatedRiskScore: number;
  label: string;
}

export interface FraudSignalRiskTrendPoint {
  at: string;
  aggregateRiskScore: number;
}

export interface FraudSignalDetail {
  signal: FraudSignal;
  categoryBreakdown: FraudSignalCategoryBreakdown[];
  occurrenceTimeline: FraudSignalTimelinePoint[];
  aggregateRiskTrend: FraudSignalRiskTrendPoint[];
}

export interface FraudSignalList {
  signals: FraudSignal[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface HrEvent {
  eventId: string;
  idNumber: string;
  eventType: HrEventType;
  eventDate: string;
  employerName: string;
  employeeNumber: string | null;
  verificationStatus: VerificationStatus;
  riskScore: number;
  notes: string | null;
  createdAt: string;
}

export interface MnoEvent {
  eventId: string;
  idNumber: string;
  msisdn: string;
  eventType: MnoEventType;
  eventDate: string;
  applicationChannel: ApplicationChannel;
  outletOrDealer: string;
  deviceImei: string | null;
  riskScore: number;
  flagReason: string | null;
  createdAt: string;
}

export interface ActivityLogEntry {
  activityLogId: string;
  action: string;
  endpoint: string;
  httpMethod: string;
  statusCode: number;
  clientIp: string | null;
  createdAt: string;
}

export interface ActivityLogList {
  entries: ActivityLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface IdCheckResult {
  idNumberHash: string;
  matchFound: boolean;
  matchingSignals: FraudSignal[];
}

export interface SubmitHrEventRequest {
  idNumber: string;
  eventType: HrEventType;
  eventDate: string;
  employerName: string;
  employeeNumber?: string;
  verificationStatus: VerificationStatus;
  notes?: string;
}

export interface SubmitMnoEventRequest {
  idNumber: string;
  msisdn: string;
  eventType: MnoEventType;
  eventDate: string;
  applicationChannel: ApplicationChannel;
  outletOrDealer: string;
  deviceImei?: string;
  flagReason?: string;
}

export type TenantUserRole = 'TenantAdmin' | 'Analyst' | 'Viewer';

export interface CurrentUser {
  email: string;
  displayName: string | null;
  role: TenantUserRole | null;
  roleDisplayName: string | null;
  tenantId: string;
  hasAccess: boolean;
  permissions: string[];
}

export interface TenantUser {
  tenantUserId: string;
  tenantId: string;
  email: string;
  displayName: string | null;
  role: TenantUserRole;
  roleDisplayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface TenantUserList {
  users: TenantUser[];
}

export interface UpsertTenantUserRequest {
  email: string;
  displayName?: string;
  role: TenantUserRole;
}

export interface UpdateTenantUserRequest {
  role: TenantUserRole;
  displayName?: string;
  isActive?: boolean;
}
