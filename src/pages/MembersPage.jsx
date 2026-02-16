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
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black">
          Members
        </h1>

        <button
          onClick={() => navigate("/add-member")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl shadow-sm transition w-full sm:w-auto"
        >
          + Add Member
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {["all", "active", "expiring", "expired"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              filter === type
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
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
                <td className="px-6 py-4 capitalize">
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
                <td className="px-6 py-4">
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
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-black">
                {member.profiles?.full_name}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  member.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {member.status}
              </span>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Phone:</span> {member.profiles?.phone}</p>
              <p><span className="font-medium">Plan:</span> {member.membership_plans?.duration}</p>
              <p>
                <span className="font-medium">Expiry:</span>{" "}
                {new Date(member.expiry_date).toLocaleDateString("en-KE")}
              </p>
            </div>

            <button
              onClick={() => navigate(`/payments?member=${member.user_id}`)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl transition"
            >
              Renew Membership
            </button>
          </div>
        ))}

        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No members found.
          </div>
        )}
      </div>
    </div>
  );
}
