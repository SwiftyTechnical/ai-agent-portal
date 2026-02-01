# ISMS-DOC-A12-1 Management of Technical Vulnerabilities

## 1 Introduction

The purpose of this policy is to define the approach for identifying, assessing, and managing vulnerabilities in Swifty Global's information systems, ensuring that all vulnerabilities are addressed in a timely and effective manner. This policy supports the organization's commitment to safeguarding the confidentiality, integrity, and availability of information assets in line with ISO/IEC 27001:2022, specifically control A.12.6.1 (Management of Technical Vulnerabilities).

## 2 Scope

This policy applies to all Swifty Global information systems, including applications, servers, databases, network infrastructure, and any cloud services hosted on AWS. It covers all employees, contractors, and third-party service providers who manage or have access to these systems.

## 3 Roles and Responsibilities

- **Information Security Manager:** Responsible for overseeing the vulnerability management process and ensuring compliance with this policy.
- **IT Operations Team:** Responsible for conducting vulnerability assessments, applying patches, and remediating vulnerabilities.
- **Third-Party Providers:** Must comply with this policy and report any vulnerabilities discovered in systems managed on behalf of Swifty Global.

## 4 Vulnerability Assessment Tools and Services

Swifty Global employs the following AWS services for continuous monitoring and vulnerability assessments:

- **AWS GuardDuty:** Provides continuous threat detection and monitors malicious activity and unauthorized behavior.
- **AWS Inspector:** Automatically assesses applications for exposure, vulnerabilities, and deviations from best practices.
- **AWS WAF (Web Application Firewall):** Protects applications by filtering and monitoring HTTP requests to mitigate common web exploits.
- **AWS Load Balancer:** Ensures high availability and distributes traffic while providing integrated monitoring capabilities.

## 5 Policy Statements

### 5.1 Regular Vulnerability Scans

- Automated vulnerability scans must be conducted weekly using AWS Inspector.
- Critical systems are to be scanned more frequently, as determined by the Information Security Manager.

### 5.2 Threat Detection and Monitoring

- AWS GuardDuty must run continuously to detect and report suspicious activities.
- Alerts from AWS GuardDuty are to be triaged and addressed based on severity.

### 5.3 Patch Management

- Identified vulnerabilities must be prioritized based on risk and patched in accordance with the following timelines:
  - **Critical vulnerabilities:** Within 24 hours
  - **High vulnerabilities:** Within 3 days
  - **Medium vulnerabilities:** Within 7 days
  - **Low vulnerabilities:** Within 30 days

### 5.4 Web Application Protection

AWS WAF must be configured to block known exploits and prevent common vulnerabilities such as SQL injection and cross-site scripting (XSS).

### 5.5 Incident Response Integration

Any vulnerabilities that result in security incidents must be reported and managed according to the Incident Response Plan.

### 5.6 Logging and Monitoring

All vulnerability assessment activities must be logged and monitored in accordance with ISMS-DOC-A12-6 Logging and Monitoring Policy.

## 6 Reporting and Documentation

- All vulnerabilities, actions taken, and remediation outcomes must be documented.
- Reports from AWS GuardDuty, Inspector, and WAF must be reviewed weekly by the Information Security Manager.
- Vulnerability assessment reports must be retained for a minimum of 5 years.

## 7 Review and Continuous Improvement

This policy will be reviewed annually or after any significant changes to the IT infrastructure or AWS services. Continuous improvement will be driven through regular audits, lessons learned from incidents, and feedback from stakeholders.

## 8 Compliance and Exceptions

Non-compliance with this policy may result in disciplinary action. Exceptions to this policy must be approved by the Information Security Manager and documented with a valid business justification.
