import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

const UserLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.identifier || !credentials.password) {
      return toast.error('All fields are required');
    }

    setLoading(true);
    try {
      const res = await api.post('/users/login', credentials);
      localStorage.setItem('userToken', res.data.token); // Store standard user token
      
      const { user } = res.data;
      const isOnboarded = user.role === 'admin' || !!user.shakha || !!user.hasJoinRequest;
      localStorage.setItem('userOnboarded', isOnboarded.toString());
      localStorage.setItem('userRole', user.role);

      toast.success('Login Successful');
      
      if (isOnboarded) {
        navigate('/home');
      } else {
        navigate('/onboarding');
      }
    } catch (error) {
       toast.error(error.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-20 px-4 bg-gray-50 min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Welcome Back</h2>
        <p className="text-center text-sm text-gray-500 mb-8">Sign in to your RSS Sardar Nagar account</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email or Mobile Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="text-gray-400 w-5 h-5" />
              </div>
              <input 
                type="text" 
                name="identifier" 
                required 
                value={credentials.identifier}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-saffron-500"
                placeholder="Email or 10-digit number"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-gray-400 w-5 h-5" />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                required 
                value={credentials.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-saffron-500"
                placeholder="Your password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm font-semibold text-saffron-600 hover:text-saffron-500">
              Forgot Password?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-saffron-600 text-white font-bold py-3 px-4 rounded-md hover:bg-saffron-700 transition disabled:bg-saffron-400"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account? <Link to="/signup" className="font-semibold text-saffron-600 hover:text-saffron-500">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default UserLogin;
