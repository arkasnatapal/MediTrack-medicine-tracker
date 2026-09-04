const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Finds the MediTrack logo PNG path if available.
 */
function getLogoPath() {
  const candidatePaths = [
    path.join(__dirname, '../../frontend/public/logo.png'),
    path.join(__dirname, '../public/logo.png'),
    path.join(process.cwd(), 'frontend/public/logo.png'),
    path.join(process.cwd(), 'public/logo.png')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function generatePrescriptionPDF({
  patientName = 'Patient',
  patientAge = '',
  patientGender = '',
  doctorName = 'Duty Doctor',
  doctorSpecialization = 'General Medicine',
  medicalRegistrationNumber = 'MCI-VERIFIED',
  facilityName = 'Healthcare Center',
  department = 'General OPD',
  tokenNumber = 1,
  date = new Date().toLocaleDateString(),
  diagnosis = 'General Consultation',
  medicines = [],
  advice = '',
  isOfflinePrescription = false,
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        const dataUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
        resolve({ pdfBuffer, dataUrl });
      });

      // Palette
      const primaryDark = '#042f2e';  // Deep Emerald/Teal Background
      const primaryTeal = '#0d9488';  // Vibrant Teal Accent
      const darkSlate = '#0f172a';    // Dark Text
      const textMuted = '#475569';    // Muted Slate Text
      const lightBg = '#f8fafc';      // Soft Card Fill
      const strokeBorder = '#cbd5e1'; // Border Stroke

      // ----------------------------------------------------
      // 1. TOP HEADER BANNER
      // ----------------------------------------------------
      // Outer Header Box
      doc.rect(0, 0, 595, 92).fill(primaryDark);

      // Top Accent Line
      doc.rect(0, 0, 595, 4).fill(primaryTeal);

      // Logo rendering
      const logoPath = getLogoPath();
      let headerTextStartX = 36;

      if (logoPath) {
        try {
          doc.image(logoPath, 36, 18, { fit: [54, 54] });
          headerTextStartX = 102;
        } catch (e) {
          headerTextStartX = 36;
        }
      }

      // If no logo image or fallback, draw a stylized MediTrack Cross Icon
      if (!logoPath || headerTextStartX === 36) {
        doc.roundedRect(36, 20, 48, 48, 10).fill('#0f766e');
        doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('+', 52, 28);
        headerTextStartX = 96;
      }

      // Header Brand Name & Tagline (Left Column with strict width bound)
      const brandWidth = 230;
      doc.fillColor('#ffffff')
        .fontSize(15)
        .font('Helvetica-Bold')
        .text('MEDITRACK CARE NETWORK', headerTextStartX, 20, { width: brandWidth });

      doc.fillColor('#99f6e4')
        .fontSize(8)
        .font('Helvetica')
        .text('PAN-INDIA DIGITAL PUBLIC OPD ECOSYSTEM', headerTextStartX, 42, { width: brandWidth });

      doc.fillColor('#cbd5e1')
        .fontSize(7.5)
        .font('Helvetica-Oblique')
        .text('ABDM Compliant Clinical OPD Records', headerTextStartX, 56, { width: brandWidth });

      // Right Side: Hospital / Facility Details (Right Column)
      const rightColX = 340;
      const rightColWidth = 219;

      doc.fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(facilityName, rightColX, 18, { align: 'right', width: rightColWidth });

      doc.fillColor('#99f6e4')
        .fontSize(8)
        .font('Helvetica')
        .text(`Department: ${department}`, rightColX, 50, { align: 'right', width: rightColWidth })
        .text(`Date of Issue: ${date}`, rightColX, 62, { align: 'right', width: rightColWidth });

      // ----------------------------------------------------
      // 2. DOCTOR & TOKEN CREDENTIALS BOX
      // ----------------------------------------------------
      const docBoxY = 104;
      doc.roundedRect(36, docBoxY, 523, 52, 8).fillAndStroke('#f0fdf4', '#99f6e4');

      const formattedDrName = doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`;

      doc.fillColor('#0f766e')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(formattedDrName, 50, docBoxY + 10);

      doc.fillColor(textMuted)
        .fontSize(9)
        .font('Helvetica')
        .text(`${doctorSpecialization}   |   Medical Reg No: ${medicalRegistrationNumber}`, 50, docBoxY + 30);

      // Token Badge (Right aligned pill)
      doc.roundedRect(420, docBoxY + 10, 126, 32, 6).fillAndStroke('#fef3c7', '#f59e0b');

      doc.fillColor('#b45309')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`OPD TOKEN #${tokenNumber}`, 420, docBoxY + 20, { align: 'center', width: 126 });

      // ----------------------------------------------------
      // 3. PATIENT DEMOGRAPHICS BAR
      // ----------------------------------------------------
      const patientY = 166;
      doc.roundedRect(36, patientY, 523, 34, 6).fillAndStroke('#f8fafc', strokeBorder);

      doc.fillColor(textMuted)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('PATIENT NAME:', 48, patientY + 12);

      doc.fillColor(darkSlate)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(patientName.toUpperCase(), 122, patientY + 11);

      const pInfo = [
        patientAge ? `Age: ${patientAge}` : null,
        patientGender ? `Gender: ${patientGender}` : null,
        `Date: ${date}`
      ].filter(Boolean).join('   |   ');

      doc.fillColor(textMuted)
        .fontSize(8.5)
        .font('Helvetica')
        .text(pInfo, 300, patientY + 12, { align: 'right', width: 246 });

      // ----------------------------------------------------
      // 4. PRESCRIPTION TYPE BADGE (ONLINE DIGITAL vs OFFLINE PAPER)
      // ----------------------------------------------------
      const badgeY = 208;
      if (isOfflinePrescription) {
        doc.roundedRect(36, badgeY, 523, 24, 5).fillAndStroke('#fffbeb', '#fde68a');
        doc.fillColor('#b45309')
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text('📋 OFFLINE / HANDWRITTEN PAPER PRESCRIPTION ISSUED TO PATIENT AT OPD COUNTER', 36, badgeY + 7, { align: 'center', width: 523 });
      } else {
        doc.roundedRect(36, badgeY, 523, 24, 5).fillAndStroke('#ecfdf5', '#a7f3d0');
        doc.fillColor('#047857')
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text('✅ VERIFIED DIGITAL PRESCRIPTION RECORD • AUTHENTICATED ELECTRONIC COPY', 36, badgeY + 7, { align: 'center', width: 523 });
      }

      // ----------------------------------------------------
      // 5. CLINICAL DIAGNOSIS SECTION
      // ----------------------------------------------------
      let currentY = 242;

      // Section Title Accent Bar
      doc.rect(36, currentY, 4, 14).fill(primaryTeal);
      doc.fillColor(darkSlate)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('CLINICAL DIAGNOSIS & REASON FOR CONSULTATION', 46, currentY + 2);

      currentY += 20;

      doc.roundedRect(36, currentY, 523, 34, 6).fillAndStroke('#ffffff', strokeBorder);
      doc.fillColor(darkSlate)
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .text(diagnosis || 'General OPD Consultation & Clinical Review', 48, currentY + 11);

      currentY += 46;

      // ----------------------------------------------------
      // 6. PRESCRIBED MEDICINES TABLE (Rx)
      // ----------------------------------------------------
      // Rx Symbol + Header
      doc.fillColor(primaryTeal)
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('Rx', 36, currentY);

      doc.fillColor(darkSlate)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('PRESCRIBED MEDICATIONS & DOSAGE SCHEDULE', 68, currentY + 8);

      currentY += 28;

      // Table Header Row
      doc.roundedRect(36, currentY, 523, 22, 4).fill(primaryDark);
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      doc.text('#', 44, currentY + 6, { width: 20 });
      doc.text('MEDICINE NAME', 68, currentY + 6, { width: 170 });
      doc.text('DOSAGE', 242, currentY + 6, { width: 75 });
      doc.text('FREQUENCY (MORNING-NOON-NIGHT)', 322, currentY + 6, { width: 145 });
      doc.text('DURATION', 472, currentY + 6, { width: 80 });

      currentY += 22;

      if (!medicines || medicines.length === 0) {
        doc.rect(36, currentY, 523, 26).fillAndStroke('#f8fafc', strokeBorder);
        doc.fillColor(textMuted)
          .fontSize(8.5)
          .font('Helvetica-Oblique')
          .text('No online digital medicines entered (Offline handwritten prescription handed to patient).', 48, currentY + 8);
        currentY += 26;
      } else {
        medicines.forEach((med, i) => {
          const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(36, currentY, 523, 26).fillAndStroke(rowBg, strokeBorder);

          doc.fillColor(textMuted).fontSize(8.5).font('Helvetica');
          doc.text(`${i + 1}`, 44, currentY + 8, { width: 20 });

          doc.fillColor(darkSlate).font('Helvetica-Bold');
          doc.text(med.name || 'Medicine', 68, currentY + 8, { width: 170 });

          doc.fillColor(textMuted).font('Helvetica');
          doc.text(med.dosage || 'Standard', 242, currentY + 8, { width: 75 });

          doc.fillColor(primaryTeal).font('Helvetica-Bold');
          doc.text(med.frequency || '1-0-1', 322, currentY + 8, { width: 145 });

          doc.fillColor(darkSlate).font('Helvetica');
          doc.text(med.duration || 'As directed', 472, currentY + 8, { width: 80 });

          currentY += 26;
        });
      }

      currentY += 16;

      // ----------------------------------------------------
      // 7. DOCTOR'S ADVICE & INSTRUCTIONS
      // ----------------------------------------------------
      if (advice) {
        doc.rect(36, currentY, 4, 14).fill(primaryTeal);
        doc.fillColor(darkSlate)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text("DOCTOR'S CLINICAL ADVICE & DIETARY INSTRUCTIONS", 46, currentY + 2);

        currentY += 20;

        doc.roundedRect(36, currentY, 523, 44, 6).fillAndStroke('#f0fdf4', '#bbf7d0');
        doc.fillColor('#065f46')
          .fontSize(9)
          .font('Helvetica-Oblique')
          .text(`"${advice}"`, 48, currentY + 12, { width: 499, lineGap: 3 });

        currentY += 56;
      } else {
        currentY += 10;
      }

      // ----------------------------------------------------
      // 8. ELEGANT FOOTER & ELECTRONIC SIGNATURE
      // ----------------------------------------------------
      const footerY = 720;

      // Divider
      doc.moveTo(36, footerY).lineTo(559, footerY).strokeColor('#cbd5e1').lineWidth(1).stroke();

      // Left Footer: MediTrack Trust Mark
      doc.fillColor(primaryTeal)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('MEDITRACK CARE NETWORK', 36, footerY + 10);

      doc.fillColor(textMuted)
        .fontSize(7.5)
        .font('Helvetica')
        .text('Pan-India Connected Public Healthcare & Rural OPD Ecosystem', 36, footerY + 22);

      doc.fillColor('#94a3b8')
        .fontSize(7)
        .font('Helvetica-Oblique')
        .text('This document is electronically generated and authenticated under Information Technology Act, 2000.', 36, footerY + 34);

      // Right Footer: Doctor Signature Block
      doc.fillColor(darkSlate)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(formattedDrName, 360, footerY + 10, { align: 'right', width: 199 });

      doc.fillColor(primaryTeal)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('ELECTRONICALLY SIGNED & VALIDATED', 360, footerY + 24, { align: 'right', width: 199 });

      doc.fillColor(textMuted)
        .fontSize(7.5)
        .font('Helvetica')
        .text(`Reg: ${medicalRegistrationNumber} | Dept: ${department}`, 360, footerY + 36, { align: 'right', width: 199 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generatePrescriptionPDF,
};
