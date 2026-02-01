# ISMS-DOC-A12-6 Logging and Monitoring Policy

## 1 Introduction

In order to ensure that Swifty Global information assets are kept secure at all times, it is necessary to monitor the activities of both authorised and unauthorised users to identify any actions that are not in keeping with the secure use of the facilities provided. Such actions may include:

- Unauthorised access attempts
- Unusual use of privileged accounts e.g. administrator
- Attachment of unauthorised removable media devices
- Unusual patterns of activity e.g. late at night
- Changes to system settings

This policy sets out the ways in which such monitoring must be carried out. It should be read in conjunction with document Information Security Incident Response Procedure which sets out what actions are taken if an actual or potential security is detected.

This control applies to all systems, people and processes that constitute the organization's information systems, including board members, directors, employees, suppliers and other third parties who have access to Swifty Global systems.

The following policies and procedures are relevant to this document:

- Information Classification Procedure
- Acceptable Use Policy
- Electronic Messaging Policy
- Internet Acceptable Use Policy

## 2 Logging and Monitoring Policy

### 2.1 Audit Logging

All clients, servers and other equipment (such as network routers and switches) involved in hosting the storage or processing of classified information will have the available audit logging facilities activated to allow the recording and monitoring of activities in the following areas:

- Dates and times of key events e.g. log on/log off
- Successful and rejected systems access attempts
- Successful and rejected data and other resource access attempts
- Changes to system parameters and configurations
- Use of system utilities and applications

This information will provide a picture of what is happening on individual devices such as servers and, where available, within individual applications.

The general principle adopted is that the higher the level of classification of the information held or processed, the greater the level of detail to which the audit logs will record data.

Table 1 below summarises the level of logging that must be in place on each type of device for each classification of information being processed within Swifty Global.

### 2.2 Monitoring System Use

The contents of audit logs will be reviewed on a regular basis according to the:

- Business criticality of the application
- Classification of the information assets involved
- Frequency with which systems have been attacked or compromised previously
- Level of exposure to external networks

It is impossible to manually review all audited events within all audit logs, so it is important that the most critical systems are addressed first and that log events are filtered as much as possible.

Where possible, log management software will be used to identify events worth immediate investigation and to find potential links between events on multiple systems.

For cloud services, the same level of logging must be implemented where possible. The risks associated with a lower level of available logging in a specific cloud service must be assessed and managed.

| Information Classification | Clients | Servers | CloudWatch | MS Portals |
|---------------------------|---------|---------|------------|------------|
| Public | X | | | |
| Protected (Internal) | | X | | |
| Restricted | | | X | X |
| Confidential | | | | |

*Table 1: Level of logging by device type*

The following events will be investigated as a matter of urgency:

- Unauthorised removable device attachment
- Unauthorised download of classified information
- Changes to systems security settings and controls
- Alerts from intrusion detection systems
- Unusual use of privileged accounts e.g. administrator

Investigation will be carried out according to the procedures set out in document Information Security Incident Response Procedure.

### 2.3 Protection of Log Information

Log files will be kept for a period of six months. Strict permissions will be used to ensure that the contents of log files cannot be altered after they have been written. Where possible, key events from log files will be copied to a central point and archived. Backups of log files will be taken on a daily basis.

In a cloud environment and particularly where personally identifiable information (PII) is recorded as part of logging activities, appropriate access control must be in place to prevent such data being used for any other purpose.

### 2.4 Administrator and Operator Logs

Logs will be taken of all administrator and operator activities so that it is possible to identify the actions that were carried out under such user accounts. Whilst this may not be necessary for every system within Swifty Global, those holding classified information or involving a financial element will be monitored more closely.

See the Information Asset Inventory document for more details.

### 2.5 Fault Logging

Error logging will be enabled on all systems and applications dealing with classified information and all reported faults will be investigated to ensure that security controls have not been compromised. Faults will be logged and investigated according to the organization's standard incident management process.

### 2.6 Clock Synchronization

Where possible, all systems will synchronize their date and time either with a single internal source or an appropriate external time source. This is important so that events on different systems can be correctly compared during incident investigation without having to consider differences in system times.

Where cloud services are used, guidance must be obtained from the cloud service provider (CSP) regarding the time source used within their cloud environment. If possible, Swifty Global systems should use the same time source.

Swifty Global uses the AWS Timesync service.
