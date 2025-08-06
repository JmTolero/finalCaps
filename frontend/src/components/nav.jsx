import React from "react";

const nav = () => {
    return (
        <div>
            <nav class="w-full bg-sky-100 shadow flex items-center justify-center md:justify-end px-6 md:px-12 py-4">
                <ul class="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-12 text-lg font-semibold text-gray-700 text-center md:text-left">
                <li><a href="#" class="hover:text-blue-500 transition">Home</a></li>
                <li><a href="#" class="hover:text-blue-500 transition">About Us</a></li>
                <li><a href="#drums" class="hover:text-blue-500 transition">Features</a></li>
                <li><a href="#" class="hover:text-blue-500 transition">Contact Us</a></li>
                </ul>
            </nav>
        </div>
    );
}

export default nav; 