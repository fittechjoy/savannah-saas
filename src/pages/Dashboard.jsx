import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [totalMembers, setTotalMembers] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [expiredMembers, setExpiredMembers] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*");

    setTotalMembers(profiles?.length || 0);

    const { data: active } = await supabase
      .from("memberships")
      .select("*")
      .eq("status", "active");

    setActiveMembers(active?.length || 0);

    const { data: expired } = await supabase
      .from("memberships")
      .select("*")
      .eq("status", "expired");

    setExpiredMembers(expired?.length || 0);

    const today = new Date();
    const sevenDays = new Date();
    sevenDays.setDate(today.getDate() + 7);

    const { data: expiring } = await supabase
      .from("memberships")
      .select(`
        *,
        profiles ( full_name )
      `)
      .eq("status", "active")
      .lte("expiry_date", sevenDays.toISOString())
      .order("expiry_date", { ascending: true });

    setExpiringSoon(expiring || []);
  };

  return (
    <div className="space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-800">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 mt-2">
          Monitor membership activity and renewal priorities at a glance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <p className="text-sm text-slate-500">
            Total Members
          </p>
          <p className="text-3xl font-semibold mt-2 text-slate-800">
            {totalMembers}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <p className="text-sm text-slate-500">
            Active Members
          </p>
          <p className="text-3xl font-semibold mt-2 text-green-600">
            {activeMembers}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <p className="text-sm text-slate-500">
            Expired Members
          </p>
          <p className="text-3xl font-semibold mt-2 text-red-500">
            {expiredMembers}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <p className="text-sm text-slate-500">
            Expiring Soon
          </p>
          <p className="text-3xl font-semibold mt-2 text-yellow-500">
            {expiringSoon.length}
          </p>
        </div>

      </div>

      {/* Renewal Priorities */}
      <div className="bg-white rounded-xl shadow-sm p-8 border">

        <h2 className="text-lg font-semibold mb-6 text-slate-800">
          Renewal Priorities
        </h2>

        {expiringSoon.length === 0 ? (
          <p className="text-slate-500">
            No members require urgent renewal.
          </p>
        ) : (
          <div className="space-y-4">

            {expiringSoon.map((member) => (
              <div
                key={member.id}
                className="flex justify-between items-center border rounded-lg px-6 py-4 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium text-slate-700">
                    {member.profiles?.full_name}
                  </p>
                  <p className="text-sm text-slate-500">
                    Expires on{" "}
                    {new Date(member.expiry_date).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() =>
                    navigate(`/payments?member=${member.user_id}`)
                  }
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                >
                  Renew
                </button>
              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}
