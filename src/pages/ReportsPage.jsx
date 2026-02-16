import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ReportsPage() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [expiredMembers, setExpiredMembers] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const today = new Date();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    try {
      // 🔹 Monthly Revenue
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("amount, payment_date")
        .gte("payment_date", monthStart.toISOString());

      if (paymentsError) {
        console.error("Payments error:", paymentsError);
      }

      const revenue =
        payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // 🔹 Membership Status Counts
      const { data: memberships, error: membershipError } = await supabase
        .from("memberships")
        .select("status");

      if (membershipError) {
        console.error("Membership error:", membershipError);
      }

      const active =
        memberships?.filter((m) => m.status === "active").length || 0;

      const expired =
        memberships?.filter((m) => m.status === "expired").length || 0;

      // 🔹 Today's Attendance (FIXED)
      const { data: attendance, error: attendanceError } =
        await supabase
          .from("attendance")
          .select("*")
          .gte("checkin_time", startOfDay.toISOString())
          .lte("checkin_time", endOfDay.toISOString());

      if (attendanceError) {
        console.error("Attendance error:", attendanceError);
      }

      setMonthlyRevenue(revenue);
      setActiveMembers(active);
      setExpiredMembers(expired);
      setTodayAttendance(attendance?.length || 0);

    } catch (err) {
      console.error("Report fetch failed:", err);
    }
  };

  const Card = ({ title, value }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-orange-500 mt-2">
        {value}
      </p>
    </div>
  );

 return (
  <div className="max-w-6xl mx-auto space-y-10">

    {/* Header */}
    <div>
      <h1 className="text-3xl font-semibold text-black">
        Reports Dashboard
      </h1>
      <p className="text-gray-500 mt-2">
        Membership health and financial overview.
      </p>
    </div>

    {/* Cards */}
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

      {/* Monthly Revenue */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
        <div className="absolute left-0 top-0 h-full w-1 bg-orange-500 rounded-l-2xl"></div>
        <p className="text-sm text-gray-500">Monthly Revenue</p>
        <p className="text-2xl font-bold text-orange-500 mt-2">
          KES {monthlyRevenue.toLocaleString()}
        </p>
      </div>

      {/* Active */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
        <div className="absolute left-0 top-0 h-full w-1 bg-orange-400 rounded-l-2xl"></div>
        <p className="text-sm text-gray-500">Active Memberships</p>
        <p className="text-2xl font-bold text-black mt-2">
          {activeMembers}
        </p>
      </div>

      {/* Expired */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
        <div className="absolute left-0 top-0 h-full w-1 bg-orange-300 rounded-l-2xl"></div>
        <p className="text-sm text-gray-500">Expired Memberships</p>
        <p className="text-2xl font-bold text-black mt-2">
          {expiredMembers}
        </p>
      </div>

      {/* Attendance */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
        <div className="absolute left-0 top-0 h-full w-1 bg-orange-200 rounded-l-2xl"></div>
        <p className="text-sm text-gray-500">Today's Attendance</p>
        <p className="text-2xl font-bold text-black mt-2">
          {todayAttendance}
        </p>
      </div>

    </div>

  </div>
);


}
