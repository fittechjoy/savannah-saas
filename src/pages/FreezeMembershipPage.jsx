import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function FreezeMembershipPage() {
  const [memberships, setMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveMemberships();
  }, []);

  const fetchActiveMemberships = async () => {
    const { data, error } = await supabase
      .from("memberships")
      .select(`
        *,
        profiles(full_name),
        membership_plans(category, duration),
        membership_freezes(*)
      `)
      .eq("status", "active");

    if (error) {
      console.error(error);
      return;
    }

    setMemberships(data || []);
  };

  const handleFreeze = async () => {
    if (!selectedMembership || !startDate || !endDate) {
      alert("All fields required.");
      return;
    }

    const membership = memberships.find(
      (m) => m.id === selectedMembership
    );

    if (!membership) return;

    // 🚫 Corporate restriction
    if (membership.membership_plans?.category === "corporate") {
      alert("Corporate members cannot freeze.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      alert("End date cannot be before start date.");
      return;
    }

    const freezeDays =
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (freezeDays < 7 || freezeDays > 21) {
      alert("Freeze must be between 7 and 21 consecutive days.");
      return;
    }

    const currentYear = new Date().getFullYear();

    const yearlyFreezes =
      membership.membership_freezes?.filter(
        (f) =>
          new Date(f.start_date).getFullYear() === currentYear
      ) || [];

    if (yearlyFreezes.length >= 5) {
      alert("Maximum 5 freezes per year reached.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("membership_freezes")
      .insert([
        {
          membership_id: membership.id,
          start_date: startDate,
          end_date: endDate,
          freeze_days: freezeDays,
          is_applied: false,
        },
      ]);

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Error saving freeze.");
      return;
    }

    alert(`Freeze recorded for ${freezeDays} days.`);

    setStartDate("");
    setEndDate("");
    fetchActiveMemberships();
  };

  const selectedData = memberships.find(
    (m) => m.id === selectedMembership
  );

  const currentYear = new Date().getFullYear();

  const yearlyFreezes =
    selectedData?.membership_freezes?.filter(
      (f) =>
        new Date(f.start_date).getFullYear() === currentYear
    ) || [];

  const usedFreezes = yearlyFreezes.length;
  const remainingFreezes = 5 - usedFreezes;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0 space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-black">
          Freeze Membership
        </h1>
        <p className="text-slate-500 mt-2">
          Apply temporary freeze to active members.
        </p>
      </div>

      {/* Freeze Form */}
      <div className="bg-white rounded-2xl shadow-sm border-l-4 border-orange-500 p-6 space-y-6">

        <select
          value={selectedMembership}
          onChange={(e) => setSelectedMembership(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
        >
          <option value="">Select Active Member</option>
          {memberships.map((m) => (
            <option key={m.id} value={m.id}>
              {m.profiles?.full_name} ({m.membership_plans?.duration})
            </option>
          ))}
        </select>

        {selectedData && (
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              Used: {usedFreezes}
            </span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
              Remaining: {remainingFreezes}
            </span>
          </div>
        )}

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
        />

        <button
          onClick={handleFreeze}
          disabled={loading}
          className="w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition font-medium"
        >
          {loading ? "Processing..." : "Apply Freeze"}
        </button>
      </div>

      {/* Freeze History */}
      {selectedData && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-black">
            Freeze History
          </h2>

          {selectedData.membership_freezes.length === 0 && (
            <p className="text-slate-400 text-sm">
              No freezes recorded.
            </p>
          )}

          {selectedData.membership_freezes.map((f) => (
            <div
              key={f.id}
              className="border rounded-xl p-4 text-sm flex justify-between items-center"
            >
              <div>
                {f.start_date} → {f.end_date}
                <span className="text-slate-500 ml-2">
                  ({f.freeze_days} days)
                </span>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs ${
                  f.is_applied
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {f.is_applied ? "Applied" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}