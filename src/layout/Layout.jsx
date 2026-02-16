import { useState } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-black">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-white shadow px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="text-orange-500 font-semibold"
          >
            ☰
          </button>
          <span className="font-semibold text-black">
            Savannah
          </span>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          {children}
        </main>

      </div>
    </div>
  );
}
