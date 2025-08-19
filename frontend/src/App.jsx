    import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
    import './App.css';
    import { LandingPage } from './pages/landingpage';
    import { Login } from "./pages/login.jsx";
    import { UserRegister } from "./pages/userRegister.jsx";
    import { Home } from "./pages/home.jsx";
    import { Admin } from "./pages/admin/admin.jsx";
    import { Vendor } from "./pages/vendor.jsx";
    // import Nav from '../src/components/nav';

    function App() {
  const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
  const user = userRaw ? JSON.parse(userRaw) : null;

  const requireRole = (role, element) => {
    const currentRole = (user?.role || 'customer').toLowerCase();
    if (currentRole !== role) return <Navigate to="/login" replace />;
    return element;
  };
  return (
    <>
    <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />        
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/home" element={<Home />} />
          <Route path="/admin/*" element={requireRole('admin', <Admin />)} />
          <Route path="/vendor" element={requireRole('vendor', <Vendor />)} />
        </Routes>
      </Router>
    </>
      
   
      
  );
}

    export default App;
