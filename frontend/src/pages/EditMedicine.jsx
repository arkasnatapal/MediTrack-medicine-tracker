import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { useMedicine } from '../context/MedicineContext';
import { Save, Loader2, ArrowLeft } from 'lucide-react';

const EditMedicine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMedicineById, updateMedicine } = useMedicine();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    form: '',
    quantity: '1',
    expiryDate: '',
    mfgDate: '',
    batchNo: '',
    genericName: '',
    dosage: '',
    description: ''
  });

  useEffect(() => {
    const medicine = getMedicineById(id);
    if (medicine) {
      setFormData({
        name: medicine.name || '',
        form: medicine.form || medicine.category || '',
        quantity: medicine.quantity || '1',
        expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '',
        mfgDate: medicine.mfgDate ? new Date(medicine.mfgDate).toISOString().split('T')[0] : '',
        batchNo: medicine.batchNo || '',
        genericName: medicine.genericName || '',
        dosage: medicine.dosage || '',
        description: medicine.description || ''
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [id, getMedicineById]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await updateMedicine(id, formData);
    if (success) {
      navigate('/medicines');
    }
    
    setIsSubmitting(false);
  };

  if (loading) return <Loader fullScreen text="Loading medicine details..." />;

  return (
    <div className="p-8 w-full">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Medicine</h1>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="input-field mt-1"
                  placeholder="e.g. Paracetamol"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="form" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Form
                  </label>
                  <input
                    type="text"
                    id="form"
                    name="form"
                    className="input-field mt-1"
                    placeholder="e.g. Tablet, Capsule, Syrup"
                    value={formData.form}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    className="input-field mt-1"
                    placeholder="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    id="expiryDate"
                    name="expiryDate"
                    required
                    className="input-field mt-1"
                    value={formData.expiryDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="mfgDate" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Manufacturing Date
                  </label>
                  <input
                    type="date"
                    id="mfgDate"
                    name="mfgDate"
                    className="input-field mt-1"
                    value={formData.mfgDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="batchNo" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Batch No
                  </label>
                  <input
                    type="text"
                    id="batchNo"
                    name="batchNo"
                    className="input-field mt-1"
                    placeholder="e.g. BNO1234"
                    value={formData.batchNo}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="genericName" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Generic Name
                  </label>
                  <input
                    type="text"
                    id="genericName"
                    name="genericName"
                    className="input-field mt-1"
                    placeholder="e.g. Acetaminophen"
                    value={formData.genericName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dosage" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Dosage
                </label>
                <input
                  type="text"
                  id="dosage"
                  name="dosage"
                  className="input-field mt-1"
                  placeholder="e.g. 500 mg"
                  value={formData.dosage}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Description / Additional Details
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="input-field mt-1"
                  placeholder="Additional information, usage instructions, etc."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/medicines')}
                  className="btn-secondary mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="-ml-1 mr-2 h-4 w-4" />
                      Update Medicine
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

  );
};

export default EditMedicine;
