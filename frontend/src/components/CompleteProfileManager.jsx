import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GenderSelectionModal from './GenderSelectionModal';
import EmergencyContactModal from './EmergencyContactModal';
import MedicalHistoryModal from './MedicalHistoryModal';

const CompleteProfileManager = () => {
  const { user, login } = useAuth(); // We might need to refresh user data? 
  // Actually, useAuth provides `user`. If we update it via API, we should update context too.
  // The modals pass back the updated user in `onSuccess`.

  const [currentStep, setCurrentStep] = useState(null); // 'gender', 'emergency', 'medical', null

  useEffect(() => {
    if (!user) return;

    // Determine the first missing step
    // Priority: Gender -> Emergency -> Medical
    // We check locally to decide what to show.
    // NOTE: This runs on every render, so we need to be careful not to flicker.
    // Ideally we determine this once on mount or when user changes.
    
    // Check if we should show steps
    // We create a "session" of onboarding. 
    
    // Simple logic: If missing, show.
    
    // We need to know if the user explicitly "skipped" medical history to avoid showing it forever.
    // For now, we'll rely on the fact that if they answer or skip, we might set a flag or just leave it empty.
    // If we want to show it ONCE, we should check a local storage flag or similar?
    // BUT the user said "modal to appear after a user create a new account".
    // So if fields are empty, we show.
    
    if (!user.gender) {
      setCurrentStep('gender');
    } else if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      setCurrentStep('emergency');
    } else if (!user.familyMedicalHistory || user.familyMedicalHistory.length === 0) {
       // Only show if we haven't shown it this session? 
       // Or rely on a 'seen_medical_onboarding' flag?
       // Let's check a localStorage flag to allow "Skipping" without saving data.
       const skipped = localStorage.getItem(`skipped_medical_history_${user._id}`);
       if (!skipped) {
         setCurrentStep('medical');
       } else {
         setCurrentStep(null);
       }
    } else {
      setCurrentStep(null);
    }

  }, [user]);

  const handleSuccess = (updatedUser) => {
    // Determine next step based on the CURRENT step and the UPDATED user
    // Ideally, the parent effect will re-run when `user` updates, but `user` in context might not auto-update 
    // unless we call a method to update it.
    
    // The modals call onSuccess(user). We should update the global auth context.
    // AuthContext doesn't have a direct 'setUser' exposed commonly, usually 'updateProfile' does it.
    // But here we rely on the fact that the page might reload or we trigger a refresh.
    
    // Actually, simply force a re-evaluation or quick navigation.
    // If we update the user in the context, the Effect above will re-run.
    
    // For now, let's assume the modals verify and we move to the next logical step.
    
    if (currentStep === 'gender') {
       // Moving to emergency
       // We can optimistically set step, but better to update user and let Effect handle it.
       // Reloading window is a nuclear option, but ensures sync. 
       // Better: The modal updated the backend. We should update the context.
       // If AuthContext doesn't expose setUser, we can trigger a profile fetch.
       window.location.reload(); 
    } else if (currentStep === 'emergency') {
       window.location.reload();
    } else if (currentStep === 'medical') {
        // Did we skip or save?
       if (!updatedUser) {
           // Skipped
           localStorage.setItem(`skipped_medical_history_${user._id}`, 'true');
       }
       window.location.reload();
    }
  };

  if (!currentStep) return null;

  return (
    <>
      {currentStep === 'gender' && (
        <GenderSelectionModal 
            isOpen={true} 
            user={user}
            onSuccess={handleSuccess}
            onClose={() => {}} // Mandatory
        />
      )}
      {currentStep === 'emergency' && (
        <EmergencyContactModal 
            isOpen={true} 
            onSuccess={handleSuccess}
            onClose={() => {}} // Mandatory
        />
      )}
      {currentStep === 'medical' && (
        <MedicalHistoryModal 
            isOpen={true} 
            onSuccess={handleSuccess} // Passes user if saved, or undefined if skipped
            onClose={() => {}} // Mandatory
        />
      )}
    </>
  );
};

export default CompleteProfileManager;
