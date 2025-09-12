import React from "react";
import { Link } from "react-router-dom";
import  { Nav } from "../../components/shared/nav"; 
import logoImage from '../../assets/images/LOGO.png';
export const LandingPage = () => {
    return (
       <>
       <Nav />
       <div className="scroll-smooth bg-gradient-to-br from-sky-200 to-blue-400">

        <section className="flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-20">
            <div className="flex-1 flex flex-col items-center lg:items-start space-y-6 text-center lg:text-left mb-8 lg:mb-0">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-pink-500 italic">Chill</span><span className="text-gray-700">Net</span>
            </h1>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold italic text-white drop-shadow-lg">Chill. Order. Enjoy!</h2>
            <p className="text-lg sm:text-xl text-sky-100 italic font-medium max-w-2xl">The easiest way to order and sell dirty ice cream online!</p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 w-full sm:w-auto">
                <Link to="/login" className="bg-[#ffddae] font-semibold px-8 py-4 rounded-full border border-gray-400 shadow-lg flex items-center justify-center transition hover:bg-[#ffe7c4] w-full sm:w-auto transform hover:scale-105 text-amber-800 text-lg">
                Book now
                <img src="/images/arrow.png" alt="toArrow" className="ml-3 w-6 h-6" />
                </Link>
                <Link to="/vendor-register" className="text-yellow-100 font-semibold hover:underline transition text-lg">Become a Vendor</Link>
            </div>
            </div>

            <div className="flex-1 flex justify-center lg:justify-end">
             <img src={logoImage} alt="ChillNet Ice Cream" className="rounded-2xl shadow-2xl w-full max-w-sm lg:max-w-md xl:max-w-lg object-cover" />
            </div>
        </section>

    {/* <!-- Drum Cards Section --> */}
    <h1 className="text-3xl md:text-5xl font-extrabold text-center mb-10 mt-16">You Can Select a Different Drum Sizes</h1>
    <section id="drums" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-center items-center gap-8 mt-24 mb-20 px-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center w-full max-w-sm hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-br from-amber-100 to-orange-200 w-full h-64 rounded-lg mb-6 flex items-center justify-center border-2 border-dashed border-amber-300">
                <div className="text-center">
                    <div className="text-6xl mb-2">🥤</div>
                    <p className="text-amber-600 font-medium">Medium Drum Image</p>
                    <p className="text-amber-500 text-sm">Template Placeholder</p>
                </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Medium Drum</h3>
            <p className="text-gray-600 text-center mb-6">Perfect for small gatherings and family events</p>
            <button className="bg-[#ffddae] text-gray-800 font-semibold px-6 py-3 rounded-lg shadow w-full hover:bg-[#ffe7c4] transition-colors">Schedule now</button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center w-full max-w-sm hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-br from-amber-100 to-orange-200 w-full h-64 rounded-lg mb-6 flex items-center justify-center border-2 border-dashed border-amber-300">
                <div className="text-center">
                    <div className="text-6xl mb-2">🍦</div>
                    <p className="text-amber-600 font-medium">Large Drum Image</p>
                    <p className="text-amber-500 text-sm">Template Placeholder</p>
                </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Large Drum</h3>
            <p className="text-gray-600 text-center mb-6">Ideal for big parties and celebrations</p>
            <button className="bg-[#ffddae] text-gray-800 font-semibold px-6 py-3 rounded-lg shadow w-full hover:bg-[#ffe7c4] transition-colors">Schedule now</button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center w-full max-w-sm hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-br from-amber-100 to-orange-200 w-full h-64 rounded-lg mb-6 flex items-center justify-center border-2 border-dashed border-amber-300">
                <div className="text-center">
                    <div className="text-6xl mb-2">🧊</div>
                    <p className="text-amber-600 font-medium">Small Drum Image</p>
                    <p className="text-amber-500 text-sm">Template Placeholder</p>
                </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Small Drum</h3>
            <p className="text-gray-600 text-center mb-6">Great for personal treats and small groups</p>
            <button className="bg-[#ffddae] text-gray-800 font-semibold px-6 py-3 rounded-lg shadow w-full hover:bg-[#ffe7c4] transition-colors">Schedule now</button>
            </div>
        </section>

        {/* <!-- Discover Flavors - Dirty Ice Cream Drums --> */}
        <section id="flavors" className="mt-24 mb-24 px-6">
            <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-12">DISCOVER FLAVORS</h2>
            <p className="text-center text-lg text-gray-600 mb-12 max-w-3xl mx-auto">Experience the authentic taste of Filipino dirty ice cream with our traditional drum flavors</p>
            
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto mb-12">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search for your favorite dirty ice cream flavors..." 
                        className="w-full px-6 py-4 pl-12 rounded-full bg-white text-gray-700 placeholder-gray-400 outline-none shadow-lg text-lg" 
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button className="absolute right-2 top-2 bg-[#ffddae] text-gray-800 font-semibold px-6 py-2 rounded-full hover:bg-[#ffe7c4] transition-colors">
                        Search
                    </button>
                </div>
            </div>

            {/* Drum Flavors Grid */}
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
                    {/* Strawberry Drum */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="bg-gradient-to-br from-pink-100 to-purple-200 h-56 flex items-center justify-center relative">
                            <div className="text-center">
                                <div className="text-6xl mb-3">🍓</div>
                                <div className="bg-white bg-opacity-80 rounded-lg p-3">
                                    <p className="text-pink-600 font-bold text-lg">Strawberry</p>
                                    <p className="text-pink-500 text-sm">Dirty Ice Cream</p>
                                </div>
                            </div>
                            {/* Drum size indicator */}
                            <div className="absolute top-2 right-2 bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                3-8 GAL
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-xl mb-2">Strawberry Delight</h3>
                            <p className="text-gray-600 text-sm mb-4">Fresh strawberry dirty ice cream in traditional drum</p>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Small (3 gal)</span>
                                    <span className="font-bold text-green-600">₱1,800</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Medium (5 gal)</span>
                                    <span className="font-bold text-green-600">₱2,500</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Large (8 gal)</span>
                                    <span className="font-bold text-green-600">₱3,200</span>
                                </div>
                            </div>
                            <button className="bg-[#ffddae] text-gray-800 px-4 py-3 rounded-lg text-sm font-medium hover:bg-[#ffe7c4] transition-colors w-full">
                                Order Now
                            </button>
                        </div>
                    </div>

                    {/* Chocolate Drum */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="bg-gradient-to-br from-yellow-100 to-orange-200 h-56 flex items-center justify-center relative">
                            <div className="text-center">
                                <div className="text-6xl mb-3">🍫</div>
                                <div className="bg-white bg-opacity-80 rounded-lg p-3">
                                    <p className="text-orange-600 font-bold text-lg">Chocolate</p>
                                    <p className="text-orange-500 text-sm">Dirty Ice Cream</p>
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                3-8 GAL
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-xl mb-2">Chocolate Heaven</h3>
                            <p className="text-gray-600 text-sm mb-4">Rich chocolate dirty ice cream in traditional drum</p>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Small (3 gal)</span>
                                    <span className="font-bold text-green-600">₱1,800</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Medium (5 gal)</span>
                                    <span className="font-bold text-green-600">₱2,500</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Large (8 gal)</span>
                                    <span className="font-bold text-green-600">₱3,200</span>
                                </div>
                            </div>
                            <button className="bg-[#ffddae] text-gray-800 px-4 py-3 rounded-lg text-sm font-medium hover:bg-[#ffe7c4] transition-colors w-full">
                                Order Now
                            </button>
                        </div>
                    </div>

                    {/* Ube Drum */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="bg-gradient-to-br from-purple-100 to-indigo-200 h-56 flex items-center justify-center relative">
                            <div className="text-center">
                                <div className="text-6xl mb-3">🍇</div>
                                <div className="bg-white bg-opacity-80 rounded-lg p-3">
                                    <p className="text-purple-600 font-bold text-lg">Ube</p>
                                    <p className="text-purple-500 text-sm">Dirty Ice Cream</p>
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                3-8 GAL
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-xl mb-2">Ube Special</h3>
                            <p className="text-gray-600 text-sm mb-4">Traditional Filipino ube dirty ice cream</p>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Small (3 gal)</span>
                                    <span className="font-bold text-green-600">₱1,800</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Medium (5 gal)</span>
                                    <span className="font-bold text-green-600">₱2,500</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Large (8 gal)</span>
                                    <span className="font-bold text-green-600">₱3,200</span>
                                </div>
                            </div>
                            <button className="bg-[#ffddae] text-gray-800 px-4 py-3 rounded-lg text-sm font-medium hover:bg-[#ffe7c4] transition-colors w-full">
                                Order Now
                            </button>
                        </div>
                    </div>

                    {/* Coconut Drum */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="bg-gradient-to-br from-green-100 to-teal-200 h-56 flex items-center justify-center relative">
                            <div className="text-center">
                                <div className="text-6xl mb-3">🥥</div>
                                <div className="bg-white bg-opacity-80 rounded-lg p-3">
                                    <p className="text-teal-600 font-bold text-lg">Coconut</p>
                                    <p className="text-teal-500 text-sm">Dirty Ice Cream</p>
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 bg-teal-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                3-8 GAL
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-xl mb-2">Coconut Dream</h3>
                            <p className="text-gray-600 text-sm mb-4">Tropical coconut dirty ice cream</p>
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Small (3 gal)</span>
                                    <span className="font-bold text-green-600">₱1,800</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Medium (5 gal)</span>
                                    <span className="font-bold text-green-600">₱2,500</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Large (8 gal)</span>
                                    <span className="font-bold text-green-600">₱3,200</span>
                                </div>
                            </div>
                            <button className="bg-[#ffddae] text-gray-800 px-4 py-3 rounded-lg text-sm font-medium hover:bg-[#ffe7c4] transition-colors w-full">
                                Order Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* View All Products Button */}
                <div className="text-center">
                    <Link 
                        to="/customer" 
                        className="bg-[#ffddae] text-gray-800 font-semibold px-8 py-4 rounded-full hover:bg-[#ffe7c4] transition-colors text-lg shadow-lg hover:shadow-xl transition-shadow"
                    >
                        View All Drum Flavors →
                    </Link>
                </div>
            </div>
    </section>

    {/* <!-- About Us --> */}
        <section className="relative mt-24 mb-24 px-6 min-h-[700px] flex flex-col items-center justify-center" id="aboutUs">
        <h3 className="text-3xl md:text-5xl font-extrabold text-center mb-12 z-10">About Us</h3>
            <div className="relative flex flex-col md:flex-row gap-12 w-full max-w-7xl mx-auto">
            {/* <!-- Text Boxes --> */}
            <div className="flex flex-col gap-8 z-10 w-full md:w-1/2">
                <div className="bg-white bg-opacity-80 rounded-2xl p-6 text-gray-800 text-base shadow-lg">
                Our system is designed to be simple, rewarding, and community-driven...
                </div>
                <div className="bg-white bg-opacity-80 rounded-2xl p-6 text-gray-800 text-base shadow-lg">
                Our system operates through a structured yet user-friendly process...
                </div>
            </div>

            {/* <!-- Floating Images --> */}
            <div className="relative flex-1 hidden md:block min-h-[500px]">
                <img src="/globe.svg" alt="1" className="absolute top-0 left-24 w-48 md:w-64 shadow-xl rounded-xl opacity-90 z-20" />
                <img src="/next.svg" alt="2" className="absolute top-32 left-0 w-60 md:w-80 shadow-xl rounded-xl opacity-80 z-10" />
                <img src="/window.svg" alt="3" className="absolute top-64 left-32 w-56 md:w-72 shadow-xl rounded-xl opacity-80 z-30" />
                <img src="/file.svg" alt="4" className="absolute top-52 left-64 w-48 md:w-64 shadow-xl rounded-xl opacity-70 z-40" />
            </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-sky-200 to-blue-300 opacity-60 -z-10 rounded-2xl"></div>
         </section>
        </div>
       </>
       
        
    )
}

export default LandingPage;