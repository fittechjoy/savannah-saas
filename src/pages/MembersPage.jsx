import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";




export default function MembersPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("memberships")
      .select(`
        *,
        profiles ( full_name, phone ),
        membership_plans ( duration )
      `)
      .order("created_at", { ascending: false });

    setMembers(data || []);
  };

  const filteredMembers = members.filter((m) => {
    if (filter === "active") return m.status === "active";
    if (filter === "expired") return m.status === "expired";
    if (filter === "expiring") {
      const today = new Date();
      const sevenDays = new Date();
      sevenDays.setDate(today.getDate() + 7);
      return (
        m.status === "active" &&
        new Date(m.expiry_date) <= sevenDays
      );
    }
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-800">
        Savannah Fitness Exchange – Members
      </h1>

      {/* Card Container */}
      <div className="bg-white shadow rounded-xl p-6">

        {/* Filter + Export */}
        <div className="flex justify-between items-center mb-6">
          <div className="space-x-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg ${
                filter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-gray-200"
              }`}
            >
              All
            </button>

            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-lg ${
                filter === "active"
                  ? "bg-slate-900 text-white"
                  : "bg-gray-200"
              }`}
            >
              Active
            </button>

            <button
              onClick={() => setFilter("expiring")}
              className={`px-4 py-2 rounded-lg ${
                filter === "expiring"
                  ? "bg-slate-900 text-white"
                  : "bg-gray-200"
              }`}
            >
              Expiring Soon
            </button>

            <button
              onClick={() => setFilter("expired")}
              className={`px-4 py-2 rounded-lg ${
                filter === "expired"
                  ? "bg-slate-900 text-white"
                  : "bg-gray-200"
              }`}
            >
              Expired
            </button>
          </div>

          <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                  Name
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                  Phone
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                  Plan
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                  Expiry
                </th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {member.profiles?.full_name}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {member.profiles?.phone}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {member.membership_plans?.duration}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        member.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {new Date(
                      member.expiry_date
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    <button
  onClick={() => navigate(`/payments?member=${member.id}`)}
  className="bg-orange-500 text-white px-3 py-1 rounded-lg"
>
  Renew
</button>

                  </td>
                </tr>
              ))}

              {filteredMembers.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-6 text-gray-500"
                  >
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
