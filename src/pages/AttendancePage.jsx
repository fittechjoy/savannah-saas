import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AttendancePage() {
  const [members, setMembers] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchMembers();
    fetchTodayAttendance();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name");

    if (error) console.error(error);
    setMembers(data || []);
  };

  const fetchTodayAttendance = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("attendance")
      .select("*, profiles(full_name)")
      .gte("checkin_time", todayStart.toISOString())
      .lte("checkin_time", todayEnd.toISOString());

    if (error) console.error(error);
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

    const { error } = await supabase.from("attendance").insert([
      {
        user_id: memberId,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error checking in");
      return;
    }

    fetchTodayAttendance();
  };

  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
  <div className="px-4 sm:px-6 lg:px-0 max-w-6xl mx-auto space-y-8">

    {/* Header */}
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
        Attendance
      </h1>
      <p className="text-slate-500 text-sm mt-1">
        Track daily member check-ins
      </p>
    </div>

    {/* Summary Card */}
    <div className="bg-white rounded-2xl shadow-sm border-l-4 border-orange-500 p-5 sm:p-6">
      <p className="text-sm text-slate-500">Today's Attendance</p>
      <p className="text-3xl sm:text-4xl font-bold text-orange-500 mt-2">
        {todayAttendance.length}
      </p>
    </div>

    {/* Search */}
    <input
      type="text"
      placeholder="Search member..."
      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-orange-500 outline-none"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

    {/* Members List */}
    <div className="bg-white rounded-2xl shadow-sm divide-y">

      {filteredMembers.map((member) => {
        const checkedIn = todayAttendance.find(
          (a) => a.user_id === member.id
        );

        return (
          <div
            key={member.id}
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 sm:p-5 hover:bg-slate-50 transition"
          >
            <p className="font-medium text-slate-800 text-sm sm:text-base">
              {member.full_name}
            </p>

            <button
              onClick={() => handleCheckIn(member.id)}
              disabled={checkedIn}
              className={`w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-medium transition ${
                checkedIn
                  ? "bg-slate-300 text-white cursor-not-allowed"
                  : "bg-orange-500 text-white hover:bg-orange-600 shadow"
              }`}
            >
              {checkedIn ? "Checked In" : "Check In"}
            </button>
          </div>
        );
      })}

      {filteredMembers.length === 0 && (
        <div className="p-6 text-center text-slate-400 text-sm">
          No members found.
        </div>
      )}
    </div>

    {/* Today's Log */}
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">
        Today's Check-ins
      </h2>

      {todayAttendance.length === 0 && (
        <p className="text-slate-400 text-sm">
          No check-ins yet today.
        </p>
      )}

      <ul className="space-y-2">
        {todayAttendance.map((a) => (
          <li
            key={a.id}
            className="text-sm sm:text-base text-slate-700"
          >
            {a.profiles?.full_name}
          </li>
        ))}
      </ul>
    </div>

  </div>
);

}
