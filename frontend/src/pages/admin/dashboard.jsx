import { useState, useEffect } from "react";
import axios from "axios";
// import { NavWithLogo } from "../../components/nav";

//images import

import imgTotalUser from '../../assets/images/t-user.png';
import imgTotalVendor from '../../assets/images/t-vendor.png';
import imgTotalOrder from '../../assets/images/t-order.png';

export const AdminDashboard = () => {

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalVendors, setTotalVendor] = useState(0);

  useEffect(()=>{
    const fetchTotal = async () => {

      try{
        const res = await axios.get('http://localhost:3001/api/total');
        setTotalUsers(res.data.totalUsers);
        setTotalVendor(res.data.totalVendors);
      }catch(err){
        console.log(err);
      }
      
    }
    fetchTotal();
  },[])

  return (
    <>
      <main className="max-w-4xl py-10 h-screen">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          <div className="bg-[#D4F6FF] h-35 rounded-xl flex flex-col justify-center px-6">
            <h3 className="text-2xl font-semibold text-left">Total Users:</h3>
              <div className="flex justify-evenly items-center gap-4 mt-2">
                <img src={imgTotalUser} alt="Total Users" className="w-16" />
                <div className="text-2xl font-bold text-[#26A0FE]">{totalUsers}</div>
              </div>
          </div>


          <div className="bg-[#D4F6FF] h-35 rounded-xl flex flex-col justify-center px-6">
            <h3 className="text-2xl font-semibold text-left">Total Vendors:</h3>
              <div className="flex justify-evenly items-center gap-4 mt-2">
                <img src={imgTotalVendor} alt="Total Vendors" className="w-16" />
                <div className="text-2xl font-bold text-[#26A0FE]">{totalVendors}</div>
              </div>
          </div>

          <div className="bg-[#D4F6FF] h-35 rounded-xl flex flex-col justify-center px-6">
            <h3 className="text-2xl font-semibold text-left">Total Orders :</h3>
              <div className="flex justify-evenly items-center gap-4 mt-2">
                <img src={imgTotalOrder} alt="Total Users" className="w-16" />
                <div className="text-2xl font-bold text-[#26A0FE]">12312</div>
              </div>
          </div>

        </div>

        {/* table */}
        <div className="bg-[#D4F6FF] p-6 rounded-xl shadow-md mt-20">
          <h2 className="text-2xl font-bold mb-4">Bookings</h2>
          <table className="table-auto w-full border-collapse overflow-hidden">
            <thead className="bg-blue-200">
              <tr>
                <th className="px-4 py-2 text-left">Order ID</th>
                <th className="px-4 py-2 text-left">Customer ID</th>
                <th className="px-4 py-2 text-left">Vendor ID</th>
                <th className="px-4 py-2 text-left">Drum Size</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Payment Status</th>
                <th className="px-4 py-2 text-left">Drum Status</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr className="hover:bg-blue-100">
                <td className="px-4 py-2 border">onn</td>
                <td className="px-4 py-2 border">onn</td>
                <td className="px-4 py-2 border">onn</td>
                <td className="px-4 py-2 border">onn</td>
                <td className="px-4 py-2 border">onn</td>
                <td className="px-4 py-2 border">onn</td>
                <td className="px-4 py-2 border">onn</td>
              </tr>
            </tbody>
          </table>
        </div>

        
      </main>
    </>
  );

};

export default AdminDashboard;


