import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLocation } from "react-router-dom";
import { calculateRenewal } from "../utils/billingEngine";


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
  if (!selectedMember) {
    alert("Select member");
    return;
  }

  // 1️⃣ Get Active or Expired Membership
  const { data: membership, error: membershipError } =
    await supabase
      .from("memberships")
      .select(`
        *,
        membership_plans (*)
      `)
      .eq("user_id", selectedMember)
      .single();

  if (membershipError || !membership) {
    alert("Membership not found.");
    return;
  }

  const plan = membership.membership_plans;

  const today = new Date();

  // 2️⃣ Get Unused Freeze Days
  const { data: freezes } = await supabase
    .from("membership_freezes")
    .select("*")
    .eq("membership_id", membership.id)
    .eq("is_applied", false);

  const freezeDays =
    freezes?.reduce((sum, f) => sum + f.freeze_days, 0) || 0;

  // 3️⃣ Calculate Renewal Using Engine
  const { amountDue, newExpiry, freezeDiscount } =
    calculateRenewal({
      membership,
      plan,
      today,
      freezeDays,
    });

  // 4️⃣ Record Payment
  const { error: paymentError } = await supabase
    .from("payments")
    .insert([
      {
        user_id: selectedMember,
        membership_id: membership.id,
        amount: amountDue,
        method: method,
      },
    ]);

  if (paymentError) {
    console.error(paymentError);
    alert("Payment failed.");
    return;
  }

  // 5️⃣ Update Membership
  await supabase
    .from("memberships")
    .update({
      expiry_date: newExpiry,
      outstanding_balance: 0,
      status: "active",
    })
    .eq("id", membership.id);

  // 6️⃣ Mark Freeze Records As Applied
  if (freezeDays > 0) {
    await supabase
      .from("membership_freezes")
      .update({ is_applied: true })
      .eq("membership_id", membership.id)
      .eq("is_applied", false);
  }

  alert(
    `Payment successful.\nFreeze discount applied: KES ${freezeDiscount.toFixed(
      2
    )}`
  );

  fetchPayments();
};


  

 return (
  <div className="px-4 sm:px-6 lg:px-0 max-w-6xl mx-auto space-y-8">

    {/* Header */}
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
        Payments
      </h1>
    </div>

    {/* Revenue Card */}
    <div className="bg-white rounded-2xl shadow-sm border-l-4 border-orange-500 p-5 sm:p-6">
      <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide">
        Total Revenue
      </p>
      <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">
        KES {totalRevenue.toLocaleString()}
      </p>
    </div>

    {/* Record Payment */}
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">

      <h2 className="font-semibold text-slate-700 text-base sm:text-lg">
        Record Payment
      </h2>

      <select
        value={selectedMember}
        onChange={(e) => setSelectedMember(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-orange-500 outline-none"
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
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-orange-500 outline-none"
      />

      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm sm:text-base focus:ring-2 focus:ring-orange-500 outline-none"
      >
        <option value="cash">Cash</option>
        <option value="mpesa">Mpesa</option>
        <option value="card">Card</option>
        <option value="bank">Bank Transfer</option>
      </select>

      <button
        onClick={recordPayment}
        className="w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition font-medium"
      >
        Save Payment
      </button>
    </div>

    {/* Desktop Table */}
    <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
      {payments.length === 0 ? (
        <div className="p-10 text-center text-slate-500">
          No payments recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    {payment.payment_date
                      ? new Date(payment.payment_date).toLocaleDateString("en-KE", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
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

    {/* Mobile Card History */}
    <div className="md:hidden space-y-4">
      {payments.length === 0 && (
        <div className="text-center text-slate-500 py-6">
          No payments recorded yet.
        </div>
      )}

      {payments.map((payment) => (
        <div
          key={payment.id}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2"
        >
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="font-medium">
              {payment.payment_date
                ? new Date(payment.payment_date).toLocaleDateString("en-KE")
                : "-"}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Member</span>
            <span className="font-medium">
              {payment.profiles?.full_name}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Method</span>
            <span className="capitalize font-medium">
              {payment.method}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount</span>
            <span className="font-semibold text-orange-600">
              KES {Number(payment.amount).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>

  </div>
);

}
