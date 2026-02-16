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
  <div className="max-w-3xl mx-auto">

    {/* Page Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-semibold text-black">
        Add New Member
      </h1>
      <p className="text-gray-500 mt-2">
        Register a new member and record initial payment.
      </p>
    </div>

    {/* Card */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter member name"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="text"
            placeholder="Enter phone number"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        {/* Category + Duration Grid */}
        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Membership Category
            </label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="tenant">Tenant</option>
              <option value="non_tenant">Non Tenant</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Duration
            </label>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi_annual">Semi Annual</option>
              <option value="annual">Annual</option>
            </select>
          </div>

        </div>

        {/* Price Display */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between items-center">
          <span className="text-gray-500 text-sm">
            Membership Price
          </span>
          <span className="text-xl font-semibold text-orange-500">
            KES {selectedPrice.toLocaleString()}
          </span>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="mpesa">Mpesa</option>
            <option value="card">Card</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl shadow-sm transition disabled:opacity-50"
        >
          {loading ? "Processing..." : "Add Member"}
        </button>

      </form>
    </div>

  </div>
);

}
