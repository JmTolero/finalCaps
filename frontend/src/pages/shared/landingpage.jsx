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
    <section id="drums" className="grid grid-cols-2 lg:grid-cols-3 justify-center items-center gap-4 sm:gap-6 lg:gap-8 mt-24 mb-20 px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center w-full max-w-sm hover:shadow-xl transition-shadow duration-300">
            <div className="w-full h-48 sm:h-56 lg:h-64 rounded-lg mb-4 sm:mb-6 flex items-center justify-center overflow-hidden">
                <img src="/drumsize/medium.jpg" alt="Medium Drum" className="w-full h-full object-cover rounded-lg" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">Medium Drum</h3>
            <p className="text-gray-600 text-center mb-4 sm:mb-6 text-sm sm:text-base">Perfect for small gatherings and family events</p>
            <button className="bg-[#ffddae] text-gray-800 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow w-full hover:bg-[#ffe7c4] transition-colors text-sm sm:text-base">Schedule now</button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center w-full max-w-sm hover:shadow-xl transition-shadow duration-300">
            <div className="w-full h-48 sm:h-56 lg:h-64 rounded-lg mb-4 sm:mb-6 flex items-center justify-center overflow-hidden">
                <img src="/drumsize/Large.jpg" alt="Large Drum" className="w-full h-full object-cover rounded-lg" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">Large Drum</h3>
            <p className="text-gray-600 text-center mb-4 sm:mb-6 text-sm sm:text-base">Ideal for big parties and celebrations</p>
            <button className="bg-[#ffddae] text-gray-800 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow w-full hover:bg-[#ffe7c4] transition-colors text-sm sm:text-base">Schedule now</button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col items-center w-full max-w-sm hover:shadow-xl transition-shadow duration-300">
            <div className="w-full h-48 sm:h-56 lg:h-64 rounded-lg mb-4 sm:mb-6 flex items-center justify-center overflow-hidden">
                <img src="/drumsize/small.jpg" alt="Small Drum" className="w-full h-full object-cover rounded-lg" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-800">Small Drum</h3>
            <p className="text-gray-600 text-center mb-4 sm:mb-6 text-sm sm:text-base">Great for personal treats and small groups</p>
            <button className="bg-[#ffddae] text-gray-800 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow w-full hover:bg-[#ffe7c4] transition-colors text-sm sm:text-base">Schedule now</button>
            </div>
        </section>

        {/* <!-- Discover Flavors - Dirty Ice Cream Drums --> */}
        <section id="flavors" className="mt-24 mb-24 px-6">
            <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-12">DISCOVER FLAVORS</h2>
            <p className="text-center text-lg text-gray-600 mb-12 max-w-3xl mx-auto">Experience the authentic taste of Filipino dirty ice cream with our traditional drum flavors</p>
            

            {/* Drum Flavors Grid */}
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12">
                    {/* Strawberry Drum */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="h-48 sm:h-56 md:h-64 lg:h-72 flex items-center justify-center relative overflow-hidden">
                            <img src="/flavors/f1.jpg" alt="Strawberry Dirty Ice Cream" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <div className="bg-white bg-opacity-90 rounded-lg p-3">
                                    <p className="text-amber-700 font-bold text-lg">Chocolate </p>
                                    <p className="text-amber-600 text-sm">Dirty Ice Cream</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            <h3 className="font-bold text-lg sm:text-xl mb-2">Chocolate Marshmallow</h3>
                            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">Fresh Chocolate dirty ice cream in traditional drum</p>
                        </div>
                    </div>

                    {/* Chocolate Drum */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="h-48 sm:h-56 md:h-64 lg:h-72 flex items-center justify-center relative overflow-hidden">
                            <img src="/flavors/514314954_10095860500491750_2537050991332434972_n.jpg" alt="Chocolate Dirty Ice Cream" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <div className="bg-white bg-opacity-90 rounded-lg p-3">
                                    <p className="text-orange-600 font-bold text-lg">Mango</p>
                                    <p className="text-orange-500 text-sm">Dirty Ice Cream</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            <h3 className="font-bold text-lg sm:text-xl mb-2">Mango Cheese</h3>
                            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">Fresh mango dirty ice cream in traditional drum</p>
                        </div>
                    </div>

                    {/* Ube Drum */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="h-48 sm:h-56 md:h-64 lg:h-72 flex items-center justify-center relative overflow-hidden">
                            <img src="/flavors/514419988_10095860493825084_2519952657309478003_n.jpg" alt="Ube Dirty Ice Cream" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <div className="bg-white bg-opacity-90 rounded-lg p-3">
                                    <p className="text-purple-600 font-bold text-lg">Ube</p>
                                    <p className="text-purple-500 text-sm">Dirty Ice Cream</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            <h3 className="font-bold text-lg sm:text-xl mb-2">Ube Special</h3>
                            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">Traditional Filipino ube dirty ice cream</p>
                        </div>
                    </div>

                    {/* Coconut Drum */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="h-48 sm:h-56 md:h-64 lg:h-72 flex items-center justify-center relative overflow-hidden">
                            <img src="/flavors/514670269_10095860520491748_35662804257997418_n.jpg" alt="Coconut Dirty Ice Cream" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <div className="bg-white bg-opacity-90 rounded-lg p-3">
                                    <p className="text-orange-600 font-bold text-lg">Mango</p>
                                    <p className="text-orange-500 text-sm">Dirty Ice Cream</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6">
                            <h3 className="font-bold text-lg sm:text-xl mb-2">Mango Cookies</h3>
                            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">Tropical mango dirty ice cream</p>
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
        <section className="relative mt-24 mb-24 px-6 min-h-[600px] flex flex-col items-center justify-center" id="aboutUs">
        <h3 className="text-3xl md:text-5xl font-extrabold text-center mb-12 z-10">About ChillNet</h3>
            <div className="relative flex flex-col lg:flex-row gap-8 lg:gap-12 w-full max-w-7xl mx-auto">
            {/* <!-- Text Content --> */}
            <div className="flex flex-col gap-6 z-10 w-full lg:w-1/2">
                <div className="bg-white bg-opacity-90 rounded-2xl p-6 lg:p-8 text-gray-800 shadow-lg">
                    <h4 className="text-xl font-bold mb-4 text-amber-700">Our Mission</h4>
                    <p className="text-base leading-relaxed">ChillNet connects authentic Filipino dirty ice cream vendors with customers who crave the traditional taste of sorbetes. We're preserving this beloved street food culture while making it accessible to everyone through modern technology.</p>
                </div>
                <div className="bg-white bg-opacity-90 rounded-2xl p-6 lg:p-8 text-gray-800 shadow-lg">
                    <h4 className="text-xl font-bold mb-4 text-amber-700">How It Works</h4>
                    <p className="text-base leading-relaxed">Our platform brings together local vendors and ice cream lovers. Customers can discover nearby vendors, browse authentic flavors, and place orders for traditional drum-sized servings. Vendors get a digital presence while maintaining their authentic street food charm.</p>
                </div>
                <div className="bg-white bg-opacity-90 rounded-2xl p-6 lg:p-8 text-gray-800 shadow-lg">
                    <h4 className="text-xl font-bold mb-4 text-amber-700">Community First</h4>
                    <p className="text-base leading-relaxed">We believe in supporting local vendors and preserving Filipino food traditions. Every order helps sustain authentic sorbetes makers and keeps this delicious cultural heritage alive for future generations.</p>
                </div>
            </div>

            {/* <!-- Ice Cream Images --> */}
            <div className="relative flex-1 lg:min-h-[500px] grid grid-cols-2 gap-4">
                <div className="space-y-4">
                    <img src="/flavors/f1.jpg" alt="Traditional Dirty Ice Cream" className="w-full h-32 lg:h-40 object-cover rounded-xl shadow-lg" />
                    <img src="/flavors/514314954_10095860500491750_2537050991332434972_n.jpg" alt="Chocolate Flavor" className="w-full h-32 lg:h-40 object-cover rounded-xl shadow-lg" />
                </div>
                <div className="space-y-4 mt-8">
                    <img src="/flavors/514419988_10095860493825084_2519952657309478003_n.jpg" alt="Ube Flavor" className="w-full h-32 lg:h-40 object-cover rounded-xl shadow-lg" />
                    <img src="/flavors/514670269_10095860520491748_35662804257997418_n.jpg" alt="Coconut Flavor" className="w-full h-32 lg:h-40 object-cover rounded-xl shadow-lg" />
                </div>
            </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-200 opacity-60 -z-10 rounded-2xl"></div>
         </section>

         {/* <!-- Basic Features Section --> */}
         <section id="features" className="py-16 px-6">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-4 text-gray-800">Key Features</h2>
                <p className="text-center text-lg text-gray-600 mb-12 max-w-3xl mx-auto">Simple and powerful features that make ordering ice cream easy</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {/* Feature 1 */}
                    <div className="text-center px-4 py-6">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-3 text-gray-800">Find Nearby Vendors</h3>
                        <p className="text-sm sm:text-base text-gray-600">Discover ice cream vendors in your area using GPS location</p>
                    </div>

                    {/* Feature 2 */}
                    <div className="text-center px-4 py-6">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-3 text-gray-800">Order Tracking</h3>
                        <p className="text-sm sm:text-base text-gray-600">Track your order from preparation to delivery</p>
                    </div>

                    {/* Feature 3 */}
                    <div className="text-center px-4 py-6">
                        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-3 text-gray-800">GCash Payment</h3>
                        <p className="text-sm sm:text-base text-gray-600">Secure and convenient GCash payment integration</p>
                    </div>

                    {/* Feature 4 */}
                    <div className="text-center px-4 py-6">
                        <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold mb-3 text-gray-800">Customer Reviews</h3>
                        <p className="text-sm sm:text-base text-gray-600">Read reviews and ratings from other customers</p>
                    </div>
                </div>
            </div>
         </section>

         {/* <!-- Footer --> */}
         <footer className="bg-gray-800 text-white py-8 sm:py-12 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Company Info */}
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-amber-400">ChillNet</h3>
                        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                            Connecting authentic Filipino dirty ice cream vendors with customers who love traditional sorbetes.
                        </p>
                        <div className="flex space-x-3 sm:space-x-4">
                            <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-amber-400 transition-colors">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 sm:space-y-4">
                        <h4 className="text-base sm:text-lg font-semibold text-amber-400">Contact Us</h4>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-gray-300 text-sm sm:text-base">+63 905 799 8268</span>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-300 text-sm sm:text-base">chilln@gmail.com</span>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-gray-300 text-sm sm:text-base">Cebu, Philippines</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                        <h4 className="text-base sm:text-lg font-semibold text-amber-400">Quick Links</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-2">
                            <Link to="/login" className="block text-gray-300 hover:text-amber-400 transition-colors text-sm sm:text-base">Login</Link>
                            <Link to="/vendor-register" className="block text-gray-300 hover:text-amber-400 transition-colors text-sm sm:text-base">Become a Vendor</Link>
                            <Link to="/customer" className="block text-gray-300 hover:text-amber-400 transition-colors text-sm sm:text-base">Browse Flavors</Link>
                            <a href="#aboutUs" className="block text-gray-300 hover:text-amber-400 transition-colors text-sm sm:text-base">About Us</a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center col-span-1 sm:col-span-2 lg:col-span-3">
                    <p className="text-gray-400 text-xs sm:text-sm">
                        © {new Date().getFullYear()} ChillNet. All rights reserved. | Preserving Filipino Ice Cream Culture
                    </p>
                </div>
            </div>  
         </footer>
        </div>
       </>
       
       
    )
}

export default LandingPage;