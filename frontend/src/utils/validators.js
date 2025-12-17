export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 6 characters
  return password.length >= 6;
};

export const validateMedicineName = (name) => {
  return name && name.trim().length > 0;
};

export const validateExpiryDate = (date) => {
  if (!date) return false;
  const expiry = new Date(date);
  const today = new Date();
  // Allow adding expired medicines for record keeping, but maybe warn?
  // For now just check if it's a valid date
  return !isNaN(expiry.getTime());
};
