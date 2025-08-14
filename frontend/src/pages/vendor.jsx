import { NavWithLogo } from "../components/nav";

export const Vendor = () => {
  return (
    <>
      <NavWithLogo />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Vendor Welcome</h1>
        <p className="text-gray-700">Hello Vendor. This is your dedicated page.</p>
      </main>
    </>
  );
};

export default Vendor;


