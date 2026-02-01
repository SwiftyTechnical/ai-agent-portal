const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function generateChangeSummary(
  originalContent: string,
  newContent: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return 'Content updated';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a technical writer assistant. Generate a brief, professional change summary (1-2 sentences) describing what was modified in the document. Focus on the key changes without being verbose.',
          },
          {
            role: 'user',
            content: `Compare these two versions of a policy document and provide a brief change summary.

ORIGINAL VERSION:
${originalContent.substring(0, 3000)}

NEW VERSION:
${newContent.substring(0, 3000)}

Provide a concise change summary (1-2 sentences):`,
          },
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || 'Content updated';
  } catch (error) {
    console.error('Error generating change summary:', error);
    return 'Content updated';
  }
}

export interface ChangeDiff {
  added: string[];
  removed: string[];
  modified: string[];
}

export async function generateChangeDiff(
  originalContent: string,
  newContent: string
): Promise<ChangeDiff> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return { added: [], removed: [], modified: ['Content was updated'] };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a document comparison assistant. Analyze the differences between two versions of a policy document and return a JSON object with three arrays:
- "added": New sections, paragraphs, or significant content that was added
- "removed": Sections, paragraphs, or significant content that was removed
- "modified": Existing content that was changed or reworded

Each item should be a brief description (10-20 words max) of what changed. Focus on meaningful changes, not minor punctuation or formatting. Return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: `Compare these two versions and list the specific changes:

ORIGINAL VERSION:
${originalContent.substring(0, 4000)}

NEW VERSION:
${newContent.substring(0, 4000)}

Return JSON with added, removed, and modified arrays:`,
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || '{}';

    // Parse JSON from response (handle potential markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        added: parsed.added || [],
        removed: parsed.removed || [],
        modified: parsed.modified || [],
      };
    }

    return { added: [], removed: [], modified: ['Content was updated'] };
  } catch (error) {
    console.error('Error generating change diff:', error);
    return { added: [], removed: [], modified: ['Content was updated'] };
  }
}

export interface DocumentClassification {
  documentType: 'nda' | 'agreement' | 'certification' | 'license' | 'policy' | 'contract' | 'report' | 'other';
  companyName: string | null;
  confidence: number;
}

export async function classifyDocument(
  fileName: string,
  textContent?: string
): Promise<DocumentClassification> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return { documentType: 'other', companyName: null, confidence: 0 };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a document classification assistant. Based on the filename and any provided content, classify the document into one of these categories:
- nda: Non-Disclosure Agreements, confidentiality agreements
- agreement: General business agreements, partnerships, terms
- certification: ISO certifications, compliance certificates, accreditations
- license: Software licenses, business licenses, permits
- policy: Company policies, procedures, guidelines
- contract: Employment contracts, service contracts, purchase agreements
- report: Reports, audits, assessments
- other: Documents that don't fit other categories

Also extract the company name if mentioned (the other party, not your own company).

Return ONLY valid JSON with:
- "documentType": one of the categories above
- "companyName": string or null if not found
- "confidence": number 0-100 indicating classification confidence`,
          },
          {
            role: 'user',
            content: `Classify this document:
Filename: ${fileName}
${textContent ? `Content preview: ${textContent.substring(0, 2000)}` : ''}

Return JSON with documentType, companyName, and confidence:`,
          },
        ],
        max_tokens: 150,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || '{}';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        documentType: parsed.documentType || 'other',
        companyName: parsed.companyName || null,
        confidence: parsed.confidence || 50,
      };
    }

    return { documentType: 'other', companyName: null, confidence: 0 };
  } catch (error) {
    console.error('Error classifying document:', error);
    return { documentType: 'other', companyName: null, confidence: 0 };
  }
}

export interface DocumentReview {
  missingAreas: string[];
  suggestions: string[];
  overallScore: number;
}

export interface GeneratedMarkup {
  content: string;
  insertAfter: string | null;
}

export async function generateMarkupContent(
  documentContent: string,
  missingArea: string,
  documentType: string = 'IT policy'
): Promise<GeneratedMarkup> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return { content: '', insertAfter: null };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: `You are a policy document expert specializing in ISO 27001 and ISMS documentation. Your task is to generate content that fills a gap identified in a ${documentType} document.

Requirements:
1. Match the existing document's style, tone, and formatting exactly
2. Generate professional, audit-ready content
3. Use markdown formatting consistent with the document
4. Keep the content concise but comprehensive
5. Include appropriate subsections if needed

Return ONLY valid JSON with:
- "content": The markdown content to add (matching document style)
- "insertAfter": The exact section heading (e.g., "## Section Name") after which this content should be inserted, or null to append at the end`,
          },
          {
            role: 'user',
            content: `Document being reviewed:

${documentContent.substring(0, 8000)}

---

Missing area identified: "${missingArea}"

Generate the appropriate content to address this gap. Return JSON with "content" and "insertAfter" fields.`,
          },
        ],
        max_completion_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const responseContent = data.choices[0]?.message?.content?.trim() || '{}';

    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        content: parsed.content || '',
        insertAfter: parsed.insertAfter || null,
      };
    }

    return { content: '', insertAfter: null };
  } catch (error) {
    console.error('Error generating markup content:', error);
    return { content: '', insertAfter: null };
  }
}

export async function reviewDocumentForGaps(
  content: string,
  documentType: string = 'IT policy'
): Promise<DocumentReview> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return { missingAreas: [], suggestions: [], overallScore: 0 };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: `You are acting as an ISO 27001 / ISMS auditor and security governance expert. I will provide you with one specific ISMS document eg Policy, Standard, Procedure or Guideline. Analyze the provided ${documentType} document.

            Important context and constraints:
- Review the document only within its intended scope
- Assume all other ISMS documents exist and are adequate
- Do not recommend controls that clearly belong in other policies unless this document is missing a cloud specific / topic specific governance statement
- Avoid duplicating areas such as logging, access control, incident response, vulnerability management, etc. if they are normally covered elsewhere in ISO
- Focus on clarity, completeness, governance, and audit defensibility for this document alone

Your tasks

- Provide your response in bullet points only and include the following sections in this order:
- Missing or weak areas (within this document’s scope only)
- Identify genuine gaps, ambiguities, or under specified requirements
- Focus on topic specific governance expectations eg cloud, suppliers, access, data, etc.
- Targeted suggestions for improvement
- Improvements must remain within the scope of this document
- No operational or technical detail that belongs in procedures or standards
- What is strong and audit positive
- Call out good practices, ISO alignment, and strengths
- Overall assessment and score
- Give a concise qualitative summary

Provide an overall score out of 10 based on ISO 27001 expectations and audit readiness

Return ONLY a valid JSON object with:
- "missingAreas": array of bullet points describing what's missing (only items specific to this policy type per ISO standards)
- "suggestions": array of improvement suggestions (only for this policy's scope)
- "overallScore": number from 0-100 indicating completeness against ISO requirements for this policy type`,
          },
          {
            role: 'user',
            content: `Review this ${documentType} document for completeness and gaps:

${content.substring(0, 6000)}

Return JSON with missingAreas, suggestions, and overallScore:`,
          },
        ],
        max_completion_tokens: 4000,
        temperature: 1,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const responseContent = data.choices[0]?.message?.content?.trim() || '{}';

    // Parse JSON from response
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        missingAreas: parsed.missingAreas || [],
        suggestions: parsed.suggestions || [],
        overallScore: parsed.overallScore || 0,
      };
    }

    return { missingAreas: [], suggestions: [], overallScore: 0 };
  } catch (error) {
    console.error('Error reviewing document:', error);
    return { missingAreas: [], suggestions: [], overallScore: 0 };
  }
}
