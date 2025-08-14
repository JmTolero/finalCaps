// import { useRef, useState, useEffect } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {NavWithLogo} from '../components/nav.jsx';


export const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [status, setStatus] = useState({ type: null, message: '' });

    const handleChange = (e) => {
      const { id, value } = e.target;
      setForm(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setStatus({ type: null, message: '' });
      try {
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiBase}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await res.json() : { error: await res.text() };
        if (!res.ok) {
          throw new Error(data?.error || 'Login failed');
        }
        // For now, just stash minimal user info in session and route by role
        sessionStorage.setItem('user', JSON.stringify(data.user));
        const role = (data.user?.role || 'customer').toLowerCase();
        if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'vendor') {
          navigate('/vendor');
        } else {
          navigate('/home');
        }
      } catch (err) {
        setStatus({ type: 'error', message: err.message || 'Something went wrong' });
      }
    };

    return (
      <>
      <NavWithLogo />
        <main className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="rounded-xl shadow-lg px-6 py-6 w-full max-w-md text-black" style={{backgroundColor: "#D4F6FF"}}>
            <h2 className="text-4xl font-bold text-center mb-8">Welcome</h2>

            
            {/* <!-- Username --> */}
            <form onSubmit={handleSubmit}>
                  <label className="block text-xl font-semibold mb-2 mt-4" htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    className="w-full mb-4 px-4 py-2 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                    required
                    autoComplete='off'
                    value={form.username}
                    onChange={handleChange}
                  />

                  {/* <!-- Password --> */}
                  <label className="block text-xl font-semibold mb-2 mt-2" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    className="w-full mb-6 px-4 py-2 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
                    required
                    value={form.password}
                    onChange={handleChange}
                  />

                  {/* <!-- Login Button --> */}
                  <button 
                    type="submit"
                    className="block text-center w-1/2 mx-auto bg-[#33D0D8] hover:bg-[#2bbac1] text-white font-bold py-2 rounded shadow-md text-base transition transition-transform transform hover:scale-105"
                  >
                    LOGIN
                  </button>
            </form>
            {status.type && (
              <div className={`text-center mt-3 ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {status.message}
              </div>
            )}
            

            {/* <!-- Google Sign-In Button --> */}
            <div className="text-center mt-4">
              <button
                className="flex items-center justify-center gap-2 bg-white border border-gray-400 rounded shadow-md px-4 py-2 text-sm hover:bg-gray-100 transition mx-auto"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
                <span>Sign in with Google</span>
              </button>
            </div>

            {/* <!-- Registration Link --> */}
            
            <div className="text-center mt-6">
              <Link to="/register"  className="text-indigo-800 font-bold hover:underline transition">
                No Account? Register
              </Link>
            </div>
          </div>
        </main>
        
      </>
    );
}

export default Login;