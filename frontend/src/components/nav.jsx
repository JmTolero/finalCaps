import {Link} from 'react-router-dom';
import logoImage from '../assets/images/LOGO.png';

export const Nav = () => {
    return (
        <div>
            <nav class="w-full bg-sky-100 shadow flex items-center justify-center md:justify-end px-6 md:px-12 py-4">
                <ul class="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-12 text-lg font-semibold text-gray-700 text-center md:text-left">
                <li><a href="#" class="hover:text-blue-500 transition">Home</a></li>
                <li><a href="#aboutUs" class="hover:text-blue-500 transition">About Us</a></li>
                <li><a href="#" class="hover:text-blue-500 transition">Features</a></li>
                <li><a href="#" class="hover:text-blue-500 transition">Contact Us</a></li>
                </ul>
            </nav>
        </div>
    );
}

export const NavWithLogo = () => {
    return(
        <div>
            <header class="w-full bg-sky-100 flex items-center px-8 py-4">
                <div class="flex items-center space-x-3">
                    <Link to="/">
                        <img
                            src={logoImage}
                            alt="ChillNet Logo"
                            className="ChillNet-Logo h-10 rounded-full object-cover"
                        />
                    </Link>
                    
                    {/* <span class="text-3xl font-bold">
                        <span class="text-pink-500 italic">Chill</span>
                        <span class="text-gray-700">Net</span>
                    </span> */}
                </div>
            </header>
        </div>
    )
    
}


// export default Nav; 