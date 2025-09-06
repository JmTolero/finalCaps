import { NavWithLogo } from "../components/nav";

export const Customer = () => {
  return (
    <>
      <NavWithLogo />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Welcome Customer</h1>
        <p className="text-gray-700">Hello Customer. This is your dedicated page.</p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">My Orders</h3>
            <p className="text-gray-600">View and track your ice cream orders</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Favorites</h3>
            <p className="text-gray-600">Your favorite ice cream flavors</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Profile</h3>
            <p className="text-gray-600">Manage your account settings</p>
          </div>
        </div>
      </main>
    </>
  );
};

export default Customer;
