import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function AddMember() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [category, setCategory] = useState("non_tenant");
  const [duration, setDuration] = useState("monthly");

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

    const selectedPlan = plans.find(
      (p) => p.category === category && p.duration === duration
    );

    if (!selectedPlan) {
      alert("Plan not found");
      return;
    }

    // 1️⃣ Create profile
    const { data: profile } = await supabase
      .from("profiles")
      .insert([{ full_name: fullName, phone }])
      .select()
      .single();

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

    // 2️⃣ Create membership
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

          {/* CATEGORY SELECT */}
          <select
            className="w-full border rounded-lg px-4 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="tenant">Tenant</option>
            <option value="non_tenant">Non Tenant</option>
            <option value="corporate">Corporate</option>
          </select>

          {/* DURATION SELECT */}
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

          {/* Display Price */}
          <div className="bg-gray-100 p-3 rounded-lg text-sm">
            Price: KES{" "}
            {
              plans.find(
                (p) =>
                  p.category === category &&
                  p.duration === duration
              )?.price || 0
            }
          </div>

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
