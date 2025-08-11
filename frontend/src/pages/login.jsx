import {NavWithLogo} from '../components/nav.jsx';


export const Login = () => {
    return (
      <>
      <NavWithLogo />
        <main class="flex items-center justify-center min-h-[80vh] px-4">
          <div class="rounded-xl shadow-lg px-6 py-6 w-full max-w-md text-black" style={{backgroundColor: "#D4F6FF"}}>
            <h2 class="text-4xl font-bold text-center mb-8">Welcome</h2>

            {/* <!-- Username --> */}
            <label class="block text-xl font-semibold mb-2 mt-4" for="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              class="w-full mb-4 px-4 py-2 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
            />

            {/* <!-- Password --> */}
            <label class="block text-xl font-semibold mb-2 mt-2" for="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              class="w-full mb-6 px-4 py-2 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 text-lg text-black"
            />

            {/* <!-- Login Button --> */}
            <a
              href=""
              class="block text-center w-1/2 mx-auto bg-[#33D0D8] hover:bg-[#2bbac1] text-white font-bold py-2 rounded shadow-md text-base transition"
            >
              LOGIN
            </a>

            {/* <!-- Google Sign-In Button --> */}
            <div class="text-center mt-4">
              <button
                class="flex items-center justify-center gap-2 bg-white border border-gray-400 rounded shadow-md px-4 py-2 text-sm hover:bg-gray-100 transition mx-auto"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="h-5 w-5" />
                <span>Sign in with Google</span>
              </button>
            </div>

            {/* <!-- Registration Link --> */}
            <div class="text-center mt-6">
              <a href="customer-registration.html" class="text-indigo-800 font-bold hover:underline transition">No Account? Register</a>
            </div>
          </div>
        </main>
        
      </>
    );
}

export default Login;