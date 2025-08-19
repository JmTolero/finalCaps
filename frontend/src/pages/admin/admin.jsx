import { NavWithLogo } from "../../components/nav";
import { Sidebar } from "../../components/admin/adminSidebar";


export const Admin = () => {
  return (
    <>
      <NavWithLogo />
      <div className="flex h-screen">
        <Sidebar className="w-64" />

        <main className="flex-1 max-w-4xl mx-10 py-10 h-screen">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-700">Welcome, Admin. This is your page.</p>
        </main>
      </div>
    </>
  );
};


export default Admin;


