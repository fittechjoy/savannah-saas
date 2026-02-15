import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AddMember() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("non_tenant");
  const [planId, setPlanId] = useState("");
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("membership_plans")
      .select("*");

    setPlans(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1️⃣ Create profile
    const { data: profile } = await supabase
      .from("profiles")
      .insert([{ full_name: fullName, phone }])
      .select()
      .single();

    // 2️⃣ Calculate expiry
    const selectedPlan = plans.find((p) => p.id === planId);

    const startDate = new Date();
    let expiryDate = new Date();

    if (selectedPlan.duration === "monthly")
      expiryDate.setMonth(expiryDate.getMonth() + 1);

    if (selectedPlan.duration === "quarterly")
      expiryDate.setMonth(expiryDate.getMonth() + 3);

    if (selectedPlan.duration === "semi_annual")
      expiryDate.setMonth(expiryDate.getMonth() + 6);

    if (selectedPlan.duration === "annual")
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // 3️⃣ Create membership
    await supabase.from("memberships").insert([
      {
        user_id: profile.id,
        plan_id: selectedPlan.id,
        start_date: startDate,
        expiry_date: expiryDate,
        status: "active",
      },
    ]);

    navigate("/members");
  };

  return (
    <div className="flex justify-center">
      <div className="bg-white shadow rounded-xl p-8 w-1/2">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">
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
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            required
          >
            <option value="">Select Plan</option>
            {plans
              .filter((p) => p.category === category)
              .map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.duration} - KES {plan.price}
                </option>
              ))}
          </select>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
          >
            Add Member
          </button>
        </form>
      </div>
    </div>
  );
}
