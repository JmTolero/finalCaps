    import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
    import './App.css';
    import { LandingPage } from './pages/landingpage';
    import { Login } from "./pages/login.jsx";
    // import Nav from '../src/components/nav';

    function App() {
  return (
    <>
    <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />        
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </>
      
   
      
  );
}

    export default App;
