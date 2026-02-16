import { NavLink } from "react-router-dom";

export default function Sidebar() {

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
          <h1 className="text-2xl font-bold tracking-wide text-orange-500">
            Savannah
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Fitness Exchange
          </p>
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
      <div className="text-xs text-gray-500 border-t border-gray-800 pt-4">
        © {new Date().getFullYear()} Savannah SaaS
      </div>

    </div>
  );
}
