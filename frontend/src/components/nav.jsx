import {Link} from 'react-router-dom';
import { useState, useEffect } from 'react';
import logoImage from '../assets/images/LOGO.png';
import { ProfileDropdown } from './ProfileDropdown';

export const Nav = () => {
    return (
        <div>
            <nav className="w-full bg-sky-100 shadow flex items-center justify-center md:justify-end px-6 md:px-12 py-4">
                <ul className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-12 text-lg font-semibold text-gray-700 text-center md:text-left">
                <li><Link to="#aboutUs" className="hover:text-blue-500 transition">About Us</Link></li>
                <li><Link to="#" className="hover:text-blue-500 transition">Features</Link></li>
                <li><Link to="#" className="hover:text-blue-500 transition">Contact Us</Link></li>
                <li><Link to="#" className="hover:text-blue-500 transition">Home</Link></li>
                </ul>
            </nav>
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