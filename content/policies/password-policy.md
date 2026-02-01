# ISMS-DOC-A12-5 Password Policy

## 1 Introduction

This policy applies to all users of the {{company}}, including both users of the platform and back office accounts. AWS is used as the access management solution through AWS IAM and AWS Cognito. Users must comply with this password policy for accessing any platform resources.

## 2 Password Policy

**General Password Requirements**

- **Password Length**: Passwords must have a minimum length of **12 characters**.
- **Password Complexity**: Passwords must contain:
  - At least **one lowercase** letter (a-z).
  - At least **one number** (0-9).
  - At least **one non-alphanumeric character** (e.g., ! @ # $ % ^ & * ( ) _ + - = [ ] { } | ').
- **Password Change and Expiration**:
  - Passwords must be changed every **90 days**.
  - Users are allowed to change their own passwords at any time.
  - Passwords must not be identical to the AWS account name or email address.
  - Password reuse is not allowed within a three-password cycle.
- **Account Lockout**: After three consecutive failed log-on attempts for players, intervention by the licensed operator is required.

## 3 Multi-Factor Authentication (MFA)

- **Two-Factor Authentication (2FA)** is required for all back-office accounts. MFA will be provided through AWS services to ensure secure access.

## 4 Password Protection and Best Practices

- **Avoid Predictable Passwords**: Do not use easily guessable information, such as birthdays, common phrases, or previously used passwords.
- **Never Share Passwords**: Passwords are confidential and should not be shared with anyone.
- **Reporting Compromised Passwords**: If users suspect that their password has been compromised, they must report it immediately and change the password.
- **Password Storage**: Users should not store passwords in plaintext. If necessary, they must use a password manager that is approved by IT security.

## 5 Enforcing and Monitoring Compliance

- Password policies will be enforced by AWS IAM and AWS Cognito settings, ensuring compliance with the organization's security requirements.
- Regular audits will be conducted to verify that password requirements are being followed.

## 6 Exceptions

- Any exceptions to this policy must be approved by Chief Technology Officer.
