import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, RotateCcw, Power } from "lucide-react";

export default function MembersPage() {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 8;

  const [editingMember, setEditingMember] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  const [updatedPhone, setUpdatedPhone] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("memberships")
      .select(`
        *,
        profiles ( id, full_name, phone ),
        membership_plans ( duration, category )
      `)
      .order("created_at", { ascending: false });

    setMembers(data || []);
  };

  // 🔍 SEARCH FILTER
  const filtered = members.filter((m) =>
    m.profiles.full_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // 📄 PAGINATION
  const indexOfLast = currentPage * membersPerPage;
  const indexOfFirst = indexOfLast - membersPerPage;
  const currentMembers = filtered.slice(
    indexOfFirst,
    indexOfLast
  );

  const totalPages = Math.ceil(filtered.length / membersPerPage);

  // 🏢 GROUP BY CATEGORY
  const grouped = {
    tenant: [],
    non_tenant: [],
    corporate: [],
  };

  currentMembers.forEach((m) => {
    grouped[m.membership_plans.category]?.push(m);
  });

  // ✏ EDIT
  const openEdit = (member) => {
    setEditingMember(member);
    setUpdatedName(member.profiles.full_name);
    setUpdatedPhone(member.profiles.phone);
  };

  const saveEdit = async () => {
    await supabase
      .from("profiles")
      .update({
        full_name: updatedName,
        phone: updatedPhone,
      })
      .eq("id", editingMember.profiles.id);

    setEditingMember(null);
    fetchMembers();
  };

  // 🟠 DEACTIVATE
  const deactivateMember = async (member) => {
    await supabase
      .from("memberships")
      .update({ status: "expired" })
      .eq("id", member.id);

    fetchMembers();
  };

  // 🔴 HARD DELETE (if no payments)
  const deleteMember = async (member) => {
    const confirmDelete = window.confirm(
      "Permanently delete this member?"
    );
    if (!confirmDelete) return;

    const { data: payments } = await supabase
      .from("payments")
      .select("id")
      .eq("user_id", member.user_id);

    if (payments.length > 0) {
      alert("Cannot delete. Use deactivate instead.");
      return;
    }

    await supabase
      .from("attendance")
      .delete()
      .eq("user_id", member.user_id);

    await supabase
      .from("memberships")
      .delete()
      .eq("id", member.id);

    await supabase
      .from("profiles")
      .delete()
      .eq("id", member.user_id);

    fetchMembers();
  };

  const renderSection = (title, list) => (
    list.length > 0 && (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-black capitalize">
          {title.replace("_", " ")}
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 hidden md:table-cell">Phone</th>
                <th className="px-6 py-4 hidden md:table-cell">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {list.map((member) => (
                <tr
                  key={member.id}
                  className="border-t hover:bg-orange-50"
                >
                  <td className="px-6 py-4 font-medium">
                    {member.profiles.full_name}
                  </td>

                  <td className="px-6 py-4 hidden md:table-cell">
                    {member.profiles.phone}
                  </td>

                  <td className="px-6 py-4 hidden md:table-cell capitalize">
                    {member.membership_plans.duration}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        member.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 flex justify-center gap-4">
                    <button onClick={() => openEdit(member)}>
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/payments?member=${member.user_id}`)
                      }
                    >
                      <RotateCcw size={16} />
                    </button>

                    <button
                      onClick={() => deactivateMember(member)}
                    >
                      <Power size={16} className="text-orange-500" />
                    </button>

                    <button
                      onClick={() => deleteMember(member)}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-semibold text-black">
          Members
        </h1>

        <button
          onClick={() => navigate("/add-member")}
          className="bg-orange-500 text-white px-5 py-2 rounded-xl"
        >
          + Add Member
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search members..."
        className="w-full md:w-1/3 border rounded-xl px-4 py-2"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Grouped Sections */}
      {renderSection("tenant", grouped.tenant)}
      {renderSection("non_tenant", grouped.non_tenant)}
      {renderSection("corporate", grouped.corporate)}

      {/* Pagination */}
      <div className="flex justify-center gap-2 pt-6">
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === index + 1
                ? "bg-black text-white"
                : "bg-gray-200"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Edit Member
            </h2>

            <input
              value={updatedName}
              onChange={(e) => setUpdatedName(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mb-3"
            />

            <input
              value={updatedPhone}
              onChange={(e) => setUpdatedPhone(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mb-6"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-orange-500 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
