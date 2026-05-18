import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

const UserSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validate = () => {
    if (!formData.name || !formData.identifier || !formData.password) {
      toast.error('All fields are required');
      return false;
    }
    
    const isEmail = formData.identifier.includes('@');
    if (isEmail) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(formData.identifier)) {
        toast.error('Please enter a valid email address');
        return false;
      }
    } else {
      if (!/^\d{10}$/.test(formData.identifier)) {
        toast.error('Please enter a valid 10-digit mobile number, or an email address');
        return false;
      }
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const res = await api.post('/users/register', formData);
      toast.success(res.data.message);
      
      const otpType = formData.identifier.includes('@') ? 'email' : 'phone';
      // Pass the userId to the verification page via state
      navigate('/verify', { state: { 
        userId: res.data.userId, 
        identifier: formData.identifier,
        otpType: otpType,
        password: formData.password 
      }});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-20 px-4 bg-gray-50 min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Create Account</h2>
        <p className="text-center text-sm text-gray-500 mb-8">Join the RSS Sardar Nagar system</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="text-gray-400 w-5 h-5" /></div>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-saffron-500 focus:border-saffron-500" placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email or Mobile Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="text-gray-400 w-5 h-5" /></div>
              <input type="text" name="identifier" required value={formData.identifier} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-saffron-500 focus:border-saffron-500" placeholder="Email or 10-digit number" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="text-gray-400 w-5 h-5" /></div>
              <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:ring-saffron-500 focus:border-saffron-500" placeholder="Min 6 characters" />
               <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-saffron-600 text-white font-bold py-3 px-4 rounded-md hover:bg-saffron-700 transition disabled:bg-saffron-400 mt-2">
            {loading ? 'Creating Account & Sending OTP...' : 'Sign Up'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="font-semibold text-saffron-600 hover:text-saffron-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
export default UserSignup;
