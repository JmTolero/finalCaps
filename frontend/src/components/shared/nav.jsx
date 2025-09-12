import {Link} from 'react-router-dom';
import { useState, useEffect } from 'react';
import logoImage from '../../assets/images/LOGO.png';
import { ProfileDropdown } from './ProfileDropdown';

export const Nav = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMenuOpen(false);
    };

    return (
        <div>
            <nav className={`w-full fixed top-0 z-50 transition-all duration-300 ${
                isScrolled 
                    ? 'bg-white/95 backdrop-blur-md shadow-lg' 
                    : 'bg-sky-100/95 backdrop-blur-sm shadow-md'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo and Brand */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center">
                                <span className="text-2xl font-bold">
                                    <span className="text-pink-500 italic">Chill</span>
                                    <span className="text-gray-700">Net</span>
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            <button 
                                onClick={() => scrollToSection('aboutUs')}
                                className="text-gray-700 hover:text-blue-500 transition-colors duration-200 font-medium text-lg"
                            >
                                About Us
                            </button>
                            <button 
                                onClick={() => scrollToSection('drums')}
                                className="text-gray-700 hover:text-blue-500 transition-colors duration-200 font-medium text-lg"
                            >
                                Features
                            </button>
                            <button 
                                onClick={() => scrollToSection('flavors')}
                                className="text-gray-700 hover:text-blue-500 transition-colors duration-200 font-medium text-lg"
                            >
                                Flavors
                            </button>
                            <Link 
                                to="/login"
                                className="px-4 py-2 text-gray-700 hover:text-blue-500 transition-colors duration-200 font-medium"
                            >
                                Login
                            </Link>
                            <Link 
                                to="/user-register"
                                className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                                Get Started
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-gray-700 hover:text-blue-500 focus:outline-none focus:text-blue-500 transition-colors duration-200"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden">
                            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-md rounded-lg mt-2 shadow-lg">
                                <button 
                                    onClick={() => scrollToSection('aboutUs')}
                                    className="block px-3 py-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors duration-200 font-medium"
                                >
                                    About Us
                                </button>
                                <button 
                                    onClick={() => scrollToSection('drums')}
                                    className="block px-3 py-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors duration-200 font-medium"
                                >
                                    Features
                                </button>
                                <button 
                                    onClick={() => scrollToSection('flavors')}
                                    className="block px-3 py-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors duration-200 font-medium"
                                >
                                    Flavors
                                </button>
                                <div className="border-t border-gray-200 my-2"></div>
                                <Link 
                                    to="/login"
                                    className="block px-3 py-2 text-gray-700 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors duration-200 font-medium"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link 
                                    to="/user-register"
                                    className="block px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 font-medium text-center"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
            {/* Spacer to prevent content from being hidden behind fixed navbar */}
            <div className="h-16"></div>
        </div>
    );
}

export const NavWithLogo = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const updateUser = () => {
            const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
            const userData = userRaw ? JSON.parse(userRaw) : null;
            setUser(userData);
        };

        // Initial load
        updateUser();

        // Listen for storage changes (when user logs in/out in another tab)
        const handleStorageChange = (e) => {
            if (e.key === 'user') {
                updateUser();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Custom event for same-tab login/logout
        const handleUserChange = () => {
            updateUser();
        };

        window.addEventListener('userChanged', handleUserChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userChanged', handleUserChange);
        };
    }, []);

    return(
        <div>
            <header className="w-full bg-sky-100 flex items-center justify-between px-8 py-4">
                <div className="flex items-center space-x-3">
                    <Link to="/">
                        <img
                            src={logoImage}
                            alt="ChillNet Logo"
                            className="ChillNet-Logo h-10 rounded-full object-cover"
                        />
                    </Link>
                    
                    {/* <span className="text-3xl font-bold">
                        <span className="text-pink-500 italic">Chill</span>
                        <span className="text-gray-700">Net</span>
                    </span> */}
                </div>
                
                {/* Profile dropdown for all logged-in users */}
                {user && user.role ? (
                    <ProfileDropdown />
                ) : (
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/login"
                            className="px-4 py-2 text-gray-700 hover:text-blue-500 transition-colors duration-200 font-medium"
                        >
                            Login
                        </Link>
                        <Link
                            to="/user-register"
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 font-medium"
                        >
                            Register
                        </Link>
                    </div>
                )}
            </header>
        </div>
    )
    
}


// export default Nav; 