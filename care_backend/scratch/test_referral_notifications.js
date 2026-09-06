const { sendReferralAdviceEmail, sendReferralCompletedEmail } = require('../services/emailService');

async function testReferralNotifications() {
  console.log('--- Testing Referral Advice Email Dispatch ---');
  const adviceRes = await sendReferralAdviceEmail({
    to: 'meditrack.test.user@gmail.com',
    patientName: 'Rahul Sharma',
    referringDoctorName: 'Dr. Rajesh Sharma',
    consultingDoctorName: 'Dr. Ananya Roy',
    facilityName: 'District Hospital & Super Specialty Trauma Center',
    department: 'Cardiology',
    adviceNotes: 'Patient exhibits mild sinus bradycardia. Recommend starting Low-Dose Beta-Blocker and 24-hr Holter Monitoring.',
    recommendedDiagnosis: 'Mild Sinus Bradycardia',
    recommendedTreatment: 'Beta-Blocker 25mg daily + Holter ECG',
    referralId: 'REF-789012',
  });
  console.log('Advice Email Result:', adviceRes);

  console.log('\n--- Testing Referral Completion Email Dispatch ---');
  const completeRes = await sendReferralCompletedEmail({
    to: 'meditrack.test.user@gmail.com',
    patientName: 'Rahul Sharma',
    referringDoctorName: 'Dr. Rajesh Sharma',
    consultingDoctorName: 'Dr. Ananya Roy',
    facilityName: 'District Hospital & Super Specialty Trauma Center',
    department: 'Cardiology',
    completionNotes: 'Specialist consultation and cardiac monitoring complete. Patient cleared for outpatient follow-up.',
    completedAt: new Date(),
    referralId: 'REF-789012',
  });
  console.log('Completion Email Result:', completeRes);
}

testReferralNotifications();
