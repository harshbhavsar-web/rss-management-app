import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import api from '../utils/api';

const Onboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [shakhas, setShakhas] = useState([]);
  const [selectedShakha, setSelectedShakha] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchShakhas = async () => {
      try {
        const res = await api.get('/shakhas');
        setShakhas(res.data);
      } catch (error) {
        toast.error('Failed to load shakhas');
      } finally {
        setLoading(false);
      }
    };
    fetchShakhas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShakha) {
      return toast.error('Please select an option');
    }

    if (selectedShakha === 'other') {
      // Need to fill out Join RSS form
      navigate('/join');
      return;
    }

    setSubmitting(true);
    try {
      await api.put('/users/onboard', { shakhaId: selectedShakha });
      localStorage.setItem('userOnboarded', 'true');
      toast.success('Onboarding complete!');
      navigate('/home');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-600 mx-auto"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Welcome to RSS App
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please select your Shakha to continue.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Shakha *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="text-gray-400 w-5 h-5" />
              </div>
              <select
                required
                value={selectedShakha}
                onChange={(e) => setSelectedShakha(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-saffron-500 appearance-none bg-white"
              >
                <option value="" disabled>-- Select a Shakha --</option>
                {shakhas.map(shakha => (
                  <option key={shakha._id} value={shakha._id}>
                    {shakha.name}
                  </option>
                ))}
                <option value="other">Other (Join a new Shakha)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-saffron-600 text-white font-bold py-3 px-4 rounded-md hover:bg-saffron-700 transition disabled:bg-saffron-400"
          >
            {submitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
