import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const triggerEmergency = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/emergency/trigger`, data, getHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to trigger emergency';
    }
};

export const getAIRecommendation = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/emergency/ai-recommendation`, data, getHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to get AI recommendation';
    }
};

export const fetchNearbyHospitals = async (lat, lon) => {
    try {
        const response = await axios.get(`${API_URL}/emergency/hospitals`, {
            params: { lat, lon },
            ...getHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching hospitals:", error);
        return [];
    }
};

export const assignDoctor = async (emergencyId) => {
    try {
        const response = await axios.post(`${API_URL}/emergency/assign-doctor`, { emergencyId }, getHeaders());
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to assign doctor';
    }
};

export const getHospitalDetails = async (id, name, lat, lon) => {
    try {
        const response = await axios.get(`${API_URL}/hospital-details/${id}`, {
            params: { name, lat, lon },
            ...getHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching hospital details:", error);
        throw error;
    }
};

export const refreshHospitalDetails = async (id, name, lat, lon) => {
    try {
        const response = await axios.post(`${API_URL}/hospital-details/${id}/refresh`, {
            name, lat, lon
        }, getHeaders());
        return response.data;
    } catch (error) {
        console.error("Error refreshing hospital details:", error);
        throw error;
    }
};
