import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_BASE_URL = 'http://localhost:5000/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('🔍 فحص المصادقة:', { token: savedToken, userData });
      
      if (savedToken && userData) {
        const parsedUser = JSON.parse(userData);
        console.log('✅ تم العثور على مستخدم:', parsedUser);
        setToken(savedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } else {
        console.log('❌ لا توجد بيانات مصادقة');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ خطأ في فحص المصادقة:', error);
      logout();
    } finally {
      setLoading(false);
      console.log('🏁 انتهى فحص المصادقة');
    }
  };

  const login = async (credentials, isClient = false) => {
    try {
      console.log('🔐 Attempting login via backend:', { credentials, isClient });
      const endpoint = isClient ? '/auth/client-login' : '/auth/login';
      console.log(`🔗 Calling ${API_BASE_URL}${endpoint}`);

      // Try backend auth first
      try {
        const response = await axios.post(`${API_BASE_URL}${endpoint}`, credentials);
        console.log('✅ Backend response:', response.data);
        
        const data = response.data;
        if (data && data.token) {
          const savedToken = data.token;
          const savedUser = data.user || data.client || null;

          console.log('💾 Saving token:', savedToken);
          console.log('👤 Saving user:', savedUser);

          // Save to localStorage and state
          localStorage.setItem('token', savedToken);
          if (savedUser) localStorage.setItem('user', JSON.stringify(savedUser));
          setToken(savedToken);
          setUser(savedUser);
          setIsAuthenticated(true);

          console.log('✅ Login via backend successful');
          return { success: true, data: savedUser };
        }

        console.log('❌ No token in response:', data);
        return { success: false, message: data.message || 'Login failed' };
      } catch (err) {
        console.error('❌ Backend login error:', err);
        console.error('🔍 Error details:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url
        });
        console.warn('⚠️ Backend login failed, falling back to demo mode:', err.message);

        // Fallback to demo users (offline/demo mode)
        await new Promise(resolve => setTimeout(resolve, 500));

        const testUsers = {
          employee: [
            { 
              login: 'admin', 
              password: '123456', 
              role: 'admin', 
              name: 'مدير النظام', 
              id: 1,
              email: 'admin@office.com'
            },
            { 
              login: 'employee', 
              password: '123456', 
              role: 'employee', 
              name: 'موظف تجريبي', 
              id: 2,
              email: 'employee@office.com'
            }
          ],
          client: [
            { 
              login: 'client1', 
              password: '123456', 
              name: 'عميل تجريبي 1', 
              id: 101,
              phone: '123456789',
              address: 'عنوان العميل 1'
            },
            { 
              login: 'client2', 
              password: '123456', 
              name: 'عميل تجريبي 2', 
              id: 102,
              phone: '987654321', 
              address: 'عنوان العميل 2'
            }
          ]
        };

        const userType = isClient ? 'client' : 'employee';
        const userList = testUsers[userType];

        // search demo user
        const foundUser = userList.find(u => u.login === credentials.login && u.password === credentials.password);
        if (foundUser) {
          const generatedToken = 'demo-token-' + Date.now();
          const userInfo = { ...foundUser, type: userType, token: generatedToken };
          localStorage.setItem('token', generatedToken);
          localStorage.setItem('user', JSON.stringify(userInfo));
          setToken(generatedToken);
          setUser(userInfo);
          setIsAuthenticated(true);
          console.log('✅ Demo login successful');
          return { success: true, data: userInfo };
        }

        return { success: false, message: err.response?.data?.message || err.message || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      return { 
        success: false, 
        message: 'حدث خطأ في النظام: ' + error.message 
      };
    }
  };

  const logout = () => {
  console.log('🚪 جاري تسجيل الخروج');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setToken(null);
  setUser(null);
  setIsAuthenticated(false);
  console.log('✅ تم تسجيل الخروج');
};

  const value = {
  user,
  token,
  loading,
  isAuthenticated,
  login,
  logout,
  hasRole: (role) => user?.role === role,
  isAdmin: () => user?.role === 'admin',
  isEmployee: () => user?.role === 'employee',
  isClient: () => user?.type === 'client',
};

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};