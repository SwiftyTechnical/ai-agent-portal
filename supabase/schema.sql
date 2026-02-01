-- Policy Portal Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'reviewer', 'approver', 'editor', 'viewer')),
  auth_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add auth_id column if table already exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID;

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  current_version INTEGER NOT NULL DEFAULT 1,
  major_version INTEGER NOT NULL DEFAULT 1,
  minor_version INTEGER NOT NULL DEFAULT 0,
  workflow_status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (workflow_status IN ('draft', 'pending_review', 'reviewed', 'pending_approval', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES users(id),
  approver_id UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add version columns if table already exists
ALTER TABLE policies ADD COLUMN IF NOT EXISTS major_version INTEGER DEFAULT 1;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS minor_version INTEGER DEFAULT 0;

-- Policy versions table (for version history)
CREATE TABLE IF NOT EXISTS policy_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label VARCHAR(20) NOT NULL DEFAULT '1.0',
  content TEXT NOT NULL,
  change_summary TEXT,
  changes_diff JSONB,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(policy_id, version_number)
);

-- Add columns if table already exists
ALTER TABLE policy_versions ADD COLUMN IF NOT EXISTS changes_diff JSONB;
ALTER TABLE policy_versions ADD COLUMN IF NOT EXISTS version_label VARCHAR(20) DEFAULT '1.0';

-- Workflow history table
CREATE TABLE IF NOT EXISTS workflow_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'edited', 'submitted', 'reviewed', 'approved', 'rejected', 'revision_requested')),
  performed_by UUID NOT NULL REFERENCES users(id),
  from_version VARCHAR(20),
  to_version VARCHAR(20),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add version columns to workflow_history if table already exists
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS from_version VARCHAR(20);
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS to_version VARCHAR(20);

-- Update the action check constraint to include new actions
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS workflow_history_action_check;
ALTER TABLE workflow_history ADD CONSTRAINT workflow_history_action_check
  CHECK (action IN ('created', 'edited', 'submitted', 'reviewed', 'approved', 'rejected', 'revision_requested'));

-- Assets table (Asset Register)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_number VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255),
  location VARCHAR(255),
  purchase_date DATE,
  supplier VARCHAR(255),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to auto-update assets updated_at
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Documents table (Document Repository)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  document_type VARCHAR(50) CHECK (document_type IN ('nda', 'agreement', 'certification', 'license', 'policy', 'contract', 'report', 'other')),
  company_name VARCHAR(255),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to auto-update documents updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_policies_slug ON policies(slug);
CREATE INDEX IF NOT EXISTS idx_policies_workflow_status ON policies(workflow_status);
CREATE INDEX IF NOT EXISTS idx_policy_versions_policy_id ON policy_versions(policy_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_policy_id ON workflow_history(policy_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_number ON assets(asset_number);
CREATE INDEX IF NOT EXISTS idx_assets_assigned_to ON assets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_company_name ON documents(company_name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (email, name, role) VALUES
  ('admin@swiftyglobal.com', 'Admin User', 'admin'),
  ('reviewer@swiftyglobal.com', 'Head of IT', 'reviewer'),
  ('approver@swiftyglobal.com', 'CEO', 'approver')
ON CONFLICT (email) DO NOTHING;

-- Insert initial policies from the markdown files
INSERT INTO policies (title, slug, content, current_version, workflow_status) VALUES
(
  'Social Media Policy',
  'social-media-policy',
  '# ISMS-DOC-A05-5 Social Media Policy

## 1 Introduction

The purpose of this document is to set out the organization''s policy in the area of social media.

Swifty Global makes extensive use of social media to communicate directly with our customers as part of our marketing activity, to provide support for our products and services, and to obtain useful feedback on how our organization is perceived.

The social media landscape is constantly changing, but currently includes platforms such as the following:

- Facebook
- LinkedIn
- Twitter
- Instagram
- WhatsApp
- YouTube
- Pinterest
- Tumblr
- Blogging platforms

The appropriate use of social media can be challenging but is increasingly necessary, as it is often seen as a significant part of modern-day life. This communication method presents strong opportunities to get closer to our customers, but also represents a major risk if it is not used in a considered way, as an inappropriately worded message can cause offense and be passed on to many more people within a very short space of time.

This policy sets out guidelines for how organization-controlled social media accounts should be used and offers basic advice for the appropriate use of personal accounts outside of the work environment.

The following policies and procedures are relevant to this document:

- Acceptable Use Policy
- Electronic Messaging Policy
- Mobile Device Policy
- Software Policy
- Privacy and Personal Data Protection Policy

## 2 Policy

### 2.1 Corporate use of social media

You must be authorised to use the social media account and to represent Swifty Global to the general public as part of your job role.

Only authorised accounts should be used to publish messages and respond to other users of the social media channel. Do not use your own personal account.

When posting or engaging with other users, always make it clear that you work for Swifty Global and are representing us as an organization. Never pretend to be someone you''re not.

Be careful what information you share online about customers, other employees, financial information, business operations or anything else that might be considered to be private or confidential.

Be careful when re-communicating others'' posts. Attribute where appropriate and be aware of any potential copyright or other intellectual property issues.

Always check your facts before posting and correct any mistakes as soon as possible and in a clear and transparent way.

Remain friendly, respectful and professional and avoid using wording or styles (such as capitals) that might cause offence.

Consider the global nature of social media and be mindful of the fact that a statement may be interpreted in different ways in different countries or cultures around the world.

Avoid commenting on any matters that might be subject to a legal action either by or against the organization.

In an emergency or crisis, ensure that you communicate with the people within Swifty Global responsible for managing the situation, and follow their guidance.

### 2.2 Personal use of social media

Swifty Global respects your personal online activity as a medium of self-expression, but remember you continue to have responsibilities to the organization outside of working hours.

When using social media to engage on matters relevant to Swifty Global, make it clear it''s your own opinion you are expressing and not that of the organization.

Remember you are not communicating on behalf of the organization. The other person may need an official response and it may be appropriate for you to refer them to our authorised channels.

Use separate accounts for personal and work-related use and try not to confuse the two.

Be aware that data protection and other Swifty Global policies still apply to your personal use of social media and that many platforms must be considered to be public forums.

Be careful about the personal information about yourself you share online and be mindful that the other person may not be who they say they are.

Swifty Global encourages you to express any concerns about employment-related issues through the appropriate channels within Swifty Global in the first instance e.g. your line manager or HR.',
  1,
  'approved'
),
(
  'Cloud Computing Policy',
  'cloud-computing-policy',
  '# ISMS-DOC-A05-3 Cloud Computing Policy

## 1 Introduction

The purpose of this document is to set out the organization''s policy in the area of cloud computing.

Swifty Global makes extensive use of cloud computing services in the delivery of its core business systems. The nature of these services is such that data is stored outside of the Swifty Global internal network and is subject to access and management by a third party. Furthermore, many cloud services are offered on a multi-tenanted basis in which the infrastructure is shared across multiple customers of the Cloud Service Provider (CSP), making effective and secure segregation a key requirement.

It is therefore essential that rules are established for the selection and management of cloud computing services so that data is appropriately protected according to its business value and classification.

Cloud computing is generally accepted to consist of the following types of services:

- **Software-as-a-Service (SaaS):** The provision of a hosted application for use as part of a business process. Hosting usually includes all supporting components for the application such as hardware, operating software, databases etc.
- **Platform-as-a-Service (PaaS):** Hardware and supporting software such as operating system, database, development platform, web server etc. are provided but no business applications
- **Infrastructure-as-a-Service (IaaS):** Only physical or virtual hardware components are provided

This policy applies to the use of all types of cloud computing services and is particularly relevant where personal data is stored.

## 2 Policy

It is Swifty Global policy in the area of cloud computing that:

Data belonging to Swifty Global will only be stored within cloud services with the prior permission of the Chief Executive Officer.

Appropriate risk assessment must be carried out regarding proposed or continued use of cloud services, including a full understanding of the information security controls implemented by the CSP.

Due diligence must be conducted prior to sign-up to a cloud service provider to ensure that appropriate controls will be in place to protect data. Preference will be given to suppliers who are certified to the ISO/IEC 27001 international standard and who comply to the principles of the ISO/IEC 27017 and ISO/IEC 27018 codes of practice for cloud services.

Service level agreements and contracts with cloud service providers must be reviewed, understood and accepted before sign-up to the service.

Contracts involving personal data must be checked to ensure that they comply with applicable data protection legislation. If not, a separate data processing agreement may be required.

Roles and responsibilities for activities such as backups, patching, log management, malware protection and incident management must be agreed and documented prior to the commencement of the cloud service.

Procedures must be established to ensure that activities that are irreversible in the cloud environment (e.g. deletion of virtual servers, terminating a cloud service or restoration from backups) are subject to appropriate controls to avoid error. Supervision by a second, suitably qualified person must be a stated part of such procedures.

The location of the data stored with the CSP must be understood e.g. UK, EU, USA and the applicable legal basis established, such as the country whose law applies to the contract.

Where available, multi factor authentication must be used to access all cloud services.

Sufficient audit logging must be available to allow Swifty Global to understand the ways in which its data is being accessed and to identify whether any unauthorized access has occurred.

Confidential data stored in cloud services must be encrypted at rest and in transit using acceptable technologies and techniques. Where possible encryption keys will be held by Swifty Global rather than the supplier.

Swifty Global policies for the creation and management of user accounts will apply to cloud services.

Backups must be taken of all data stored in the cloud. This may be performed either directly by Swifty Global or under contract by the cloud service provider.

All Swifty Global data must be removed from cloud services in the event of a contract coming to an end for whatever reason. Data must not be stored in the cloud for longer than is necessary to deliver business processes.',
  1,
  'approved'
),
(
  'HR Security Policy',
  'hr-security-policy',
  '# ISMS-DOC-A07-4 HR Security Policy

## 1 Introduction

As a professional organisation and a responsible employer, Swifty Global takes the subject of information security very seriously. People are our most important asset, but unfortunately represent one of the major vulnerabilities from an information security perspective, as they are often the target of malicious activities such as phishing and other forms of social engineering.

In order to manage this exposure and keep our people and our information safe, Swifty Global has defined a policy which describes the controls required and the rules that must be followed with regard to human resources.

This policy applies to all systems, people and processes that constitute the organization''s information systems, including board members, directors, employees, suppliers and other third parties who have access to Swifty Global systems.

The following policies and procedures are relevant to this document:

- Guidelines for Inclusion in Employment Contracts
- Employee Screening Procedure
- Employee Disciplinary Process
- Acceptable Use Policy
- Information Security Policy

## 2 HR security policy

### 2.1 Prior to employment

#### 2.1.1 Background checks

Appropriate background verification checks will be carried out on all candidates for employment prior to their starting work with the organization.

The specific screening activities that should be applied in any particular case will depend on a number of risk factors including, but not limited to, the following:

- The classification of information they will have access to
- If the role will have access to financial assets
- The level of potential to cause harm to the organization
- Level of involvement in technology
- Whether driving a motor vehicle is required
- If likely to come into contact with minors
- Any other factors that are deemed by management to be relevant to the ongoing security of the organization

A judgement must be made in each case about the appropriate level of background verification to be applied. This must reach a balance between being sufficiently rigorous to protect the organization without placing an undue burden of time, cost or effort on the recruitment process.

#### 2.1.2 Employment contracts

Employment contracts, including those with contract staff, must specify relevant requirements for information security, including a commitment to comply with Swifty Global policies and procedures.

### 2.2 During employment

#### 2.2.1 Management responsibilities

It is important that all employees with management responsibility ensure that Swifty Global information security-related policies and procedures are followed by staff (both internal employees and contractors) within their supervision at all times. Any instances of non-compliance must be identified and addressed through normal management channels, including disciplinary action where appropriate.

#### 2.2.2 Information security awareness

Information security awareness training will be provided to all employees and contractors to a level of detail appropriate to their job role. This will include information about Swifty Global policies and procedures and the specific risks and threats relevant to the employee or contractor''s area of work.

Awareness training will be delivered as part of new starter inductions and updates to relevant information communicated to all employees and contractors when appropriate, and in a timely manner.

#### 2.2.3 Disciplinary process

Instances where a clear breach of information security policy or procedure has been committed by an employee will be subject to Swifty Global disciplinary procedures. In serious cases, where the organization has been put at significant risk as a result of the employee''s actions, termination of employment may be considered.

In less serious cases, the provision of additional information security awareness training may be appropriate as one of the actions to address the situation.

### 2.3 Termination and change of employment

#### 2.3.1 Change of role

In situations where an employee experiences a temporary or permanent change of job role, including reassignment, secondment and sabbatical, those information security responsibilities from their previous role (for example for confidentiality) that will continue must be defined and emphasised to the employee.

Any failure on the part of the employee to observe their continuing responsibilities for information security may be subject to disciplinary action.

#### 2.3.2 Termination

Where an employee''s position with the organization is terminated on a permanent basis, the information security responsibilities and duties that must continue to be observed post-employment will be defined in writing and communicated to the employee.

It must be stated to the terminated employee that any failure on their part to observe their continuing responsibilities for information security may be subject to legal action.',
  1,
  'approved'
),
(
  'Teleworking Policy',
  'teleworking-policy',
  '# ISMS-DOC-A06-5 Teleworking Policy

## 1 Introduction

A teleworking arrangement is a voluntary agreement between the organization and the employee. It usually involves the employee working from home in a separate area of their living accommodation, whether this is a house, apartment or other type of domestic residence.

The introduction of a teleworking arrangement, when managed effectively, has the potential to benefit both the individual and the organization. The individual will gain greater flexibility in working arrangements and possibly avoid a lengthy commute to and from an office. The organization can retain skilled and experienced staff whose circumstances suit teleworking and possibly save money on the rental, lease or purchase of office space.

This policy sets out the key information security-related elements that must be considered in agreeing a teleworking arrangement. It ensures that all the necessary issues are addressed and that the organization''s information assets are protected.

This policy does not address the human resources aspects of teleworking such as health and safety, absence monitoring, job performance and contractual issues. These will be handled by the HR department and must also be in place before the teleworking arrangement begins.

This control applies to all systems, people and processes that constitute the organization''s information systems, including board members, directors, employees, suppliers and other third parties who have access to Swifty Global systems.

The following policies and procedures are relevant to this document:

- Access Control Policy
- Mobile Device Policy
- User Access Management Process
- Cryptographic Policy

## 2 Putting a teleworking arrangement in place

From an information security point of view there are various aspects that need to be considered in each teleworking arrangement and the policy of the organization in these areas is set out in the following sections.

### 2.1 Initial risk assessment

Before a teleworking arrangement can commence there will be an initial risk assessment of the proposed environment and nature of the work to be carried out.

#### 2.1.1 Nature of the work

A major part of the risk assessment concerns the type of activities that are to be carried out as part of the arrangement. A full understanding needs to be gained of:

- The classification of the information that will be stored and processed as part of the role
- The method of access of the information
- Whether the role requires that classified information is printed locally
- The business criticality of the role and the consequences if it were unavailable

#### 2.1.2 Physical security

The risk assessment will also consider the physical security of the proposed work location:

- Is there enough room to house the required equipment safely?
- Is it in a separate area of the living accommodation?
- Can the work area be secured e.g. via a locked door when not in use?
- Who else has access to the work area?
- Will the equipment be visible from outside the accommodation e.g. through a window?
- What is the likelihood of theft in the surrounding area?
- Can paper documents be locked away securely?
- Is there adequate and reliable power supply to the work area?

#### 2.1.3 Insurance

The impact of teleworking on the individual''s home insurance must be investigated to ensure that any policies currently in place remain valid. Additional insurance may be required and if so, it should be agreed in advance how this will be funded.

### 2.2 Facilities provided

The organization''s policy regarding the provision of facilities to enable teleworking is detailed below.

Note that all of the provisions in the Swifty Global Mobile Device Policy also apply to the teleworking environment and this document must be read and understood by all parties involved.

#### 2.2.1 Equipment

Only client equipment provided by Swifty Global for the purpose of teleworking must be used to access company networks. The individual''s own devices such as laptops or PCs must not be used for this purpose.

According to requirements, the teleworker may be provided with:

- A laptop, tablet or desktop PC with keyboard and mouse
- An external monitor
- Other items as required for the role

This equipment always remains the property of the organization.

#### 2.2.2 Communications

In addition to client equipment the teleworker will, wherever possible, be provided with a physically separate communications link which is not connected in any way to existing domestic broadband or similar. This is to ensure that:

- Network performance is not affected by other activities in the household
- The configuration of the router can be security-hardened according to organization policy
- The ability for other devices to connect to this link can be prevented through the protection of network keys etc.

A Virtual Private Network (VPN) will be used to ensure that all network traffic from the teleworker client to organization servers is encrypted to organization standards.

Where public cloud services are accessed directly by the teleworker, appropriate end-to-end encryption must be in place, in accordance with the Cryptographic Policy.

#### 2.2.3 Backup and virus protection

Where possible, no data will be stored on the client machine. If this is unavoidable it is the responsibility of the teleworker to ensure it is backed up to the corporate network as soon as possible.

Virus protection will be provided on all relevant equipment and configured to update automatically on connection to the corporate network.

#### 2.2.4 Technical support

Technical support of all supplied equipment will be provided by the IT Support Desk.

### 2.3 Agreement termination

If the teleworking agreement is terminated for any reason, all equipment that was supplied as part of the arrangement must be returned to the IT Support Desk as soon as possible.',
  1,
  'approved'
)
ON CONFLICT (slug) DO NOTHING;

-- Vendors table (Third Party Risk Assessment)
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) NOT NULL,
  website_url VARCHAR(500),
  contract_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assessed', 'approved', 'rejected', 'expired')),

  -- Assessment scores (0-100)
  supplier_identification_score INTEGER CHECK (supplier_identification_score >= 0 AND supplier_identification_score <= 100),
  service_description_score INTEGER CHECK (service_description_score >= 0 AND service_description_score <= 100),
  information_security_score INTEGER CHECK (information_security_score >= 0 AND information_security_score <= 100),
  data_protection_score INTEGER CHECK (data_protection_score >= 0 AND data_protection_score <= 100),
  compliance_certifications_score INTEGER CHECK (compliance_certifications_score >= 0 AND compliance_certifications_score <= 100),
  operational_resilience_score INTEGER CHECK (operational_resilience_score >= 0 AND operational_resilience_score <= 100),
  incident_breach_history_score INTEGER CHECK (incident_breach_history_score >= 0 AND incident_breach_history_score <= 100),
  geographic_jurisdictional_score INTEGER CHECK (geographic_jurisdictional_score >= 0 AND geographic_jurisdictional_score <= 100),
  reputation_ethical_score INTEGER CHECK (reputation_ethical_score >= 0 AND reputation_ethical_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Assessment details (JSON for flexibility)
  assessment_details JSONB,

  -- User notes
  notes TEXT,

  -- Metadata
  created_by UUID REFERENCES users(id),
  last_assessed_at TIMESTAMP WITH TIME ZONE,
  last_assessed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor assessment history (for audit trail)
CREATE TABLE IF NOT EXISTS vendor_assessment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Snapshot of scores at time of assessment
  supplier_identification_score INTEGER,
  service_description_score INTEGER,
  information_security_score INTEGER,
  data_protection_score INTEGER,
  compliance_certifications_score INTEGER,
  operational_resilience_score INTEGER,
  incident_breach_history_score INTEGER,
  geographic_jurisdictional_score INTEGER,
  reputation_ethical_score INTEGER,
  overall_score INTEGER,

  -- Full assessment details
  assessment_details JSONB,

  -- Who ran the assessment
  performed_by UUID NOT NULL REFERENCES users(id),

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for vendors
CREATE INDEX IF NOT EXISTS idx_vendors_company_name ON vendors(company_name);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_overall_score ON vendors(overall_score);
CREATE INDEX IF NOT EXISTS idx_vendors_contract_document_id ON vendors(contract_document_id);
CREATE INDEX IF NOT EXISTS idx_vendor_assessment_history_vendor_id ON vendor_assessment_history(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_assessment_history_created_at ON vendor_assessment_history(created_at);

-- Trigger for auto-updating vendors updated_at
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_assessment_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running the script)
DROP POLICY IF EXISTS "Allow public read access to policies" ON policies;
DROP POLICY IF EXISTS "Allow public read access to policy_versions" ON policy_versions;
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Allow public read access to workflow_history" ON workflow_history;
DROP POLICY IF EXISTS "Allow public read access to assets" ON assets;
DROP POLICY IF EXISTS "Allow public read access to documents" ON documents;
DROP POLICY IF EXISTS "Allow all operations for policies" ON policies;
DROP POLICY IF EXISTS "Allow all operations for policy_versions" ON policy_versions;
DROP POLICY IF EXISTS "Allow all operations for users" ON users;
DROP POLICY IF EXISTS "Allow all operations for workflow_history" ON workflow_history;
DROP POLICY IF EXISTS "Allow all operations for assets" ON assets;
DROP POLICY IF EXISTS "Allow all operations for documents" ON documents;
DROP POLICY IF EXISTS "Allow public read access to vendors" ON vendors;
DROP POLICY IF EXISTS "Allow public read access to vendor_assessment_history" ON vendor_assessment_history;
DROP POLICY IF EXISTS "Allow all operations for vendors" ON vendors;
DROP POLICY IF EXISTS "Allow all operations for vendor_assessment_history" ON vendor_assessment_history;

-- Allow public read access to policies
CREATE POLICY "Allow public read access to policies" ON policies FOR SELECT USING (true);
CREATE POLICY "Allow public read access to policy_versions" ON policy_versions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to workflow_history" ON workflow_history FOR SELECT USING (true);
CREATE POLICY "Allow public read access to assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Allow public read access to documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow public read access to vendors" ON vendors FOR SELECT USING (true);
CREATE POLICY "Allow public read access to vendor_assessment_history" ON vendor_assessment_history FOR SELECT USING (true);

-- Allow all operations for authenticated users (simplified for demo)
CREATE POLICY "Allow all operations for policies" ON policies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for policy_versions" ON policy_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for workflow_history" ON workflow_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for documents" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for vendors" ON vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for vendor_assessment_history" ON vendor_assessment_history FOR ALL USING (true) WITH CHECK (true);

-- AWS Evidence Runs table (for storing evidence collection history)
CREATE TABLE IF NOT EXISTS aws_evidence_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Overall score
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- IAM evaluation data
  iam_score INTEGER CHECK (iam_score >= 0 AND iam_score <= 100),
  iam_policy JSONB,
  iam_findings TEXT[],
  iam_recommendations TEXT[],
  iam_error TEXT,

  -- Cognito evaluations (array of pool evaluations)
  cognito_evaluations JSONB,

  -- Raw response data for full audit trail
  raw_response JSONB,

  -- Who ran the collection
  performed_by UUID REFERENCES users(id),

  -- Timestamp
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for aws_evidence_runs
CREATE INDEX IF NOT EXISTS idx_aws_evidence_runs_collected_at ON aws_evidence_runs(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_aws_evidence_runs_performed_by ON aws_evidence_runs(performed_by);
CREATE INDEX IF NOT EXISTS idx_aws_evidence_runs_overall_score ON aws_evidence_runs(overall_score);

-- Enable RLS for aws_evidence_runs
ALTER TABLE aws_evidence_runs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to aws_evidence_runs" ON aws_evidence_runs;
DROP POLICY IF EXISTS "Allow all operations for aws_evidence_runs" ON aws_evidence_runs;

-- RLS policies for aws_evidence_runs
CREATE POLICY "Allow public read access to aws_evidence_runs" ON aws_evidence_runs FOR SELECT USING (true);
CREATE POLICY "Allow all operations for aws_evidence_runs" ON aws_evidence_runs FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for documents (run this in Supabase Dashboard > Storage)
-- Create a bucket named 'documents' with public access
-- Or run: INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- Insert initial assets (Asset Register seed data)
INSERT INTO assets (asset_number, description, serial_number, location, supplier) VALUES
  ('SG-001', 'Dell Monitor U2721DE', 'CN-09DFJ4-WSL00-0CL-CFTW-A04', 'Dubai', 'DELL'),
  ('SG-002', 'Dell Monitor U2721DE', 'CN-09DFJ4-WSL00-0CL-CBDW-A04', 'Dubai', 'DELL'),
  ('SG-003', 'Dell Monitor U2721DE', 'CN-09DFJ4-WSL00-0CL-CFXW-A04', 'Dubai', 'DELL'),
  ('SG-004', 'Dell Monitor U2721DE', 'CN-09DF14-WSLOO-OCL-CFKW-A04', 'Dubai', 'DELL'),
  ('SG-006', 'Dell UltraSharp U2722DE', 'CN-03C6N4-WSL00-23S-AZ8L-A04', 'UK Sunderland', 'DELL'),
  ('SG-007', 'Dell UltraSharp U2722DE', 'CN-03C6N4-WSL00-23S-ARXL-A04', 'UK Sunderland', 'DELL'),
  ('SG-008', 'Dell UltraSharp U2722DE', 'CN-03C6N4-WSL00-23S-015L-A04', 'UK Sunderland', 'DELL'),
  ('SG-009', 'HP Colour Laser MFP 179fnw', 'CNDPJC9301564CB7KOT9N1867', 'UK Sunderland', 'HP'),
  ('SG-010', 'Rexel Optimum AutoFeed+ 150X', 'CO2230400120', 'UK Sunderland', 'Rexel')
ON CONFLICT (asset_number) DO NOTHING;
