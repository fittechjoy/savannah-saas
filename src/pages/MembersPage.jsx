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
      const sevenDays = new Date();
      sevenDays.setDate(sevenDays.getDate() + 7);
      return (
        m.status === "active" &&
        new Date(m.expiry_date) <= sevenDays
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-black">
          Members
        </h1>

        <button
          onClick={() => navigate("/add-member")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl shadow-sm transition"
        >
          + Add Member
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3">
        {["all", "active", "expiring", "expired"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === type
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Name</th>
              <th className="px-6 py-4 text-left">Phone</th>
              <th className="px-6 py-4 text-left">Plan</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Expiry</th>
              <th className="px-6 py-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="border-t hover:bg-orange-50 transition">
                <td className="px-6 py-4 font-medium text-black">
                  {member.profiles?.full_name}
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {member.profiles?.phone}
                </td>

                <td className="px-6 py-4 text-gray-600 capitalize">
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
                  {new Date(member.expiry_date).toLocaleDateString("en-KE")}
                </td>

                <td className="px-6 py-4">
                  <button
                    onClick={() => navigate(`/payments?member=${member.user_id}`)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded-lg text-sm transition"
                  >
                    Renew
                  </button>
                </td>
              </tr>
            ))}

            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
