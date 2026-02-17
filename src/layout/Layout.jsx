import { useState } from "react";
import Sidebar from "./Sidebar";
import logo from "../assets/logo.png";

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 w-64 bg-black text-white z-50 transform
          ${open ? "translate-x-0" : "-translate-x-full"}
          transition-transform duration-300
          md:translate-x-0 md:static md:flex
        `}
      >
        <Sidebar closeSidebar={() => setOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="text-orange-500 text-xl"
          >
            ☰
          </button>

          {/* Logo Instead of Text */}
          <img
            src={logo}
            alt="Savannah"
            className="h-8"
          />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
