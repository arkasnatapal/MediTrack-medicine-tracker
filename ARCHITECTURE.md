# MediTrack Care Network - System Architecture

## Architecture Diagram

```
                             PATIENT APPLICATION
                             (Existing MediTrack)
                                      |
                                      | REST APIs / Shared DB
                                      v
                        +----------------------------+
                        |    care_backend (5001)     |
                        |    Express + LiveKit SDK   |
                        +----------------------------+
                                      |
                 +--------------------+--------------------+
                 |                    |                    |
                 v                    v                    v
        Healthcare Facilities       Doctors          System Admin
         (PHC, CHC, District)   (Multi-Hospital)     (Verification)
                 |                    |                    |
                 +--------------------+--------------------+
                                      |
                                      v
                           care_frontend (5174)
                       React + Vite + Tailwind CSS
```

---

## Core System Design
1. **Dual Root Folder Architecture**:
   - `/care_backend`: Express API, LiveKit token server, MongoDB Mongoose models.
   - `/care_frontend`: Vite React Single Page Application with LiveKit client.

2. **Shared Database & Patient Record Compatibility**:
   - Both patient and provider backends share the same MongoDB database (`MONGODB_URI`), ensuring unbroken continuity of care.
3. **Many-to-Many Doctor-Facility Associations**:
   - Implemented via `DoctorFacilityAssociation` entity. A doctor is not restricted to one hospital ID.
4. **Teleconsultation Session Lifecycle & 10 Post-Session Messages**:
   - Active Teleconsultation -> Doctor disconnects/terminates -> Status set to `TERMINATED`.
   - Video call ends; patient is allocated **up to 10 post-session follow-up text or audio clip messages**.
