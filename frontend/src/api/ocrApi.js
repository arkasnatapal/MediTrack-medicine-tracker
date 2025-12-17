import api from './api';

export const uploadImageForOCR = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await api.post('/ocr/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
