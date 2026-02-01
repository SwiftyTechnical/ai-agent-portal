export type WorkflowStatus = 'draft' | 'pending_review' | 'reviewed' | 'pending_approval' | 'approved' | 'rejected';

export interface Policy {
  id: string;
  title: string;
  slug: string;
  content: string;
  current_version: number;
  major_version: number;
  minor_version: number;
  workflow_status: WorkflowStatus;
  reviewer_id: string | null;
  approver_id: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChangeDiff {
  added: string[];
  removed: string[];
  modified: string[];
}

export interface PolicyVersion {
  id: string;
  policy_id: string;
  version_number: number;
  version_label: string;
  content: string;
  change_summary: string | null;
  changes_diff: ChangeDiff | null;
  created_by: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'reviewer' | 'approver' | 'editor' | 'viewer';
  created_at: string;
}

export type WorkflowAction = 'created' | 'edited' | 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'revision_requested';

export interface WorkflowHistory {
  id: string;
  policy_id: string;
  action: WorkflowAction;
  performed_by: string;
  from_version: string | null;
  to_version: string | null;
  comments: string | null;
  created_at: string;
  // Joined user data (optional)
  user?: User;
}

export interface Asset {
  id: string;
  asset_number: string;
  description: string;
  serial_number: string | null;
  location: string | null;
  purchase_date: string | null;
  supplier: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  // Joined user data (optional)
  assigned_user?: User;
}

export type DocumentType = 'nda' | 'agreement' | 'certification' | 'license' | 'policy' | 'contract' | 'report' | 'other';

export interface Document {
  id: string;
  name: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  document_type: DocumentType | null;
  company_name: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined user data (optional)
  uploader?: User;
}

// Third Party Risk Assessment Types
export type VendorStatus = 'pending' | 'assessed' | 'approved' | 'rejected' | 'expired';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface VendorAssessmentCategory {
  score: number;
  aiNotes: string;
  [key: string]: unknown;
}

export interface VendorAssessmentDetails {
  supplierIdentification: VendorAssessmentCategory & {
    companyInfo: string;
    registrationDetails: string;
    ownershipStructure: string;
  };
  serviceDescription: VendorAssessmentCategory & {
    servicesProvided: string;
    industryClassification: string;
  };
  informationSecurity: VendorAssessmentCategory & {
    securityPolicies: string;
    securityCertifications: string[];
    knownVulnerabilities: string;
  };
  dataProtection: VendorAssessmentCategory & {
    privacyPolicy: string;
    gdprCompliance: string;
    dataProcessingLocations: string[];
  };
  complianceCertifications: VendorAssessmentCategory & {
    pciCompliance: boolean | null;
    isoCompliance: string[];
    otherCertifications: string[];
  };
  operationalResilience: VendorAssessmentCategory & {
    businessContinuityPlan: string;
    disasterRecovery: string;
    slaInformation: string;
  };
  incidentBreachHistory: VendorAssessmentCategory & {
    knownBreaches: string[];
    incidentResponseCapability: string;
  };
  geographicJurisdictional: VendorAssessmentCategory & {
    headquarters: string;
    operatingCountries: string[];
    dataResidency: string[];
    regulatoryEnvironment: string;
  };
  reputationEthical: VendorAssessmentCategory & {
    publicReputation: string;
    newsAndMedia: string;
    ethicalConcerns: string;
  };
  overallAssessment: {
    score: number;
    summary: string;
    riskLevel: RiskLevel;
    recommendations: string[];
  };
}

export interface Vendor {
  id: string;
  company_name: string;
  website_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contract_document_id: string | null;
  status: VendorStatus;

  // Assessment scores (0-100)
  supplier_identification_score: number | null;
  service_description_score: number | null;
  information_security_score: number | null;
  data_protection_score: number | null;
  compliance_certifications_score: number | null;
  operational_resilience_score: number | null;
  incident_breach_history_score: number | null;
  geographic_jurisdictional_score: number | null;
  reputation_ethical_score: number | null;
  overall_score: number | null;

  assessment_details: VendorAssessmentDetails | null;
  notes: string | null;

  created_by: string | null;
  last_assessed_at: string | null;
  last_assessed_by: string | null;
  created_at: string;
  updated_at: string;

  // Joined data (optional)
  contract_document?: Document;
  creator?: User;
  assessor?: User;
}

export interface VendorAssessmentHistory {
  id: string;
  vendor_id: string;

  // Score snapshot
  supplier_identification_score: number | null;
  service_description_score: number | null;
  information_security_score: number | null;
  data_protection_score: number | null;
  compliance_certifications_score: number | null;
  operational_resilience_score: number | null;
  incident_breach_history_score: number | null;
  geographic_jurisdictional_score: number | null;
  reputation_ethical_score: number | null;
  overall_score: number | null;

  assessment_details: VendorAssessmentDetails | null;
  performed_by: string;
  created_at: string;

  // Joined data
  performer?: User;
}

// AWS Evidence Types
export interface IAMPasswordPolicy {
  minimumPasswordLength?: number;
  requireSymbols?: boolean;
  requireNumbers?: boolean;
  requireUppercaseCharacters?: boolean;
  requireLowercaseCharacters?: boolean;
  allowUsersToChangePassword?: boolean;
  expirePasswords?: boolean;
  maxPasswordAge?: number;
  passwordReusePrevention?: number;
  hardExpiry?: boolean;
}

export interface CognitoPasswordPolicy {
  userPoolId: string;
  userPoolName: string;
  minimumLength?: number;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSymbols?: boolean;
  requireUppercase?: boolean;
  temporaryPasswordValidityDays?: number;
}

export interface AWSPasswordPolicyEvidence {
  iamPasswordPolicy: IAMPasswordPolicy | null;
  iamPolicyError?: string;
  cognitoPasswordPolicies: CognitoPasswordPolicy[];
  cognitoPolicyError?: string;
  collectedAt: string;
}

export interface AWSEvidenceEvaluation {
  score: number;
  findings: string[];
  recommendations: string[];
}

// AWS Evidence Run (stored in database)
export interface AWSEvidenceRun {
  id: string;
  overall_score: number | null;
  iam_score: number | null;
  iam_policy: IAMPasswordPolicy | null;
  iam_findings: string[] | null;
  iam_recommendations: string[] | null;
  iam_error: string | null;
  cognito_evaluations: CognitoEvaluationRecord[] | null;
  raw_response: AWSPasswordPolicyEvidence | null;
  performed_by: string | null;
  collected_at: string;
  created_at: string;
  // Joined data
  performer?: User;
}

export interface CognitoEvaluationRecord {
  policy: CognitoPasswordPolicy;
  score: number;
  findings: string[];
  recommendations: string[];
}

export interface Database {
  public: {
    Tables: {
      policies: {
        Row: Policy;
        Insert: Omit<Policy, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Policy, 'id' | 'created_at'>>;
      };
      policy_versions: {
        Row: PolicyVersion;
        Insert: Omit<PolicyVersion, 'id' | 'created_at'>;
        Update: Partial<Omit<PolicyVersion, 'id' | 'created_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      workflow_history: {
        Row: WorkflowHistory;
        Insert: Omit<WorkflowHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<WorkflowHistory, 'id' | 'created_at'>>;
      };
      assets: {
        Row: Asset;
        Insert: Omit<Asset, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Asset, 'id' | 'created_at'>>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Document, 'id' | 'created_at'>>;
      };
      vendors: {
        Row: Vendor;
        Insert: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Vendor, 'id' | 'created_at'>>;
      };
      vendor_assessment_history: {
        Row: VendorAssessmentHistory;
        Insert: Omit<VendorAssessmentHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<VendorAssessmentHistory, 'id' | 'created_at'>>;
      };
      aws_evidence_runs: {
        Row: AWSEvidenceRun;
        Insert: Omit<AWSEvidenceRun, 'id' | 'created_at'>;
        Update: Partial<Omit<AWSEvidenceRun, 'id' | 'created_at'>>;
      };
    };
  };
}
