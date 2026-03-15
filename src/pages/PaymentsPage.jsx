import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLocation } from "react-router-dom";
import { calculateRenewal } from "../utils/billingEngine";

export default function PaymentsPage() {
  const location = useLocation();

  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [amountDue, setAmountDue] = useState(0);
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
      previewRenewal(memberFromQuery);
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

  const previewRenewal = async (memberId) => {

    const { data: membership } = await supabase
      .from("memberships")
      .select(`
        *,
        membership_plans (*)
      `)
      .eq("user_id", memberId)
      .single();

    if (!membership) return;

    const plan = membership.membership_plans;
    const today = new Date();
    const expiryDate = new Date(membership.expiry_date);

    let renewalPrice;

    const isExpired = today > expiryDate;

    if (plan.duration === "monthly" && isExpired) {

      const todayDay = today.getDate();

      const { data } = await supabase
        .from("prorated_rates")
        .select("price")
        .eq("category", plan.category)
        .eq("day_of_month", todayDay)
        .single();

      renewalPrice = data?.price || plan.price;

    } else {

      renewalPrice = plan.price;

    }

    setAmountDue(renewalPrice);
  };

  const recordPayment = async () => {

    if (!selectedMember) {
      alert("Select member");
      return;
    }

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
    const expiryDate = new Date(membership.expiry_date);

    const { data: freezes } = await supabase
      .from("membership_freezes")
      .select("*")
      .eq("membership_id", membership.id)
      .eq("is_applied", false);

    const freezeDays =
      freezes?.reduce((sum, f) => sum + f.freeze_days, 0) || 0;

    let renewalPrice;

    const isExpired = today > expiryDate;

    if (plan.duration === "monthly" && isExpired) {

      const todayDay = today.getDate();

      const { data } = await supabase
        .from("prorated_rates")
        .select("price")
        .eq("category", plan.category)
        .eq("day_of_month", todayDay)
        .single();

      renewalPrice = data?.price || plan.price;

    } else {

      renewalPrice = plan.price;

    }

    const { newExpiry } = calculateRenewal({
      membership,
      plan,
      today,
      freezeDays,
    });

    const { error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          user_id: selectedMember,
          membership_id: membership.id,
          amount: renewalPrice,
          method: method,
        },
      ]);

    if (paymentError) {
      console.error(paymentError);
      alert("Payment failed.");
      return;
    }

    await supabase
      .from("memberships")
      .update({
        expiry_date: newExpiry,
        outstanding_balance: 0,
        status: "active",
      })
      .eq("id", membership.id);

    if (freezeDays > 0) {
      await supabase
        .from("membership_freezes")
        .update({ is_applied: true })
        .eq("membership_id", membership.id)
        .eq("is_applied", false);
    }

    alert("Payment successful.");

    fetchPayments();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-0 max-w-6xl mx-auto space-y-8">

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Payments
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border-l-4 border-orange-500 p-5 sm:p-6">
        <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wide">
          Total Revenue
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">
          KES {totalRevenue.toLocaleString()}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">

        <h2 className="font-semibold text-slate-700 text-base sm:text-lg">
          Record Payment
        </h2>

        <select
          value={selectedMember}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedMember(id);
            previewRenewal(id);
          }}
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
          value={amountDue}
          readOnly
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm sm:text-base bg-gray-100"
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

    </div>
  );
}