import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AttendancePage() {
  const [members, setMembers] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [search, setSearch] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchMembers();
    fetchTodayAttendance();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name");

    setMembers(data || []);
  };

  const fetchTodayAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select("*, profiles(full_name)")
      .eq("date", today);

    setTodayAttendance(data || []);
  };

  const handleCheckIn = async (memberId) => {
    const alreadyChecked = todayAttendance.find(
      (a) => a.user_id === memberId
    );

    if (alreadyChecked) {
      alert("Already checked in today");
      return;
    }

    await supabase.from("attendance").insert([
      {
        user_id: memberId,
        date: today,
      },
    ]);

    fetchTodayAttendance();
  };

  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Attendance
        </h1>
        <p className="text-sm text-slate-500">
          Track daily member check-ins
        </p>
      </div>

      {/* SUMMARY CARD */}
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-sm text-slate-500">Today's Attendance</p>
        <p className="text-3xl font-bold text-orange-500">
          {todayAttendance.length}
        </p>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search member..."
        className="w-full border rounded-lg px-4 py-2"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* MEMBER LIST */}
      <div className="bg-white rounded-xl shadow divide-y">
        {filteredMembers.map((member) => {
          const checkedIn = todayAttendance.find(
            (a) => a.user_id === member.id
          );

          return (
            <div
              key={member.id}
              className="flex justify-between items-center p-4"
            >
              <p className="text-slate-700">
                {member.full_name}
              </p>

              <button
                onClick={() => handleCheckIn(member.id)}
                disabled={checkedIn}
                className={`px-4 py-2 rounded-lg text-white text-sm ${
                  checkedIn
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {checkedIn ? "Checked In" : "Check In"}
              </button>
            </div>
          );
        })}
      </div>

      {/* TODAY LOG */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-sm font-semibold text-slate-600 mb-4">
          Today's Check-ins
        </h2>

        {todayAttendance.length === 0 && (
          <p className="text-sm text-slate-400">
            No check-ins yet today.
          </p>
        )}

        <ul className="space-y-2">
          {todayAttendance.map((a) => (
            <li
              key={a.id}
              className="text-sm text-slate-700"
            >
              {a.profiles?.full_name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
