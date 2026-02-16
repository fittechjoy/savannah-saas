import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    // Fetch role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile) {
      alert("Profile not found.");
      setLoading(false);
      return;
    }

    // Role-based routing
    if (profile.role === "admin") {
      navigate("/");
    } else {
      navigate("/attendance");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden px-4">

      {/* Animated Orange Glow */}
      <div className="absolute w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>

      {/* Login Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-10 space-y-8 animate-fadeIn">

        {/* Logo */}
        <div className="text-center space-y-4">
          <img
            src={logo}
            alt="Savannah Fitness Exchange"
            className="w-56 mx-auto drop-shadow-[0_0_25px_rgba(255,140,0,0.5)]"
          />
          <p className="text-gray-500 text-sm tracking-wide">
           Gym Management Platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="text-sm font-medium text-gray-600">
              Email
            </label>
            <input
              type="email"
              className="w-full mt-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              className="w-full mt-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="accent-orange-500"
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={() => supabase.auth.resetPasswordForEmail(email)}
              className="text-orange-500 hover:underline"
            >
              Forgot password?
            </button>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition shadow-lg hover:shadow-orange-500/40 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </form>

        <div className="text-xs text-gray-400 text-center pt-4">
          © {new Date().getFullYear()} Savannah Fitness Exchange
        </div>

      </div>
    </div>
  );
}
