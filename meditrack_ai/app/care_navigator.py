from typing import List
from .schemas import CareNavigationOption, SafetyEngineResult
from .config import settings

class CareNavigator:
    def get_navigation_options(self, safety_result: SafetyEngineResult, region: str = settings.DEFAULT_REGION) -> List[CareNavigationOption]:
        """
        Generates clinical care navigation pathways based on triage urgency level.
        Connects directly to MediTrack facility endpoints and emergency services.
        """
        emergency_nums = settings.EMERGENCY_NUMBERS.get(region, settings.EMERGENCY_NUMBERS["IN"])
        ambulance_num = emergency_nums["ambulance"]
        national_num = emergency_nums["national_emergency"]

        options = []

        if safety_result.urgency == "EMERGENCY":
            options.append(CareNavigationOption(
                facility_type="DISTRICT_HOSPITAL",
                title=f"Call Emergency Medical Services ({ambulance_num})",
                description=f"Immediate emergency dispatch & ambulance support. Dial {ambulance_num} or {national_num}.",
                action_type="EMERGENCY_CALL",
                phone_number=ambulance_num
            ))
            options.append(CareNavigationOption(
                facility_type="DISTRICT_HOSPITAL",
                title="Nearest Apex Emergency & Trauma Center",
                description="Proceed directly to the nearest District Hospital emergency department or Super Specialty Trauma Center.",
                action_type="FIND_FACILITY",
                action_url="/care-network/emergency"
            ))
            options.append(CareNavigationOption(
                facility_type="ICU_TRAUMA",
                title="Find 24/7 Public Healthcare Facilities",
                description="View real-time ICU, oxygen bed, and emergency queue availability in nearby facilities.",
                action_type="FIND_FACILITY",
                action_url="/care-network/find-care?emergency=true"
            ))

        elif safety_result.urgency == "URGENT":
            options.append(CareNavigationOption(
                facility_type="CHC",
                title="Community Health Centre (CHC) / Urgent Care",
                description="Visit your nearest CHC or Sub-Divisional Hospital for prompt doctor assessment.",
                action_type="FIND_FACILITY",
                action_url="/care-network/find-care?facilityType=CHC"
            ))
            options.append(CareNavigationOption(
                facility_type="PHC",
                title="Book Priority Clinical OPD Appointment",
                description="Schedule a priority OPD visit at a nearby public health facility.",
                action_type="BOOK_APPOINTMENT",
                action_url="/care-network/appointments"
            ))

        else: # ROUTINE / SELF_CARE
            options.append(CareNavigationOption(
                facility_type="PHC",
                title="Primary Health Centre (PHC) Outpatient Clinic",
                description="Schedule a routine health consultation at your local PHC or Wellness Centre.",
                action_type="BOOK_APPOINTMENT",
                action_url="/care-network/appointments"
            ))
            options.append(CareNavigationOption(
                facility_type="TELECONSULTATION",
                title="MediTrack Digital Teleconsultation",
                description="Consult with a verified doctor online without visiting a health center.",
                action_type="FIND_FACILITY",
                action_url="/care-network/teleconsultation"
            ))

        return options

care_navigator = CareNavigator()
