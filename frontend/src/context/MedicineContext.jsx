import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const MedicineContext = createContext();

export const useMedicine = () => useContext(MedicineContext);

export const MedicineProvider = ({ children }) => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMedicines = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.get('/medicines');
      setMedicines(response.data.medicines);
      setError(null);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to fetch medicines');
      notify.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMedicines();
    } else {
      setMedicines([]);
    }
  }, [user]);

  const addMedicine = async (medicineData) => {
    try {
      const { reminder, ...medData } = medicineData;
      const response = await api.post('/medicines', medData);
      const newMedicine = response.data.medicine;
      
      // If reminder is enabled, create the reminder
      if (reminder?.enabled && newMedicine?._id) {
        try {
          await api.post('/reminders', {
            medicineId: newMedicine._id,
            targetUserId: user._id,
            times: reminder.times,
            daysOfWeek: reminder.daysOfWeek,
            startDate: reminder.startDate,
            endDate: reminder.endDate,
            channels: {
              inApp: true,
              email: true,
            },
            watchers: [],
          });
          console.log('Reminder created successfully');
        } catch (reminderErr) {
          console.error('Error creating reminder:', reminderErr);
          console.error('Reminder error details:', reminderErr.response?.data);
          notify.error('Medicine added but failed to create reminder');
        }
      }
      
      setMedicines([...medicines, newMedicine]);
      notify.success('Medicine added successfully!');
      return true;
    } catch (err) {
      console.error('Error adding medicine:', err);
      notify.error(err.response?.data?.message || 'Failed to add medicine');
      return false;
    }
  };

  const updateMedicine = async (id, medicineData) => {
    try {
      const response = await api.put(`/medicines/${id}`, medicineData);
      setMedicines(medicines.map((med) => (med._id === id ? response.data.medicine : med)));
      notify.success('Medicine updated successfully!');
      return true;
    } catch (err) {
      console.error('Error updating medicine:', err);
      notify.error(err.response?.data?.message || 'Failed to update medicine');
      return false;
    }
  };

  const deleteMedicine = async (id) => {
    try {
      await api.delete(`/medicines/${id}`);
      setMedicines(medicines.filter((med) => med._id !== id));
      notify.success('Medicine deleted successfully!');
      return true;
    } catch (err) {
      console.error('Error deleting medicine:', err);
      notify.error(err.response?.data?.message || 'Failed to delete medicine');
      return false;
    }
  };

  const getMedicineById = (id) => {
    return medicines.find((med) => med._id === id);
  };

  const value = {
    medicines,
    loading,
    error,
    fetchMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    getMedicineById,
  };

  return <MedicineContext.Provider value={value}>{children}</MedicineContext.Provider>;
};
