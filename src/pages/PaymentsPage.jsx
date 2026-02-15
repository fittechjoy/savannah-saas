import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLocation } from "react-router-dom";

export default function PaymentsPage() {
  const location = useLocation();

  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [totalRevenue, setTotalRevenue] = useState(0);

  const queryParams = new URLSearchParams(location.search);
  const memberFromQuery = queryParams.get("member");

  useEffect(() => {
    fetchMembers();
    fetchPayments();
  }, []);

  useEffect(() => {
    if (memberFromQuery) {
      setSelectedMember(memberFromQuery);
    }
  }, [memberFromQuery]);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*");

    setMembers(data || []);
  };

  const fetchPayments = async () => {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      profiles:profiles!payments_user_id_fkey (
        full_name
      ),
      memberships (
        expiry_date,
        membership_plans (
          duration
        )
      )
    `)
    .order("payment_date", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setPayments(data || []);

  const total =
    data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  setTotalRevenue(total);
};


  const recordPayment = async () => {
    if (!selectedMember || !amount) {
      alert("Select member and enter amount");
      return;
    }

    // 1️⃣ Insert Payment
    await supabase.from("payments").insert([
      {
        member_id: selectedMember,
        amount: Number(amount),
        method: method,
      },
    ]);

    // 2️⃣ Get Current Membership
    const { data: membership } = await supabase
      .from("memberships")
      .select(`
        *,
        membership_plans ( duration )
      `)
      .eq("user_id", selectedMember)
      .single();

    if (!membership) return;

    let newExpiry = new Date(membership.expiry_date);
    const duration = membership.membership_plans.duration;

    if (duration === "monthly")
      newExpiry.setMonth(newExpiry.getMonth() + 1);

    if (duration === "quarterly")
      newExpiry.setMonth(newExpiry.getMonth() + 3);

    if (duration === "semi_annual")
      newExpiry.setMonth(newExpiry.getMonth() + 6);

    if (duration === "annual")
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);

    // 3️⃣ Update Membership
    await supabase
      .from("memberships")
      .update({
        expiry_date: newExpiry,
        status: "active",
      })
      .eq("id", membership.id);

    // Reset form
    setAmount("");
    setMethod("cash");

    fetchPayments();
    alert("Payment recorded & membership renewed");
  };

  return (
    <div className="space-y-10">

      <h1 className="text-2xl font-bold text-slate-800">
        Payments
      </h1>

      {/* Revenue Card */}
      <div className="bg-white rounded-xl shadow-sm border-l-4 border-orange-500 p-6">
        <p className="text-sm text-slate-500">
          Total Revenue
        </p>
        <p className="text-3xl font-bold text-slate-800 mt-2">
          KES {totalRevenue.toLocaleString()}
        </p>
      </div>

      {/* Record Payment */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">

        <h2 className="font-semibold text-slate-700">
          Record Payment
        </h2>

        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full"
        >
          <option value="">Select Member</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Amount (KES)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full"
        />

        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full"
        >
          <option value="cash">Cash</option>
          <option value="mpesa">Mpesa</option>
          <option value="card">Card</option>
          <option value="bank">Bank Transfer</option>
        </select>

        <button
          onClick={recordPayment}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Save Payment
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Amount</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment, index) => (
                  <tr
                    key={payment.id}
                    className={
                      index !== payments.length - 1
                        ? "border-b hover:bg-gray-50"
                        : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-6 py-4">
                      {new Date(
                        payment.created_at
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      {payment.profiles?.full_name}
                    </td>

                    <td className="px-6 py-4 capitalize">
                      {payment.method}
                    </td>

                    <td className="px-6 py-4 font-semibold text-orange-600">
                      KES {Number(payment.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
