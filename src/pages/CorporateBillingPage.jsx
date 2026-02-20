import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function CorporateBillingPage() {
  const [corporates, setCorporates] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    fetchCorporates();
  }, []);

  const fetchCorporates = async () => {
    const { data, error } = await supabase
      .from("corporates")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    setCorporates(data || []);
  };

  const handleCorporateBilling = async (corporate) => {
    setLoadingId(corporate.id);

    try {
     // 1️⃣ Get all corporate members from profiles
const { data: corporateMembers, error: memberError } = await supabase
  .from("profiles")
  .select("id")
  .eq("corporate_id", corporate.id);

if (memberError) throw memberError;

const memberIds = corporateMembers.map(m => m.id);

if (memberIds.length === 0) {
  alert("No members assigned to this corporate.");
  return;
}

// 2️⃣ Get memberships for those members
const { data: memberships, error } = await supabase
  .from("memberships")
  .select("id")
  .in("user_id", memberIds);

if (error) throw error;

const memberCount = memberships.length;
const totalAmount = memberCount * 5000; // Assuming KES 5,000 per member

      // 2️⃣ Insert corporate payment record
      const currentMonth = new Date();
      const billingMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );

      await supabase.from("corporate_payments").insert([
        {
          corporate_id: corporate.id,
          amount: totalAmount,
          members_count: memberCount,
          billing_month: billingMonth,
        },
      ]);

      // 3️⃣ Update all memberships to current month
      const startDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );

      const expiryDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      );

      await supabase
        .from("memberships")
        .update({
          start_date: startDate,
          expiry_date: expiryDate,
          status: "active",
        })
        .eq("corporate_id", corporate.id);

      alert(
        `${corporate.company_name} billed successfully (KES ${totalAmount.toLocaleString()})`
      );
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }

    setLoadingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      <div>
        <h1 className="text-3xl font-bold text-black">
          Corporate Billing
        </h1>
        <p className="text-slate-500 mt-1">
          Generate monthly billing for corporate groups.
        </p>
      </div>

      <div className="space-y-6">
        {corporates.map((corporate) => (
          <CorporateCard
            key={corporate.id}
            corporate={corporate}
            onBill={handleCorporateBilling}
            loading={loadingId === corporate.id}
          />
        ))}
      </div>
    </div>
  );
}

function CorporateCard({ corporate, onBill, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 border-l-4 border-orange-500 flex flex-col md:flex-row justify-between md:items-center gap-4">

      <div>
        <p className="text-lg font-semibold text-black">
          {corporate.company_name}
        </p>
        <p className="text-sm text-slate-500">
          Rate per member: KES 5,000
        </p>
      </div>

      <button
        onClick={() => onBill(corporate)}
        disabled={loading}
        className="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
      >
        {loading ? "Processing..." : "Generate Monthly Billing"}
      </button>

    </div>
  );
}
