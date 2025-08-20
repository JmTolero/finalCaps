import { useState } from "react";
import { NavWithLogo } from "../../components/nav";

export const AdminDashboard = () => {

  const [count, setCount] = useState(0);
  return (
    <>
      <main className="max-w-4xl py-10 h-screen">
        <div className="grid grid-cols-3 gap-10">
          <div className="bg-sky-700"><h3>Total Users</h3></div>
          <div className="bg-sky-700"><h3>Total Vendors</h3></div>
          <div className="bg-sky-700"><h3>Total Orders</h3></div>
        </div>
      </main>
    </>
  );

};

export default AdminDashboard;


