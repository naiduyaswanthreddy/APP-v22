import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CompanyLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Extract companyId from URL query parameters
    const params = new URLSearchParams(location.search);
    const companyId = params.get('companyId');
    
    if (companyId) {
      fetchCompanyDetails(companyId);
    }
  }, [location]);
  
  const fetchCompanyDetails = async (companyId) => {
    try {
      const companyDoc = await getDocs(query(
        collection(db, 'companies'),
        where('__name__', '==', companyId)
      ));
      
      if (!companyDoc.empty) {
        const companyData = companyDoc.docs[0].data();
        setCompanyName(companyData.companyName);
        setEmail(companyData.email || '');
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verify this user is associated with a company
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('uid', '==', userCredential.user.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Not authorized as a company user');
      }
      
      // Log the login activity
      const companyData = querySnapshot.docs[0].data();
      const companyId = querySnapshot.docs[0].id;
      
      await addDoc(collection(db, 'activityLogs'), {
        companyId,
        activity: 'login',
        description: `${companyData.companyName} logged in`,
        timestamp: serverTimestamp()
      });
      
      // Set user role in localStorage
      localStorage.setItem('userRole', 'company');
      localStorage.setItem('companyId', companyId);
      
      // Redirect to company dashboard
      navigate('/company/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-8">
          <h2 className="text-2xl font-bold text-white text-center">
            {companyName ? `${companyName} Portal` : 'Company Login'}
          </h2>
        </div>
        
        <div className="p-8">
          <ToastContainer position="top-right" autoClose={3000} />
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded font-medium text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogin;