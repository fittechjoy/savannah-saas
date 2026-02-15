import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AddMember() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("non_tenant");
  const [duration, setDuration] = useState("monthly");
  const [method, setMethod] = useState("cash");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("membership_plans")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    setPlans(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const selectedPlan = plans.find(
        (p) => p.category === category && p.duration === duration
      );

      if (!selectedPlan) {
        alert("Plan not found");
        setLoading(false);
        return;
      }

      // 1️⃣ Create Profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert([{ full_name: fullName, phone }])
        .select()
        .single();

      if (profileError) throw profileError;

      const startDate = new Date();
      let expiryDate = new Date();

      if (duration === "monthly")
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      if (duration === "quarterly")
        expiryDate.setMonth(expiryDate.getMonth() + 3);
      if (duration === "semi_annual")
        expiryDate.setMonth(expiryDate.getMonth() + 6);
      if (duration === "annual")
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      // 2️⃣ Create Membership
      const { data: membership, error: membershipError } =
        await supabase
          .from("memberships")
          .insert([
            {
              user_id: profile.id,
              plan_id: selectedPlan.id,
              start_date: startDate,
              expiry_date: expiryDate,
              status: "active",
            },
          ])
          .select()
          .single();

      if (membershipError) throw membershipError;

      // 3️⃣ Record Initial Payment
      const { error: paymentError } = await supabase
        .from("payments")
        .insert([
          {
            user_id: profile.id,
            membership_id: membership.id,
            amount: selectedPlan.price,
            method: method,
          },
        ]);

      if (paymentError) throw paymentError;

      alert("Member added successfully & payment recorded");

      navigate("/members");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const selectedPrice =
    plans.find(
      (p) => p.category === category && p.duration === duration
    )?.price || 0;

  return (
    <div className="flex justify-center px-4">
      <div className="bg-white shadow rounded-xl p-8 w-full max-w-xl">

        <h1 className="text-2xl font-semibold mb-6 text-slate-800">
          Add Member
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            className="w-full border rounded-lg px-4 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Phone Number"
            className="w-full border rounded-lg px-4 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <select
            className="w-full border rounded-lg px-4 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="tenant">Tenant</option>
            <option value="non_tenant">Non Tenant</option>
            <option value="corporate">Corporate</option>
          </select>

          <select
            className="w-full border rounded-lg px-4 py-2"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="semi_annual">Semi Annual</option>
            <option value="annual">Annual</option>
          </select>

          {/* Price Display */}
          <div className="bg-gray-50 border rounded-lg px-4 py-3 text-sm">
            <span className="text-slate-500">Price:</span>{" "}
            <span className="font-semibold text-orange-600">
              KES {selectedPrice}
            </span>
          </div>

          {/* Payment Method */}
          <select
            className="w-full border rounded-lg px-4 py-2"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="mpesa">Mpesa</option>
            <option value="card">Card</option>
            <option value="bank">Bank Transfer</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
          >
            {loading ? "Processing..." : "Add Member"}
          </button>

        </form>
      </div>
    </div>
  );
}
