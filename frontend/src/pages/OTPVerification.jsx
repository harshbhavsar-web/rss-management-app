import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Phone, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;
  const identifier = location.state?.identifier;
  const otpType = location.state?.otpType; // 'email' or 'phone'

  const [otp, setOtp] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Resend Timer Logic
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!userId || !identifier || !otpType) {
      toast.error('Invalid access');
      navigate('/signup');
    }
  }, [userId, identifier, otpType, navigate]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  useEffect(() => {
    const loginUser = async () => {
      if (isVerified) {
        toast.success('Successfully verified!');
        try {
          const res = await api.post('/users/login', { identifier: identifier, password: location.state?.password || 'dummy' });
          localStorage.setItem('userToken', res.data.token);
          
          const { user } = res.data;
          const isOnboarded = user.role === 'admin' || !!user.shakha || !!user.hasJoinRequest;
          localStorage.setItem('userOnboarded', isOnboarded.toString());
          localStorage.setItem('userRole', user.role);
          
          if (isOnboarded) {
            navigate('/home');
          } else {
            navigate('/onboarding');
          }
        } catch(e) {
          toast.success('Verified! Please sign in.');
          navigate('/login');
        }
      }
    };
    loginUser();
  }, [isVerified, identifier, navigate, location.state]);

  const verifyOTPHandler = async () => {
    if (!otp || otp.length !== 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      await api.post('/users/verify-otp', { userId, otp });
      setIsVerified(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.post('/users/resend-otp', { userId });
      toast.success(`New OTP sent to your ${otpType}`);
      setTimeLeft(60);
      setCanResend(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-20 px-4 bg-gray-50 min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Verification Required</h2>
        <p className="text-center text-sm text-gray-500 mb-8">We sent a code to {identifier}</p>
        
        <div className="space-y-6">
          <div className={`p-4 rounded-lg border ${isVerified ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <label className="flex items-center text-sm font-bold text-gray-700 capitalize">
                {otpType === 'phone' ? <Phone className="w-4 h-4 mr-2" /> : <Mail className="w-4 h-4 mr-2" />} 
                {otpType} OTP
              </label>
              {isVerified && <span className="text-green-600 text-sm font-bold flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Verified</span>}
            </div>
            {!isVerified && (
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  maxLength="6" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-saffron-500 focus:border-saffron-500 text-center tracking-widest text-lg font-mono" 
                  placeholder="------" 
                />
                <button onClick={verifyOTPHandler} disabled={loading} className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition disabled:opacity-50">Verify</button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm">
          {!canResend ? (
            <p className="text-gray-500">Resend OTP in <span className="font-bold text-gray-800">{timeLeft}s</span></p>
          ) : (
            <button onClick={handleResend} disabled={loading} className="text-saffron-600 font-bold hover:text-saffron-700">
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default OTPVerification;
