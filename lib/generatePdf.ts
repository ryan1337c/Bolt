// lib/generatePdf.ts
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import fs from 'fs/promises';
import fontkit from '@pdf-lib/fontkit';

// Interface is unchanged
interface ResumeData {
    name: string;
    email: string;
    phone: string;
    linkedIn?: string;
    github?: string;
    education?: Array<{
        degree: string;
        institution: string;
        date: string;
        bulletPoints?: string[];
    }>;
    projects?: Array<{
        name: string;
        date: string;
        technologies: string;
        bulletPoints: string[];
    }>;
    experiences: Array<{
        title: string;
        company: string;
        date: string;
        bulletPoints: string[];
    }>;
    skills?: Array<{
      category: string; 
      skills: string[]; 
    }>;
};

const HEADER_MARGIN = 30;
const MARGIN = 40;
const CONTENT_MARGIN = 50;
const FONT_SIZE_NORMAL = 10;
const FONT_SIZE_HEADER = 12;
const LINE_HEIGHT_NORMAL = 13;
const LINE_HEIGHT_HEADER = 20;

export async function createPdfFromData(data: ResumeData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Register fontkit with the PDFDocument instance
  pdfDoc.registerFontkit(fontkit);

  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const effectiveWidth = width - 2 * MARGIN;
  const contentWidth = width - CONTENT_MARGIN - CONTENT_MARGIN;

  // Read the raw font file data from your /public/fonts directory.
  const cmRegularBuffer = await fs.readFile('./public/fonts/ComputerModern-Regular.ttf');
  const cmBoldBuffer = await fs.readFile('./public/fonts/ComputerModern-Bold.ttf');
  const cmItalicBuffer = await fs.readFile('./public/fonts/ComputerModern-Italic.ttf');

  // 2. Embed these fonts into the PDF document.
  const customFont = await pdfDoc.embedFont(new Uint8Array(cmRegularBuffer));
  const customBoldFont = await pdfDoc.embedFont(new Uint8Array(cmBoldBuffer));
  const customItalicFont = await pdfDoc.embedFont(new Uint8Array(cmItalicBuffer));

  let y = height - MARGIN;

  function drawWrappedText(
    text: string,
    options: {
        font: PDFFont;
        size: number;
        x: number;
        maxWidth: number;
        color?: any;
        lineHeight?: number;
    }
  ): { page: PDFPage; y: number } {
    const { font, size, x, maxWidth, color = rgb(0, 0, 0), lineHeight = LINE_HEIGHT_NORMAL } = options;
    const words = text.split(' ');
    let line = '';

    for (const word of words) {
      if (y < MARGIN + lineHeight) {
        page = pdfDoc.addPage();
        y = height - MARGIN;
      }

      const testLine = line + word + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && line.length > 0) {
        page.drawText(line, { x, y, font, size, color });
        y -= lineHeight;
        line = word + ' ';
      } else {
        line = testLine;
      }
    }

    if (y < MARGIN + lineHeight) {
      page = pdfDoc.addPage();
      y = height - MARGIN;
    }
    page.drawText(line.trim(), { x, y, font, size, color });
    y -= lineHeight;

    return { page, y };
  }

  function checkSpace(requiredHeight: number): void {
      if (y < MARGIN + requiredHeight) {
          page = pdfDoc.addPage();
          y = height - MARGIN;
      }
  }

    function drawSectionHeader(title: string) {
      checkSpace(LINE_HEIGHT_HEADER + 10); // Check for header + line + padding
      
      // Draw the header text
      ({ page, y } = drawWrappedText(title, {
          x: HEADER_MARGIN,
          font: customFont,
          size: FONT_SIZE_HEADER,
          maxWidth: effectiveWidth,
          lineHeight: LINE_HEIGHT_HEADER,
      }));

      y += 15

      // Draw the horizontal line
      page.drawLine({
          start: { x: HEADER_MARGIN, y },
          end: { x: width - MARGIN, y },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5), 
          opacity: 0.75,
      });

      // Add padding after the line
      y -= 15;
    }

  // --- Draw Content ---

  // Name and Contact 
  const name = data.name ?? 'Unnamed';
  const nameWidth = customBoldFont.widthOfTextAtSize(name, 24);
  page.drawText(name, { x: (width - nameWidth) / 2, y, font: customBoldFont, size: 24, color: rgb(0.1, 0.1, 0.1) });
  y -= 16;
  const contactParts = [data.email, data.phone, data.linkedIn, data.github].filter(Boolean) as string[];
  const contactString = contactParts.join(' | ');
  page.drawText(contactString, { x: (width - customFont.widthOfTextAtSize(contactString, FONT_SIZE_NORMAL)) / 2, y, font: customFont, size: FONT_SIZE_NORMAL, color: rgb(0.3, 0.3, 0.3) });
  y -= 29;

  const bulletIndent = 15; // The space for the bullet and the gap

  // Education 
  if (data.education && data.education.length > 0) {
    drawSectionHeader('Education'); 
    
    for (const edu of data.education) {
        checkSpace(LINE_HEIGHT_NORMAL * 2);
        ({ page, y } = drawWrappedText(edu.degree, { x: MARGIN, font: customBoldFont, size: 11, maxWidth: effectiveWidth }));
        
        const dateWidth = customFont.widthOfTextAtSize(edu.date, FONT_SIZE_NORMAL);
        ({ page, y } = drawWrappedText(edu.institution, { x: MARGIN, font: customItalicFont, size: FONT_SIZE_NORMAL, color: rgb(0.4, 0.4, 0.4), maxWidth: effectiveWidth - dateWidth - 10 }));
        page.drawText(edu.date, { x: width - MARGIN - dateWidth, y: y + LINE_HEIGHT_NORMAL, font: customItalicFont, size: FONT_SIZE_NORMAL, color: rgb(0.4, 0.4, 0.4) });
        y -= 2;
        
        if (edu.bulletPoints) {
            for (const point of edu.bulletPoints) {
                checkSpace(LINE_HEIGHT_NORMAL);
                page.drawText('•', { x: CONTENT_MARGIN, y, font: customFont, size: FONT_SIZE_NORMAL });
                ({ page, y } = drawWrappedText(point, {
                    x: CONTENT_MARGIN + bulletIndent,
                    font: customFont,
                    size: FONT_SIZE_NORMAL,
                    maxWidth: effectiveWidth - bulletIndent,
                    lineHeight: LINE_HEIGHT_NORMAL - 1
                }));
            }
        }
        y -= 8;
    }
  }

  // Experience 
  if (data.experiences && data.experiences.length > 0) {
    drawSectionHeader('Experience'); 

    for (const exp of data.experiences) {
        checkSpace(LINE_HEIGHT_NORMAL * 2);
        const dateWidth =customFont.widthOfTextAtSize(exp.date, FONT_SIZE_NORMAL);
        ({ page, y } = drawWrappedText(exp.title, { x: MARGIN,  font: customBoldFont, size: FONT_SIZE_NORMAL, maxWidth: effectiveWidth - dateWidth - 10}));
        page.drawText(exp.date, { x: width - MARGIN - dateWidth, y: y + LINE_HEIGHT_NORMAL, font: customFont, size: FONT_SIZE_NORMAL });
        
        ({ page, y } = drawWrappedText(exp.company, { x: MARGIN,  font: customItalicFont, size: FONT_SIZE_NORMAL, color: rgb(0.4, 0.4, 0.4), maxWidth: effectiveWidth }));
        y -= 2;

        for (const point of exp.bulletPoints) {
            checkSpace(LINE_HEIGHT_NORMAL);
            page.drawText('•', { x: CONTENT_MARGIN, y, font: customFont, size: FONT_SIZE_NORMAL });
            ({ page, y } = drawWrappedText(point, {
                x: CONTENT_MARGIN + bulletIndent,
                font: customFont,
                size: FONT_SIZE_NORMAL,
                maxWidth: effectiveWidth - bulletIndent,
                lineHeight: LINE_HEIGHT_NORMAL - 1
            }));
        }
        y -= 8;
    }
  }
  
  // Projects Section 
  if (data.projects && data.projects.length > 0) {
    drawSectionHeader('Projects'); 

    for (const proj of data.projects) {
        checkSpace(LINE_HEIGHT_NORMAL * 2);
        
        // Draw the date on the right first, to establish our right boundary
        const dateWidth = customFont.widthOfTextAtSize(proj.date, FONT_SIZE_NORMAL);
        page.drawText(proj.date, {
            x: width - MARGIN - dateWidth,
            y,
            font: customFont,
            size: FONT_SIZE_NORMAL
        });

        // Draw the project name (bold) on the left
        page.drawText(proj.name, {
            x: MARGIN,
            y,
            font: customBoldFont,
            size: 10
        });

        // Conditionally draw separator (regular) and technologies (italic)
        if (proj.technologies && proj.technologies.trim() !== '') {
            const separator = ' | ';
            const separatorWidth = customFont.widthOfTextAtSize(separator, FONT_SIZE_NORMAL);

            let currentX = MARGIN + customBoldFont.widthOfTextAtSize(proj.name, 10);

            // Draw separator 
            page.drawText(separator, {
                x: currentX,
                y,
                font: customFont,
                size: FONT_SIZE_NORMAL,
            });
            currentX += separatorWidth;

            // Draw technologies with ITALIC font
            page.drawText(proj.technologies, {
                x: currentX,
                y,
                font: customItalicFont,
                size: FONT_SIZE_NORMAL,
                color: rgb(0.4, 0.4, 0.4)
            });
        }
        y -= LINE_HEIGHT_NORMAL + 2; // Add a little padding before bullet points

        // Draw the bullet points as before
        if (proj.bulletPoints) {
            for (const point of proj.bulletPoints) {
                checkSpace(LINE_HEIGHT_NORMAL);
                page.drawText('•', { x: CONTENT_MARGIN, y, font: customFont, size: FONT_SIZE_NORMAL });
                ({ page, y } = drawWrappedText(point, {
                    x: CONTENT_MARGIN + bulletIndent,
                    font: customFont,
                    size: FONT_SIZE_NORMAL,
                    maxWidth: effectiveWidth - bulletIndent,
                    lineHeight: LINE_HEIGHT_NORMAL - 1
                }));
            }
        }
        y -= 6;
    }
  }
  
  // Skills
  if (data.skills && data.skills.length > 0) {
    drawSectionHeader('Skills');
    
    for (const skillGroup of data.skills) {
        checkSpace(LINE_HEIGHT_NORMAL); // Only need to check for one line.

        const categoryText = `${skillGroup.category}: `;
        const skillsText = skillGroup.skills.join(', ');

        // 1. Measure the width of the bold category part.
        const categoryWidth = customBoldFont.widthOfTextAtSize(categoryText, FONT_SIZE_NORMAL);
        
        // 2. Draw the bold category text.
        page.drawText(categoryText, {
            x: MARGIN,
            y,
            font: customBoldFont,
            size: FONT_SIZE_NORMAL,
        });

        // 3. Define the new starting position and max width for the skills list.
        const skillsX = MARGIN + categoryWidth;
        const skillsMaxWidth = contentWidth - categoryWidth;

        // 5. Call drawWrappedText for the skills. It will now draw on the same
        // line as the category and wrap correctly with a hanging indent.
        ({ page, y } = drawWrappedText(skillsText, {
            x: skillsX,
            font: customFont,
            size: FONT_SIZE_NORMAL,
            maxWidth: skillsMaxWidth,
        }));

        y -= 6; // Add padding between each skill line.
    }
  }


  return pdfDoc.save();
}