import { NavWithLogo } from "../../components/shared/nav";

export const Home = () => {
  const userRaw = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
  const user = userRaw ? JSON.parse(userRaw) : null;

  return (
    <>
      <NavWithLogo />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-4">Welcome{user?.firstName ? `, ${user.firstName}` : ''}!</h1>
        <p className="text-gray-700">You are now logged in.</p>

      </main>
    </>
  );
};

export default Home;


