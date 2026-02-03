import jsPDF from 'jspdf';
import type { Policy } from '../types/database';

const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || 'Company Name';

// Convert markdown to plain text
function markdownToText(markdown: string): string {
  return markdown
    // Remove headers but keep the text
    .replace(/^#{1,6}\s+(.*)$/gm, '$1\n')
    // Remove bold/italic markers
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove links but keep text
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // Remove inline code
    .replace(/`(.+?)`/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Clean up bullet points
    .replace(/^\s*[-*+]\s+/gm, '  • ')
    // Clean up numbered lists
    .replace(/^\s*\d+\.\s+/gm, '  ')
    // Remove extra blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Parse markdown into sections for better formatting
function parseMarkdownSections(markdown: string): { level: number; title: string; content: string }[] {
  const sections: { level: number; title: string; content: string }[] = [];
  const lines = markdown.split('\n');
  let currentSection: { level: number; title: string; content: string } | null = null;
  let contentBuffer: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);

    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = contentBuffer.join('\n').trim();
        sections.push(currentSection);
      }

      currentSection = {
        level: headerMatch[1].length,
        title: headerMatch[2],
        content: ''
      };
      contentBuffer = [];
    } else {
      contentBuffer.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = contentBuffer.join('\n').trim();
    sections.push(currentSection);
  } else if (contentBuffer.length > 0) {
    // No headers found, treat entire content as one section
    sections.push({
      level: 0,
      title: '',
      content: contentBuffer.join('\n').trim()
    });
  }

  return sections;
}

export function generatePolicyPDF(policy: Policy): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const headerHeight = 25;
  const footerHeight = 20;
  let currentY = headerHeight + 10;
  let pageNumber = 1;

  // Helper function to add header to current page
  const addHeader = () => {
    // Company name (left)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text(COMPANY_NAME, margin, 15);

    // Internal Use Only (right)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Red color
    doc.text('Internal Use Only', pageWidth - margin, 15, { align: 'right' });

    // Line under header
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, headerHeight, pageWidth - margin, headerHeight);
  };

  // Helper function to add footer to current page
  const addFooter = () => {
    const footerY = pageHeight - 15;

    // Line above footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    // Page number (center)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, footerY, { align: 'center' });

    // Internal Use Only (left)
    doc.setFontSize(8);
    doc.text('Internal Use Only', margin, footerY);

    // Document reference (right)
    const version = `v${policy.major_version || 1}.${policy.minor_version || 0}`;
    doc.text(version, pageWidth - margin, footerY, { align: 'right' });
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - footerHeight - 10) {
      addFooter();
      doc.addPage();
      pageNumber++;
      addHeader();
      currentY = headerHeight + 10;
    }
  };

  // Helper function to add wrapped text
  const addWrappedText = (text: string, fontSize: number, isBold: boolean = false, indent: number = 0): number => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(51, 51, 51);

    const effectiveWidth = contentWidth - indent;
    const lines = doc.splitTextToSize(text, effectiveWidth);
    const lineHeight = fontSize * 0.5;

    for (const line of lines) {
      checkPageBreak(lineHeight);
      doc.text(line, margin + indent, currentY);
      currentY += lineHeight;
    }

    return lines.length * lineHeight;
  };

  // Start first page
  addHeader();

  // Document Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);

  const titleLines = doc.splitTextToSize(policy.title, contentWidth);
  for (const line of titleLines) {
    doc.text(line, margin, currentY);
    currentY += 8;
  }
  currentY += 5;

  // Document metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  const version = `Version: ${policy.major_version || 1}.${policy.minor_version || 0}`;
  const status = `Status: ${policy.workflow_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
  const lastUpdated = `Last Updated: ${new Date(policy.updated_at).toLocaleDateString()}`;

  doc.text(version, margin, currentY);
  currentY += 5;
  doc.text(status, margin, currentY);
  currentY += 5;
  doc.text(lastUpdated, margin, currentY);
  currentY += 10;

  // Separator line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Parse and render content
  const sections = parseMarkdownSections(policy.content);

  for (const section of sections) {
    if (section.title) {
      // Add spacing before sections
      checkPageBreak(15);
      currentY += 5;

      // Section header
      let headerFontSize = 14;
      if (section.level === 1) headerFontSize = 16;
      else if (section.level === 2) headerFontSize = 14;
      else if (section.level >= 3) headerFontSize = 12;

      addWrappedText(section.title, headerFontSize, true);
      currentY += 3;
    }

    if (section.content) {
      // Process content - convert markdown formatting to plain text
      const cleanContent = markdownToText(section.content);
      const paragraphs = cleanContent.split('\n\n');

      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          // Handle bullet points
          const lines = paragraph.split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              const isBullet = trimmedLine.startsWith('•');
              const indent = isBullet ? 5 : 0;
              addWrappedText(trimmedLine, 10, false, indent);
            }
          }
          currentY += 3;
        }
      }
    }
  }

  // Add footer to last page
  addFooter();

  // Save the PDF
  const filename = `${policy.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_v${policy.major_version || 1}.${policy.minor_version || 0}.pdf`;
  doc.save(filename);
}

// Generate PDF and return as blob (for bulk download)
export function generatePolicyPDFBlob(policy: Policy): { blob: Blob; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const headerHeight = 25;
  const footerHeight = 20;
  let currentY = headerHeight + 10;
  let pageNumber = 1;

  // Helper function to add header to current page
  const addHeader = () => {
    // Company name (left)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text(COMPANY_NAME, margin, 15);

    // Internal Use Only (right)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Red color
    doc.text('Internal Use Only', pageWidth - margin, 15, { align: 'right' });

    // Line under header
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, headerHeight, pageWidth - margin, headerHeight);
  };

  // Helper function to add footer to current page
  const addFooter = () => {
    const footerY = pageHeight - 15;

    // Line above footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    // Page number (center)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, footerY, { align: 'center' });

    // Internal Use Only (left)
    doc.setFontSize(8);
    doc.text('Internal Use Only', margin, footerY);

    // Document reference (right)
    const version = `v${policy.major_version || 1}.${policy.minor_version || 0}`;
    doc.text(version, pageWidth - margin, footerY, { align: 'right' });
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - footerHeight - 10) {
      addFooter();
      doc.addPage();
      pageNumber++;
      addHeader();
      currentY = headerHeight + 10;
    }
  };

  // Helper function to add wrapped text
  const addWrappedText = (text: string, fontSize: number, isBold: boolean = false, indent: number = 0): number => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(51, 51, 51);

    const effectiveWidth = contentWidth - indent;
    const lines = doc.splitTextToSize(text, effectiveWidth);
    const lineHeight = fontSize * 0.5;

    for (const line of lines) {
      checkPageBreak(lineHeight);
      doc.text(line, margin + indent, currentY);
      currentY += lineHeight;
    }

    return lines.length * lineHeight;
  };

  // Start first page
  addHeader();

  // Document Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);

  const titleLines = doc.splitTextToSize(policy.title, contentWidth);
  for (const line of titleLines) {
    doc.text(line, margin, currentY);
    currentY += 8;
  }
  currentY += 5;

  // Document metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);

  const version = `Version: ${policy.major_version || 1}.${policy.minor_version || 0}`;
  const status = `Status: ${policy.workflow_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
  const lastUpdated = `Last Updated: ${new Date(policy.updated_at).toLocaleDateString()}`;

  doc.text(version, margin, currentY);
  currentY += 5;
  doc.text(status, margin, currentY);
  currentY += 5;
  doc.text(lastUpdated, margin, currentY);
  currentY += 10;

  // Separator line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Parse and render content
  const sections = parseMarkdownSections(policy.content);

  for (const section of sections) {
    if (section.title) {
      // Add spacing before sections
      checkPageBreak(15);
      currentY += 5;

      // Section header
      let headerFontSize = 14;
      if (section.level === 1) headerFontSize = 16;
      else if (section.level === 2) headerFontSize = 14;
      else if (section.level >= 3) headerFontSize = 12;

      addWrappedText(section.title, headerFontSize, true);
      currentY += 3;
    }

    if (section.content) {
      // Process content - convert markdown formatting to plain text
      const cleanContent = markdownToText(section.content);
      const paragraphs = cleanContent.split('\n\n');

      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          // Handle bullet points
          const lines = paragraph.split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              const isBullet = trimmedLine.startsWith('•');
              const indent = isBullet ? 5 : 0;
              addWrappedText(trimmedLine, 10, false, indent);
            }
          }
          currentY += 3;
        }
      }
    }
  }

  // Add footer to last page
  addFooter();

  // Return the PDF as blob
  const filename = `${policy.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_v${policy.major_version || 1}.${policy.minor_version || 0}.pdf`;
  const blob = doc.output('blob');
  return { blob, filename };
}
