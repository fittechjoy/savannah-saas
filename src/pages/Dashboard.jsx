import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [expiredMembers, setExpiredMembers] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [expiringList, setExpiringList] = useState([]);
  const [showExpiring, setShowExpiring] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // TOTAL MEMBERS
    const { data: members } = await supabase
      .from("profiles")
      .select("*");

    setTotalMembers(members?.length || 0);

    // ACTIVE MEMBERSHIPS
    const { data: active } = await supabase
      .from("memberships")
      .select("*")
      .eq("status", "active");

    setActiveMembers(active?.length || 0);

    // EXPIRED MEMBERSHIPS
    const { data: expired } = await supabase
      .from("memberships")
      .select("*")
      .eq("status", "expired");

    setExpiredMembers(expired?.length || 0);

    // EXPIRING WITHIN 7 DAYS
    const today = new Date();
    const sevenDays = new Date();
    sevenDays.setDate(today.getDate() + 7);

    const { data: expiring } = await supabase
      .from("memberships")
      .select(`
        *,
        profiles ( full_name, phone )
      `)
      .eq("status", "active")
      .lte("expiry_date", sevenDays.toISOString());

    setExpiringSoonCount(expiring?.length || 0);
    setExpiringList(expiring || []);
  };

  // SIMULATED SMS REMINDER (safe for now)
  const sendReminder = (member) => {
    alert(
      `Renewal reminder sent to ${member.profiles?.full_name} (${member.profiles?.phone})`
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 text-slate-800">
        Dashboard Overview
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-slate-500">Total Members</h3>
          <p className="text-2xl font-bold text-orange-500">
            {totalMembers}
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-slate-500">Active Members</h3>
          <p className="text-2xl font-bold text-green-600">
            {activeMembers}
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="text-slate-500">Expired Members</h3>
          <p className="text-2xl font-bold text-red-500">
            {expiredMembers}
          </p>
        </div>

        <div
          onClick={() => setShowExpiring(true)}
          className="bg-white shadow rounded-xl p-6 cursor-pointer hover:shadow-lg transition"
        >
          <h3 className="text-slate-500">Expiring Soon (7 days)</h3>
          <p className="text-2xl font-bold text-yellow-500">
            {expiringSoonCount}
          </p>
        </div>
      </div>

      {/* Expiring Soon Modal */}
      {showExpiring && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-2/3 p-6 rounded-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                Members Expiring Soon
              </h2>
              <button
                onClick={() => setShowExpiring(false)}
                className="text-red-500 font-semibold"
              >
                Close
              </button>
            </div>

            {expiringList.length === 0 && (
              <p>No members expiring soon.</p>
            )}

            {expiringList.map((member) => (
              <div
                key={member.id}
                className="flex justify-between items-center border-b py-4"
              >
                <div>
                  <p className="font-semibold">
                    {member.profiles?.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Phone: {member.profiles?.phone}
                  </p>
                  <p className="text-sm text-gray-500">
                    Expiry:{" "}
                    {new Date(member.expiry_date).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => sendReminder(member)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                >
                  Send Reminder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
