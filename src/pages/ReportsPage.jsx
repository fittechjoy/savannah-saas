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
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date();
    monthStart.setDate(1);

    const { data: payments } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .gte("payment_date", monthStart.toISOString());

    const revenue =
      payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const { data: memberships } = await supabase
      .from("memberships")
      .select("status");

    const active =
      memberships?.filter((m) => m.status === "active").length || 0;

    const expired =
      memberships?.filter((m) => m.status === "expired").length || 0;

    const { data: attendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("date", today);

    setMonthlyRevenue(revenue);
    setActiveMembers(active);
    setExpiredMembers(expired);
    setTodayAttendance(attendance?.length || 0);
  };

  const Card = ({ title, value }) => (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-orange-500 mt-2">
        {value}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Reports Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Membership health and financial overview
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="Monthly Revenue"
          value={`KES ${monthlyRevenue}`}
        />
        <Card
          title="Active Memberships"
          value={activeMembers}
        />
        <Card
          title="Expired Memberships"
          value={expiredMembers}
        />
        <Card
          title="Today's Attendance"
          value={todayAttendance}
        />
      </div>
    </div>
  );
}
