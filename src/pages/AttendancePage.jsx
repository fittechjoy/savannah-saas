import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function AttendancePage() {
  const [activeMembers, setActiveMembers] = useState([]);
  const [todayCount, setTodayCount] = useState(0);

  // Fetch active memberships with member info
  const fetchActiveMembers = async () => {
    const { data, error } = await supabase
      .from("memberships")
      .select(`
        id,
        user_id,
        profiles ( full_name )
      `)
      .eq("status", "active");

    if (!error) {
      setActiveMembers(data || []);
    }
  };

  // Fetch today's attendance count
  const fetchTodayAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .gte("checkin_time", `${today}T00:00:00`)
      .lte("checkin_time", `${today}T23:59:59`);

    if (!error) {
      setTodayCount(data.length);
    }
  };

  useEffect(() => {
    fetchActiveMembers();
    fetchTodayAttendance();
  }, []);

  // Record attendance
  const checkInMember = async (userId) => {
  const today = new Date().toISOString().split("T")[0];

  // 1️⃣ Check if already checked in today
  const { data: existing } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .gte("checkin_time", `${today}T00:00:00`)
    .lte("checkin_time", `${today}T23:59:59`);

  if (existing && existing.length > 0) {
    alert("Member already checked in today.");
    return;
  }

  // 2️⃣ Insert new check-in
  await supabase.from("attendance").insert([
    {
      user_id: userId
    }
  ]);

  alert("Check-in recorded!");
  fetchTodayAttendance();
};


  return (
    <div style={{ color: "white" }}>
      <h1 style={{ color: "orange" }}>Attendance</h1>

      <h3>Today's Check-ins: {todayCount}</h3>

      {activeMembers.length === 0 && (
        <p>No active members found.</p>
      )}

      {activeMembers.map((member) => (
        <div
          key={member.id}
          style={{
            padding: "15px",
            marginBottom: "15px",
            background: "#1a1a1a",
            borderRadius: "6px"
          }}
        >
          <strong>
            {member.profiles?.full_name || "Unknown Member"}
          </strong>

          <button
            onClick={() => checkInMember(member.user_id)}
            style={{
              marginLeft: "15px",
              padding: "6px 12px",
              background: "orange",
              border: "none",
              cursor: "pointer"
            }}
          >
            Check In
          </button>
        </div>
      ))}
    </div>
  );
}

export default AttendancePage;
