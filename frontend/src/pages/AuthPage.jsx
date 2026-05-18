import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn, UserPlus, ShieldAlert } from 'lucide-react';

const AuthPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 border-b-4 border-saffron-600 inline-block p-2">
          {t('app_title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please authenticate to access the portal.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-4">
          
          <Link to="/login" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-saffron-600 hover:bg-saffron-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron-500 transition-colors">
            <LogIn className="w-5 h-5 mr-2" /> Sign In
          </Link>

          <Link to="/signup" className="w-full flex justify-center py-3 px-4 border border-saffron-600 rounded-md shadow-sm text-sm font-medium text-saffron-600 bg-transparent hover:bg-saffron-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron-500 transition-colors">
            <UserPlus className="w-5 h-5 mr-2" /> Create New Account
          </Link>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">System</span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/admin/login" className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron-500 transition-colors">
                <ShieldAlert className="w-5 h-5 mr-2 text-gray-500" /> Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
