import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">

      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-black to-black"></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black">
            <span className="text-orange-500">Savannah</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fitness Exchange
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="text-sm text-gray-600">
              Email
            </label>
            <input
              type="email"
              className="w-full mt-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Password
            </label>
            <input
              type="password"
              className="w-full mt-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition duration-200"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Savannah SaaS
        </div>

      </div>
    </div>
  );
}
