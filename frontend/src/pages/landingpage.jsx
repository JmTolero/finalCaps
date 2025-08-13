import React from "react";
import { Link } from "react-router-dom";
import { landingpagestyle } from '../styles/landingpage.css';
import  { Nav } from "../components/nav"; 
import Login from "./login";
// import pics from '../assets/images/piclogo.png';
export const LandingPage = () => {
    return (
       <>
       <Nav />
       <div class="scroll-smooth bg-gradient-to-br from-sky-200 to-blue-400">

        <section class="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-6 md:px-12 ">
            <div class="flex-1 flex flex-col items-start space-y-4 text-center md:text-left">
            <h1 class="text-4xl md:text-6xl font-bold">
                <span class="text-pink-500 italic">Chill</span><span class="text-gray-700">Net</span>
            </h1>
            <h2 class="text-xl md:text-3xl font-semibold italic text-white drop-shadow">Chill. Order. Enjoy!</h2>
            <p class="text-sm md:text-md text-sky-100 italic font-medium">The easiest way to order and sell dirty ice cream online!</p>
            <div class="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-3 sm:space-y-0 mt-4 w-full sm:w-auto">
                <Link to="/login" className="bg-[#ffddae] font-semibold px-8 py-3 rounded-full border border-gray-400 shadow flex items-center justify-center transition hover:bg-[#ffe7c4] w-full sm:w-auto transition transition-transform transform hover:scale-105 bookNow">
                Book now
                <img src="/images/arrow.png" alt="toArrow" class="GoArrow" />
                </Link>
                <a href="vendor-registration.html" class="text-yellow-100 font-semibold hover:underline transition">Become a Vendor</a>
            </div>
            </div>

            <div class="flex-1 flex justify-center mt-8 md:mt-1">
             <img src="/images/piclogo.png" alt="ChillNet Ice Cream" class="rounded-2xl shadow-2xl w-[90%] max-w-md object-cover" />
            </div>
        </section>

    {/* <!-- Drum Cards Section --> */}
    <h1 class="text-3xl md:text-5xl font-extrabold text-center mb-10 selectDrum">You Can Select a Different Drum Sizes</h1>
    <section id="drums" class="flex flex-col md:flex-row justify-center items-center gap-12 mt-24 mb-20 px-6">
            <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center w-full max-w-xs">
            <div class="bg-gray-300 w-full h-64 rounded mb-6"></div>
            <h3 class="text-2xl font-bold mb-6">Medium Drum</h3>
            <button class="bg-[#ffddae] text-gray-800 font-semibold px-6 py-2 rounded shadow w-full">Schedule now</button>
            </div>
            <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center w-full max-w-xs">
            <div class="bg-gray-300 w-full h-64 rounded mb-6"></div>
            <h3 class="text-2xl font-bold mb-6">Large Drum</h3>
            <button class="bg-[#ffddae] text-gray-800 font-semibold px-6 py-2 rounded shadow w-full">Schedule now</button>
            </div>
            <div class="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center w-full max-w-xs">
            <div class="bg-gray-300 w-full h-64 rounded mb-6"></div>
            <h3 class="text-2xl font-bold mb-6">Small Drum</h3>
            <button class="bg-[#ffddae] text-gray-800 font-semibold px-6 py-2 rounded shadow w-full">Schedule now</button>
            </div>
        </section>

        {/* <!-- Discover Flavors --> */}
        <section class="mt-24 mb-24 px-6">
            <h2 class="text-3xl md:text-5xl font-extrabold text-center mb-12">DISCOVER FLAVORS</h2>
            <div class="bg-sky-100 rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-center gap-12 max-w-7xl mx-auto">
            <div class="flex-1 w-full flex flex-col space-y-4">
                <input type="text" placeholder="See Vendors near your Location" class="w-full px-6 py-3 rounded-full bg-white text-gray-700 italic placeholder-gray-400 outline-none" />
                <button class="bg-[#ffddae] text-gray-800 font-semibold px-6 py-2 rounded shadow w-full sm:w-48">Locate Vendors</button>
            </div>
            <div class="flex-1 flex justify-center">
                <div class="bg-gray-600 rounded-2xl p-4">
                <img  alt="Map" class="w-[300px] md:w-[400px] h-[300px] md:h-[350px] object-cover rounded-xl" />
                </div>
            </div>
            </div>
    </section>

    {/* <!-- About Us --> */}
        <section class="relative mt-24 mb-24 px-6 min-h-[700px] flex flex-col items-center justify-center" id="aboutUs">
        <h3 class="text-3xl md:text-5xl font-extrabold text-center mb-12 z-10">About Us</h3>
            <div class="relative flex flex-col md:flex-row gap-12 w-full max-w-7xl mx-auto">
            {/* <!-- Text Boxes --> */}
            <div class="flex flex-col gap-8 z-10 w-full md:w-1/2">
                <div class="bg-white bg-opacity-80 rounded-2xl p-6 text-gray-800 text-base shadow-lg">
                Our system is designed to be simple, rewarding, and community-driven...
                </div>
                <div class="bg-white bg-opacity-80 rounded-2xl p-6 text-gray-800 text-base shadow-lg">
                Our system operates through a structured yet user-friendly process...
                </div>
            </div>

            {/* <!-- Floating Images --> */}
            <div class="relative flex-1 hidden md:block min-h-[500px]">
                <img src="/globe.svg" alt="1" class="absolute top-0 left-24 w-48 md:w-64 shadow-xl rounded-xl opacity-90 z-20" />
                <img src="/next.svg" alt="2" class="absolute top-32 left-0 w-60 md:w-80 shadow-xl rounded-xl opacity-80 z-10" />
                <img src="/window.svg" alt="3" class="absolute top-64 left-32 w-56 md:w-72 shadow-xl rounded-xl opacity-80 z-30" />
                <img src="/file.svg" alt="4" class="absolute top-52 left-64 w-48 md:w-64 shadow-xl rounded-xl opacity-70 z-40" />
            </div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-br from-sky-200 to-blue-300 opacity-60 -z-10 rounded-2xl"></div>
         </section>
        </div>
       </>
       
        
    )
}

export default LandingPage;