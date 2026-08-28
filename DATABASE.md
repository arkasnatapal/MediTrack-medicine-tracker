# MediTrack Care Network - Database Schema Reference

## MongoDB / Mongoose Entities

1. **CareUser (`CareUser`)**:
   - `name`, `email`, `phone`, `password` (hashed), `role`, `verificationStatus`, `facilityId`, `doctorId`.
2. **Facility (`Facility`)**:
   - `name`, `facilityType`, `licenseId`, `classification`, `address`, `state`, `district`, `pincode`, `emergencyAvailable`, `departments`, `verificationStatus`.
3. **Doctor (`Doctor`)**:
   - `userId`, `fullName`, `medicalRegistrationNumber`, `registrationAuthority`, `specialization`, `qualification`, `experienceYears`, `consultationType`, `verificationStatus`.
4. **DoctorFacilityAssociation (`DoctorFacilityAssociation`)**:
   - `doctorId`, `facilityId`, `department`, `designation`, `employmentType`, `status` (`PENDING`, `ACTIVE`, `SUSPENDED`, `ENDED`), `requestedBy`.
5. **PatientRecord (`PatientRecord`)**:
   - `name`, `phone`, `email`, `age`, `gender`, `bloodGroup`, `address`, `allergies`, `chronicConditions`.
6. **CareAppointment (`CareAppointment`)**:
   - `patientId`, `facilityId`, `doctorId`, `department`, `appointmentDate`, `timeSlot`, `type`, `status`, `tokenNumber`, `prescription`.
7. **CareQueue (`CareQueue`)**:
   - `facilityId`, `doctorId`, `department`, `date`, `currentToken`, `servingToken`, `entries`.
8. **CareReferral (`CareReferral`)**:
   - `patientId`, `referringDoctorId`, `referringFacilityId`, `receivingFacilityId`, `department`, `reason`, `urgency`, `status`.
9. **PatientTransfer (`PatientTransfer`)**:
   - `patientId`, `originatingFacilityId`, `destinationFacilityId`, `reason`, `clinicalSummary`, `urgency`, `requiredBedType`, `status`.
10. **FacilityCapacity (`FacilityCapacity`)**:
    - `facilityId`, `emergencyBeds`, `generalBeds`, `icuBeds`, `oxygenBeds`, `ventilatorsAvailable`.
11. **TeleconsultationSession (`TeleconsultationSession`)**:
    - `appointmentId`, `patientId`, `doctorId`, `meetingIdentifier`, `socketRoomId`, `status`, `postSessionMessagesLeft` (10 default), `postSessionMessagesSent`.
12. **CareDiagnosticOrder (`CareDiagnosticOrder`)**:
    - `patientId`, `requestingDoctorId`, `facilityId`, `testName`, `category`, `urgency`, `status`, `reportUrl`.
13. **CareMedicineInventory (`CareMedicineInventory`)**:
    - `facilityId`, `medicineName`, `genericName`, `strength`, `quantity`, `minimumThreshold`, `batchNumber`, `expiryDate`, `status`.
14. **CareJourneyTimelineEvent (`CareJourneyTimelineEvent`)**:
    - `patientId`, `eventType`, `facilityId`, `doctorId`, `timestamp`, `title`, `description`.
15. **CareMessage (`CareMessage`)**:
    - `conversationType`, `senderId`, `receiverId`, `patientId`, `teleconsultationSessionId`, `messageType`, `content`, `audioUrl`.
16. **CareAuditLog (`CareAuditLog`)**:
    - `userId`, `userName`, `userRole`, `action`, `targetEntity`, `details`, `timestamp`.
