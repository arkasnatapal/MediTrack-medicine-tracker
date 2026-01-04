import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import GenderSelectionModal from './GenderSelectionModal';
import EmergencyContactModal from './EmergencyContactModal';
import MedicalHistoryModal from './MedicalHistoryModal';
import IdentityReveal from './IdentityReveal';

const CompleteProfileManager = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(null); // 'gender', 'emergency', 'medical', 'reveal', null

  useEffect(() => {
    if (!user) return;

    // Check localStorage for the reveal flag
    const hasRevealedIdentity = localStorage.getItem(`identity_revealed_${user._id}`);

    if (!user.gender) {
      setCurrentStep('gender');
    } else if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      setCurrentStep('emergency');
    } else if (!user.familyMedicalHistory || user.familyMedicalHistory.length === 0) {
       const skipped = localStorage.getItem(`skipped_medical_history_${user._id}`);
       if (!skipped) {
         setCurrentStep('medical');
       } else if (!hasRevealedIdentity) {
         // Medical skipped but identity not revealed -> Show Reveal
         setCurrentStep('reveal');
       } else {
         setCurrentStep(null);
       }
    } else if (!hasRevealedIdentity) {
      // User has everything but hasn't seen the reveal -> Show Reveal
      setCurrentStep('reveal');
    } else {
      setCurrentStep(null);
    }
  }, [user]);

  const handleSuccess = (updatedUser) => {
    if (currentStep === 'gender') {
       window.location.reload(); 
    } else if (currentStep === 'emergency') {
       window.location.reload();
    } else if (currentStep === 'medical') {
       if (!updatedUser) {
           localStorage.setItem(`skipped_medical_history_${user._id}`, 'true');
       }
       // Instead of reloading immediately, we could move to next step, but reload ensures state consistency.
       // However, to make the flow smooth "on boarding", let's move directly to 'reveal' if we can?
       // But 'reveal' depends on 'user' prop in IdentityReveal. If we just saved medical data, 'user' might be stale here.
       // RELOAD is safer to get fresh user data for the card.
       window.location.reload();
    }
  };

  const handleRevealComplete = () => {
      localStorage.setItem(`identity_revealed_${user._id}`, 'true');
      setCurrentStep(null);
      // Optional: Redirect to dashboard or just close
      // window.location.reload(); // Not needed if we just set step to null
  };

  if (!currentStep) return null;

  return (
    <>
      {currentStep === 'gender' && (
        <GenderSelectionModal 
            isOpen={true} 
            user={user}
            onSuccess={handleSuccess}
            onClose={() => {}} 
        />
      )}
      {currentStep === 'emergency' && (
        <EmergencyContactModal 
            isOpen={true} 
            onSuccess={handleSuccess}
            onClose={() => {}} 
        />
      )}
      {currentStep === 'medical' && (
        <MedicalHistoryModal 
            isOpen={true} 
            onSuccess={handleSuccess} 
            onClose={() => {}} 
        />
      )}
      {currentStep === 'reveal' && (
          <IdentityReveal 
            user={user}
            onComplete={handleRevealComplete}
          />
      )}
    </>
  );
};

export default CompleteProfileManager;
