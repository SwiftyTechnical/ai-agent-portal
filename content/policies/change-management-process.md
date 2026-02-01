# ISMS-DOC-A12-2 Change Management Process

## 1 Introduction

The purpose of this document is to set out the Swifty Global process of change management. The objective of this process is to ensure that changes to IT services and their associated components are recorded and then evaluated, authorized, prioritized, planned, tested, implemented, documented and reviewed in a controlled manner.

A change request may arise for many reasons, including the following:

- An incident or problem
- New hardware installation
- New functionality
- IT Infrastructure upgrades
- New or changed legislation
- Changed business requirements or direction
- Retirement of service

A change request must be assessed for impact (including information security implications) and resource requirements before being considered by the Change Advisory Board (CAB). To assist with impact assessment, the identification of related systems/components affected by the proposed change and input from other affected support groups may be required.

After assessment, if the change is deemed acceptable it will be authorised by the CAB. Once implemented the change will be reviewed and subject to the findings of the review, closed.

This document should be read in conjunction with the following documents:

- Secure Development Policy
- Information Classification Procedure

## 2 Categories of change

The following categories of change will be used:

- Standard / Normal
- Emergency

This document relates to the last three of these categories, the normal, emergency and major changes. Standard changes are low-risk, pre-approved changes and so do not need to follow the full review and approval process. Standard changes will still be recorded in the service desk system and the implementation process of each standard change will be fully documented.

Each of these categories will require different processing as follows:

### 2.1 Normal changes

These are "business as usual" changes which are expected to make up most of the change requests that are logged and handled through the change management process as described in this document. Although not emergencies, they will be prioritised in order that resources can be allocated in as effective a manner as possible.

### 2.2 Emergency changes

Whilst all changes likely to be required should be foreseen and planned, there will be occasions when business requirements demand that changes be made in an emergency situation. Such changes are those requests which impact on internal or external 'live' systems and require implementation in order to resolve (or prevent) a current high priority incident or problem. In such cases a change request must be raised immediately even if the full change details are not available and the CAB must be notified. This is to ensure that all parties are aware at the earliest opportunity.

From initial logging of the change, the principles of the normal change management process should be observed as far as is realistic, however, as an emergency changes may require swift approval from the CAB an Emergency CAB (E-CAB) meeting may be held.

If an emergency change cannot be formally authorised after reasonable efforts have been made to follow the process (e.g. out of hours) a local decision may be made as to whether this change will be implemented. However, details of the change must still be recorded, and the change management process followed retrospectively to ensure that records are maintained accurately and the success or failure of the change can be reviewed.

Where timescales allow it, the Change Manager in collaboration with the relevant support groups will ensure the following:

- Sufficient staff and resources are available to action and support the change request
- Back-out plans have been documented and passed to the change Implementer
- As much testing as possible of the emergency change has been completed

When an emergency change request is logged the Change Manager will do the following:

- Assess who should form the Emergency Change Advisory Board (E-CAB)
- Communicate with each member of the E-CAB by whatever means is appropriate (face-to-face, telephone, email) to obtain a combined impact assessment

The remainder of the process will then continue but under the auspices of the E-CAB rather than the scheduled CAB i.e. as quickly as possible whilst retaining control and managing risk

Changes processed as emergencies will be reviewed by the CAB on a regular basis to ensure that they are genuine emergencies and do not arise from a lack of forward planning.

## 3 Change management process

### 3.1 Process narrative

The following steps are carried out in the change management process.

| Step | Role | Description |
|------|------|-------------|
| Raise change request | Change Initiator | Create a change record within the service desk system detailing all the required information |
| Classify and Review CR for completeness | Change Manager | The change request needs to be checked that all the required information has been entered. The change should be referred or rejected if it is: Totally impractical, A duplicate change request, Incomplete |
| Amend CR | Change Initiator | The addition of further information if required or clarification of existing information |
| Classify and Assess CR | Change Manager | Assess whether the change request is Major, Normal or an Emergency |
| Refer to IT Steering Group | Change Manager/ Change Advisory Board | If the change is categorised as Major, then it will be referred to the IT Steering Group as a possible project |
| Assess a Normal change request for technical and business risk | Change Advisory Board | The implications of the proposed change are assessed from a business and a technical point of view. This should include the timing and impact on information security, capacity, service continuity plans and release management, amongst other areas |
| Assess an Emergency change request for technical and business risk | Emergency Change Advisory Board | The change is assessed as for a Normal change but in an accelerated timescale either face to face or via telephone, email etc. |
| Approve, reject or refer the change request | Change Advisory Board/ ECAB | Approve if OK, reject if not. Refer back to change initiator if more information required |
| Schedule Change | Change Manager | Inform the Change Initiator of the result of the CAB and enter the change on the change schedule |
| Prepare and Test Change | Change Implementer | Plan the mechanics of the change and test it where appropriate e.g. in a test environment |
| Implement Change | Change Implementer | Make the change on the date and time scheduled. Test to ensure it has worked successfully |
| Back-Out Change | Change Implementer | Remove the change if unsuccessful |
| Report Success | Change Implementer | Inform the Change Manager that the change was implemented successfully |
| Review Change | Change Advisory Board | Review the change records to ensure that no related incidents or problems have arisen since the change was made |
| Close Change as successful | Change Advisory Board | Close the change record with a status of successful |
| Close Change as Unsuccessful | Change Manager | Close the change record with a status of unsuccessful |

### 3.2 Process roles and responsibilities

#### 3.2.1 Change initiator

- May be within the business (business generated changes) or within IT (Infrastructure changes)
- Responsible for identifying the need for a change and providing the required information to allow the change request to be assessed
- Works with the change builder to define the exact requirements of the change
- May be involved in user acceptance testing of the change once built

#### 3.2.2 Change manager

- Owner of the change management process
- Responsible for identifying improvements to the process and ensuring it is adequately resourced
- Provides information regarding the success rates of the process
- Chairs the Change Advisory Board meetings and co-ordinates its activities
- Runs the process on a day-to-day basis
- Performs the initial check and classification of changes
- Maintains the change schedule and ensures that all changes are in the correct status

#### 3.2.3 (Emergency) Change Advisory Board (CAB)

- Reviews and approves or rejects normal and emergency changes based on the information provided
- Ensuring that all changes to the production environment are adequately assessed for risk avoidance and impact, including on information security
- Approving changes presented that meet business needs and conform to change management rules
- Confirming the priority of authorised changes
- Verifying where possible that resources are committed to executing authorised changes to agreed schedules
- Resolving conflicts in the change schedule
- Verifying that valid test plans are produced for changes in order to protect the production environment
- Taking corrective action against any person/group who attempts to circumvent the change management process
- Reviewing historical records of changes to ensure that the process is running as required

#### 3.2.4 Change implementer

- Works with the change initiator to define the requirements in more detail
- Creates the items necessary for the change (e.g. new or revised software programs)
- Performs system testing and liaises with the change originator to perform UAT
- Plans the details of the change, tests it prior and post implementation
- Provides feedback to the change manager on the status of the change

### 3.3 RACI matrix

The table below clarifies the responsibilities at each step using the RACI method, i.e.:

- R: Responsible
- A: Accountable
- C: Consulted
- I: Informed

| Step | Change Initiator | Change Manager | CAB | Change Implementer |
|------|------------------|----------------|-----|-------------------|
| Raise change request | A/R | I | I | |
| Classify and Review CR for completeness | C | R | A | |
| Amend CR | A/R | C | I | |
| Classify and Assess CR | I | R | A | |
| Refer to IT Steering Group | I | C | R/A | |
| Assess a Normal change request for technical and business risk | C | I | R/A | |
| Assess an Emergency change request for technical and business risk | C | I | R/A | |
| Approve, reject or refer the change request | I | I | R/A | |
| Schedule Change | I | R | A | I |
| Prepare and Test Change | | | A | R |
| Implement Change | I | I | A | R |
| Back-out Change | I | I | A | R |
| Report Success | I | I | A | R |
| Review Change | I | I | R/A | I |
| Close Change as successful | I | I | R/A | I |
| Close Change as Unsuccessful | I | I | R/A | I |

## 4 Change advisory board

### 4.1 CAB meetings

The volume and classification of changes will be reviewed during the first few months of operation of the change management process to help to decide the most appropriate frequency of full CAB meetings.

The general principle is that all relevant parties are consulted regarding a change that may affect them and these parties may be different according to the scope of a specific change. Therefore, a process of approval via email or telephone may be used in advance of a full CAB meeting if the timescale of the change requires a decision before the next meeting.

The relevant parties for the approval of a change will usually be as a minimum:

- User departments affected
- Application support team

Suppliers may also be invited where appropriate.

### 4.2 Changes notified by cloud service providers

Changes notified to Swifty Global by cloud service providers (CSPs) will be assessed as part of CAB meetings in order to understand and plan for the impact of these changes on the change schedule and on the organization as a whole.

Where appropriate, further information about upcoming changes should be requested from the CSP to allow an accurate impact assessment to be made.

## 5 Reporting

### 5.1 Change schedule

The Change Manager is responsible for issuing the change schedule on a weekly basis. This will set out details of the changes to be implemented in the next one month. The following information will be included:

- Date and time of implementation
- Change number
- Change description
- Systems and users impacted
- Expected duration of change

Changes by our organization, or by a supplier that provides supporting services, that affect cloud service customers will be notified to cloud service customer administrators as early as possible to give the customer adequate time to prepare for any required service outages. The above information will be provided.

### 5.2 Reports for CAB

The following reports will be produced by the Change Manager on a regular basis and reviewed as part of the CAB meetings in order to identify trends and possible process improvements:

- Number of changes raised and closed by week/month
- Breakdown of categories of change requests raised i.e. Normal, Emergency
- Average time to process a change request of each category
- Percentage successful change requests
- Sources of change requests e.g. business area
- Types of change requests e.g. server, network or by business application

Requirements for further reports will be reviewed on a regular basis. Identified improvements will be input to the continual improvement plan.
