import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function ReportsPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [expiredMembers, setExpiredMembers] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);

  // Monthly Revenue
  const fetchMonthlyRevenue = async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("payments")
      .select("amount")
      .gte("payment_date", startOfMonth.toISOString());

    const total = data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    setTotalRevenue(total);
  };

  // Membership Stats
  const fetchMembershipStats = async () => {
    const { data: active } = await supabase
      .from("memberships")
      .select("*")
      .eq("status", "active");

    const { data: expired } = await supabase
      .from("memberships")
      .select("*")
      .eq("status", "expired");

    setActiveMembers(active?.length || 0);
    setExpiredMembers(expired?.length || 0);
  };

  // Today's Attendance
  const fetchTodayAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .gte("checkin_time", `${today}T00:00:00`)
      .lte("checkin_time", `${today}T23:59:59`);

    setTodayAttendance(data?.length || 0);
  };

  useEffect(() => {
    fetchMonthlyRevenue();
    fetchMembershipStats();
    fetchTodayAttendance();
  }, []);

  return (
    <div style={{ color: "white" }}>
      <h1 style={{ color: "orange" }}>Reports Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "30px" }}>
        
        <div style={{ background: "#1a1a1a", padding: "20px", borderRadius: "8px" }}>
          <h3>Monthly Revenue</h3>
          <h2 style={{ color: "orange" }}>KES {totalRevenue}</h2>
        </div>

        <div style={{ background: "#1a1a1a", padding: "20px", borderRadius: "8px" }}>
          <h3>Active Memberships</h3>
          <h2 style={{ color: "orange" }}>{activeMembers}</h2>
        </div>

        <div style={{ background: "#1a1a1a", padding: "20px", borderRadius: "8px" }}>
          <h3>Expired Memberships</h3>
          <h2 style={{ color: "orange" }}>{expiredMembers}</h2>
        </div>

        <div style={{ background: "#1a1a1a", padding: "20px", borderRadius: "8px" }}>
          <h3>Today's Attendance</h3>
          <h2 style={{ color: "orange" }}>{todayAttendance}</h2>
        </div>

      </div>
    </div>
  );
}

export default ReportsPage;
