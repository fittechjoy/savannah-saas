import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";


export default function Sidebar() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const baseStyle =
    "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200";

  const activeStyle =
    "bg-orange-500 text-white shadow-lg";

  const inactiveStyle =
    "text-gray-300 hover:bg-gray-800 hover:text-white";

  return (
    <div className="w-64 bg-black text-white flex flex-col justify-between p-6 shadow-2xl">

      {/* Logo Section */}
      <div>
        <div className="mb-12">
          <div className="mb-10 flex justify-center">
  <img
    src={logo}
    alt="Savannah Fitness Exchange"
    className="w-44 brightness-110"
  />
</div>

          
        </div>

        {/* Navigation */}
        <nav className="space-y-3">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/members"
            className={({ isActive }) =>
              `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
            }
          >
            Members
          </NavLink>

          <NavLink
            to="/add-member"
            className={({ isActive }) =>
              `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
            }
          >
            Add Member
          </NavLink>

          <NavLink
            to="/membership-plans"
            className={({ isActive }) =>
              `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
            }
          >
            Membership Plans
          </NavLink>

          <NavLink
            to="/payments"
            className={({ isActive }) =>
              `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
            }
          >
            Payments
          </NavLink>

          <NavLink
            to="/attendance"
            className={({ isActive }) =>
              `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
            }
          >
            Attendance
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
            }
          >
            Reports
          </NavLink>

        </nav>
      </div>

     {/* Footer */}
<div className="mt-10 pt-6 border-t border-gray-800">

  <button
    onClick={handleLogout}
    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition"
  >
    Logout
  </button>

  <div className="mt-4 text-xs text-gray-500">
    © {new Date().getFullYear()} Savannah SaaS
  </div>

</div>


    </div>
  );
}
