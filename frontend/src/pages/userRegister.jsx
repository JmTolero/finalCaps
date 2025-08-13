import { Link } from "react-router-dom";
import { NavWithLogo } from "../components/nav"
import styleRegister from '../styles/userRegister.css';

export const UserRegister = () => {

    

  return (
    <>
    <NavWithLogo />

        <main className="flex justify-center items-center py-16">
            
            <div className="w-full max-w-md registerbox rounded-lg shadow-lg p-6">

                <h1 className="mb-4 text-center css-register">Register</h1>

                <form   
                className="space-y-2"
                action="#"
                method="POST"
                encType="multipart/form-data"
                >
                {/* First Name */}
                    <div>
                        <label
                        className="block text-sm font-semibold mb-1"
                        htmlFor="firstname"
                        >
                        First Name
                        </label>
                        <input
                        id="firstname"
                        type="text"
                        placeholder="Enter First Name"
                        required
                        className="w-full px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
                        />
                    </div>

                {/* last Name */}
                     <div>
                        <label
                        className="block text-sm font-semibold mb-1"
                        htmlFor="lastname"
                        >
                        Last Name
                        </label>
                        <input
                        id="lastname"
                        type="text"
                        placeholder="Enter Last name"
                        required
                        className="w-full px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
                        />
                    </div>

                {/* Username */}
                    <div>
                        <label
                        className="block text-sm font-semibold mb-1"
                        htmlFor="username"
                        >
                        Username
                        </label>
                        <input
                        id="username"
                        type="text"
                        autoComplete="off"
                        placeholder="Enter username"
                        required
                        className="w-full px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
                        />
                    </div>

                {/* Password */}
                    <div>
                        <label
                        className="block text-sm font-semibold mb-1"
                        htmlFor="password"
                        >
                        Password
                        </label>
                        <input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        required
                        className="w-full px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
                        />
                    </div>

                {/* Confirm Password */}
                    <div>
                        <label
                        className="block text-sm font-semibold mb-1"
                        htmlFor="confirm"
                        >
                        Confirm Password
                        </label>
                        <input
                        id="confirm"
                        type="password"
                        placeholder="Re-enter password"
                        required
                        className="w-full px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
                        />
                    </div>

                {/* Contact Number */}
                    <div>
                        <label
                        className="block text-sm font-semibold mb-1"
                        htmlFor="contact"
                        >
                        Contact Number
                        </label>
                        <input
                        id="contact"
                        type="number"
                        placeholder="09XXXXXXXXX"
                        autoComplete="off"
                        required
                        className="w-full px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
                        />
                    </div>

                {/* Email */}
                    <div>
                        <label
                        className="block text-sm font-semibold mb-1"
                        htmlFor="email"
                        >
                        Email Address
                        </label>
                        <input
                        id="email"
                        type="email"
                        placeholder="Enter email"
                        required
                        className="w-full px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
                        />
                    </div>

                {/* Submit Button */}
                    <div className="flex justify-center pt-4">
                        <button
                        type="submit"
                        className="bg-[#33D0D8] hover:bg-[#2BBAC2] text-white font-bold py-2 px-6 text-sm rounded-full shadow-md transition-transform transform hover:scale-105"
                        >
                        REGISTER NOW
                        </button>
                    </div>

                <div className="text-center mt-4">
                    <span className="text-gray-600 text-sm font-medium">or</span>
                </div>

                {/* Google Sign In */}
                <div className="flex justify-center mt-4">
                    <button
                    type="button"
                    className="flex items-center border border-gray-400 rounded px-4 py-2 bg-white hover:bg-gray-100 transition"
                    >
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/250px-Google_Favicon_2025.svg.png"
                        alt="Google"
                        className="w-6 h-6 mr-2"
                    />
                    <span className="text-gray-800 font-medium text-sm">
                        Sign in with Google
                    </span>
                    </button>
                </div>
                </form>
            </div>
        </main>

    </>
  );
};
