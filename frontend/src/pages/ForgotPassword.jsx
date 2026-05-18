import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import api from '../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');
    
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return toast.error('Please enter a valid email address');
    }

    setLoading(true);
    try {
      const res = await api.post('/users/forgot-password', { email });
      toast.success(res.data.message || 'OTP sent successfully');
      navigate('/reset-password', { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-20 px-4 bg-gray-50 min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Forgot Password</h2>
        <p className="text-center text-sm text-gray-500 mb-8">Enter your registered email to receive an OTP</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="text-gray-400 w-5 h-5" />
              </div>
              <input 
                type="email" 
                name="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-saffron-500"
                placeholder="you@example.com"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-saffron-600 text-white font-bold py-3 px-4 rounded-md hover:bg-saffron-700 transition disabled:bg-saffron-400"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>

         <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-semibold text-saffron-600 hover:text-saffron-500">
              Back to Login
            </Link>
          </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
