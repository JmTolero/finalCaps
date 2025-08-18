import { useState } from "react";
import axios from "axios";
// import { Link } from "react-router-dom";
import { NavWithLogo } from "../components/nav"
import '../styles/userRegister.css';

export const UserRegister = () => {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    password: "",
    confirm: "",
    contact: "",
    email: ""
  });
  const [status, setStatus] = useState({ type: null, message: "" });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });
  
    if (form.password !== form.confirm) {
      setStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    if(form.firstname === "" || form.lastname === "" || form.username === "" || form.password === "" || form.confirm === "" || form.contact === "" || form.email === ""){
      setStatus({ type: "error", message: "Please fill in all fields" });
      return;
    }
  
    try {
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:3001";
      const res = await axios.post(`${apiBase}/register`, form, {
        headers: { "Content-Type": "application/json" },
      });
  
      setStatus({ type: "success", message: "Registered successfully" });
      setForm({
        firstname: "",
        lastname: "",
        username: "",
        password: "",
        confirm: "",
        contact: "",
        email: "",
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.message || "Something went wrong";
      setStatus({ type: "error", message: errorMessage });
    }
  };

  return (
    <>
    <NavWithLogo />

        <main className="flex justify-center items-center py-16">
            
            <div className="w-full max-w-md registerbox rounded-lg shadow-lg p-6">

                <h1 className="mb-4 text-center css-register">Register</h1>

                <form   
                className="space-y-2"
                onSubmit={handleSubmit}
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
                        value={form.firstname}
                        onChange={handleChange}
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
                        value={form.lastname}
                        onChange={handleChange}
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
                        value={form.username}
                        onChange={handleChange}
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
                        value={form.password}
                        onChange={handleChange}
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
                        value={form.confirm}
                        onChange={handleChange}
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
                        value={form.contact}
                        onChange={handleChange}
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
                        value={form.email}
                        onChange={handleChange}
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

                    {status.type && (
                      <div className={`text-center mt-3 ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                        {status.message}
                      </div>
                    )}

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
