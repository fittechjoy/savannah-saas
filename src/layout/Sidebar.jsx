import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const baseStyle =
    "block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200";

  const activeStyle =
    "bg-slate-700 text-white shadow";

  const inactiveStyle =
    "text-slate-300 hover:bg-slate-800 hover:text-white";

  return (
    <div className="w-64 bg-slate-900 min-h-screen flex flex-col p-6">

      {/* Logo / Title */}
      <div className="mb-10">
        <h1 className="text-white text-xl font-bold leading-tight">
          Savannah Fitness
        </h1>
        <p className="text-slate-400 text-sm">
          Exchange
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">

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

      {/* Footer */}
      <div className="mt-10 text-xs text-slate-500">
        © {new Date().getFullYear()} Savannah SaaS
      </div>

    </div>
  );
}
