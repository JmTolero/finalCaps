import { NavWithLogo } from "../components/nav";

export const Vendor = () => {
  return (
    <>
      <NavWithLogo />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
        <p className="text-gray-700">Welcome to your vendor dashboard. Manage your ice cream business here.</p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Orders</h3>
            <p className="text-gray-600">View and manage incoming orders</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Products</h3>
            <p className="text-gray-600">Manage your ice cream products and flavors</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Analytics</h3>
            <p className="text-gray-600">View sales and performance metrics</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Profile</h3>
            <p className="text-gray-600">Manage your vendor account settings</p>
          </div>
        </div>
      </main>
    </>
  );
};

export default Vendor;


