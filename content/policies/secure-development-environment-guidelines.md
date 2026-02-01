# ISMS-DOC-A14-1 Secure Development Environment Guidelines

## 1 Introduction

This document sets out guidelines for the establishment and maintenance of a secure development environment. This is essential for the development of secure software that provides good functionality for the organization whilst minimising risk.

The software development lifecycle sits mainly within the Design and Development stage of the project process and consists of the following sub-stages:

- Business requirements specification
- System design
- Development
- Testing

The main focus of this document is on the development and testing sub-stages, although some of the guidelines are relevant to the earlier sub-stages also.

This policy should be read in conjunction with the following documents which give more detail in specific areas:

- Change Management Process
- Secure Development Policy
- Employee Screening Checklist
- Segregation of Duties Guidelines
- Segregation of Duties Worksheet

These documents are available within the ISMS.

## 2 Secure Development Environment

### 2.1 Components of a Secure Development Environment

Often it is easy to focus on the technology aspects of software development, but a secure development environment includes controls related to each of the areas of people, process and technology.

The level of security required in the development environment will depend largely upon the assets to be protected. This will be decided based on a risk assessment for the specific project which will consider issues such as:

- The sensitivity and classification of the data involved
- The value of the application to be developed to the organization
- The legal, regulatory and contractual environment the system must operate within
- The existing systems the application will be interfaced or integrated with

The controls decided upon should be documented and referenced back to the risks they are intended to mitigate.

### 2.2 People

As with many aspects of information security people are probably the single most important factor in the ability to provide a secure development environment. Having a team that can be trusted to develop code in a secure way and protect the information related to the system is essential to success.

The following specific controls should be considered when creating a development team that is required to create secure software.

#### 2.2.1 Employee Screening

It is recommended that effective screening procedures be implemented as part of the initial recruitment process for development staff. This should be dependent on the level and type of role being recruited for and may cover some or all the following:

- Personal references
- Work references
- Confirmation of academic and professional qualifications
- CV work history verification
- Criminal records check

For development staff that are already with the organization at the start of the project this will be a matter of judgement of the management of the project to decide whether any further checks would be appropriate. This might be the case for particularly sensitive projects for example when starting a financial development, it may advisable to refresh checks to do with credit and criminal records. If considering this, it is advisable to seek legal guidance on what is permissible under employment law before proceeding.

#### 2.2.2 Development Competence and Training

The level of experience and competence of the development team in the security aspects of the technology components being used and developed during the project should be assessed and any requirements for additional training identified.

Individual developers may be knowledgeable about a particular development language but inexperienced in the use of secure coding guidelines which will tend to change over time as vulnerabilities are identified.

#### 2.2.3 Segregation of Duties

The roles and responsibilities of the development team should be clearly defined at the start of the project. Care should be taken to limit the exposure of the organization to fraudulent activity within the development process. Duties involving development, acceptance testing and promotion of code into live should be separated so that they are performed by different people.

### 2.3 Process

Process and procedural controls within the development environment will help to ensure that risk is minimised and the potential for accidental or deliberate breaches of security is removed.

#### 2.3.1 Separation of Development, Testing and Operational Environments

During any particular project a number of technical environments may be required. These may include:

- Development
- Integration testing
- User acceptance testing
- Training
- Pre-production
- Production

These environments will typically consist of a copy of the software, database, environment variables and associated utilities stored in a separate area of the system.

The number and types of environments required will depend on the project and may vary with time, some being temporary and removed after go-live (or before). Care must be taken to ensure that these environments remain separate and that the procedures used for moving objects between environments are documented, tested and followed carefully each time.

#### 2.3.2 Access Control

Even though the system may not be live, the control of access to the various environments must be carefully designed and implemented in line with the principle of segregation of duties discussed earlier in these guidelines.

In line with the organization's access control policy, developers should have their own user accounts and should not have access to the test or live environments. Care should be taken so that the creation of user accounts for developers does not involve the assignment of excessive privileges that will remain after go-live.

#### 2.3.3 Development Procedures

The way in which the environment will be accessed, and the development of code managed should be documented in development procedures. These should be made available to all developers together with appropriate training if required. It should be emphasised that the use of documented procedures and standard ways of working is mandatory and that individual variations are not permitted.

#### 2.3.4 Version Control

Effective version control and software configuration management procedures must be implemented from the start of the development including measures for source code check in/check out.

Software versioning should be automated where possible using a version control tool that increments the version number whenever the item is checked in/out or changed.

#### 2.3.5 Code Monitoring

Where appropriate tools are available changes to the environment and the code stored within it should be monitored for unauthorised changes. This will help to pick up instances where development procedures are not being followed or fraudulent activity is suspected.

#### 2.3.6 Backups

Adequate measures should be put in place to ensure that regular backups are taken of the development and other environments. Although the system may not be live, the cost in man days of the loss of development effort could be considerable. An appropriate backup strategy should be agreed with IT operations so that frequently changing objects are backed up at least daily and less volatile items at least weekly.

### 2.4 Technology

Guidelines for the secure use of technology will be very specific to the individual components and the version you decide to adopt for the project.

#### 2.4.1 Programming Languages and Coding Guidelines

Once decisions have been made within the development project regarding the technical components such as programming languages and databases that will be used, specific guidelines should be established for the secure use of these components. These may typically be available from the suppliers of the components, although other sources may also be used to provide an alternative view of inherent vulnerabilities etc.

These coding guidelines should be made available to each member of the development team and a watch kept for relevant updates.

#### 2.4.2 Secure Repositories

Developed code and other types of program and configuration components should be stored in a secure repository to which access is restricted according to the access control policy in force for the project.

An appropriate structure for the repository should be designed as part of the planning stage of the development.
