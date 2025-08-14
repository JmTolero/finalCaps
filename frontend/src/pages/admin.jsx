import { NavWithLogo } from "../components/nav";

export const Admin = () => {
  return (
    <>
      <NavWithLogo />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-700">Welcome, Admin. This is your page.</p>
      </main>
    </>
  );
};

export default Admin;


