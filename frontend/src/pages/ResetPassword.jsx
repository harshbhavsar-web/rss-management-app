import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, Hash } from 'lucide-react';
import api from '../utils/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [formData, setFormData] = useState({ otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error('Invalid access');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp || !formData.newPassword) {
      return toast.error('All fields are required');
    }
    
    if (formData.otp.length !== 6) {
      return toast.error('OTP must be exactly 6 digits');
    }

    if (formData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }

    setLoading(true);
    try {
      const res = await api.post('/users/reset-password', { 
        email, 
        otp: formData.otp, 
        newPassword: formData.newPassword 
      });
      toast.success(res.data.message || 'Password reset successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-20 px-4 bg-gray-50 min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Reset Password</h2>
        <p className="text-center text-sm text-gray-500 mb-8">Enter the OTP sent to {email}</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit OTP</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="text-gray-400 w-5 h-5" />
              </div>
              <input 
                type="text" 
                name="otp" 
                maxLength="6"
                required 
                value={formData.otp}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-saffron-500 tracking-widest text-lg font-mono"
                placeholder="------"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-gray-400 w-5 h-5" />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                name="newPassword" 
                required 
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-saffron-500"
                placeholder="Min 6 characters"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-saffron-600 text-white font-bold py-3 px-4 rounded-md hover:bg-saffron-700 transition disabled:bg-saffron-400"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-semibold text-saffron-600 hover:text-saffron-500">
              Cancel
            </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
