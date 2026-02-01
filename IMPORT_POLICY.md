# Policy Import Prompt

Use this prompt to import PDF policy documents into markdown format for the AI Agent Portal.

## Instructions

When importing a PDF policy document to markdown:

### 1. File Naming Convention
- Use kebab-case for the filename
- Extract the policy name from the document title
- Example: `ISMS-DOC-A09-1 Access Control Policy` → `access-control-policy.md`

### 2. Content to SKIP (Headers/Footers/Administrative)
- **Cover page**: Title page with logo, document code, version, date, copyright
- **Document Control section**: Version tables, reviewer/approver signatures
- **Contents/Table of Contents**: Auto-generated page listings
- **Page headers**: Swifty logo in top right
- **Page footers**: Version number, date, "Internal Use Only", page numbers (e.g., "v1.4, 23 Jan 2025 / Internal Use Only / Page X of Y")

### 3. Content to INCLUDE
- Start from "1 Introduction" or the first numbered section
- Include all numbered sections (1, 2, 2.1, 2.2, etc.)
- Include all policy content, bullet points, and tables

### 4. Markdown Formatting Rules

#### Title
```markdown
# ISMS-DOC-XXX Policy Title
```

#### Section Headings
- Main sections: `## 1 Section Title`
- Subsections: `### 1.1 Subsection Title`

#### Lists
- Use `-` for bullet points
- Use `1.` for numbered lists
- Use `**bold**` for emphasis

#### Tables
Convert PDF tables to markdown tables:
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
```

#### Paragraphs
- Preserve paragraph breaks
- Keep related content together

### 5. Output Location
Save converted files to: `content/policies/`

## Example Conversion

**PDF Input** (ISMS-DOC-A09-1 Access Control Policy):
```
[Cover Page - SKIP]
[Document Control - SKIP]
[Contents - SKIP]

1 Introduction
This document defines the access control policy...

2 Policy
2.1 User Registration
All users must be registered...
```

**Markdown Output** (`access-control-policy.md`):
```markdown
# ISMS-DOC-A09-1 Access Control Policy

## 1 Introduction

This document defines the access control policy...

## 2 Policy

### 2.1 User Registration

All users must be registered...
```

## Import Command

To import policy documents, place PDF files in `content/import/` and run:

```
Import all PDF files from content/import/ to content/policies/ as markdown files.
Follow the formatting rules in IMPORT_POLICY.md.
Skip headers, footers, cover pages, document control, and table of contents.
Preserve all policy content and formatting.
```
