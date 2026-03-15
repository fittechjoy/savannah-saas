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
  const [corporates, setCorporates] = useState([]);
  const [selectedCorporate, setSelectedCorporate] = useState("");
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expiryPreview, setExpiryPreview] = useState(null);

  useEffect(() => {
  calculateExpiryPreview();
}, [duration]);

  useEffect(() => {
    fetchPlans();
    fetchCorporates();
  }, []);

  useEffect(() => {
    fetchPrice();
  }, [category, duration]);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("membership_plans")
      .select("*");

    setPlans(data || []);
  };

  const fetchCorporates = async () => {
    const { data } = await supabase
      .from("corporates")
      .select("*");

    setCorporates(data || []);
  };

  const fetchPrice = async () => {
    const today = new Date().getDate();

    // Monthly → use prorated table
    if (duration === "monthly" && category !== "corporate") {
      const { data } = await supabase
        .from("prorated_rates")
        .select("price")
        .eq("category", category)
        .eq("day_of_month", today)
        .single();

      if (data) setPrice(data.price);
    }

    // Other plans → use membership_plans
    else {
      const { data } = await supabase
        .from("membership_plans")
        .select("price")
        .eq("category", category)
        .eq("duration", duration)
        .single();

      if (data) setPrice(data.price);
    }
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

      // Create Profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            full_name: fullName,
            phone,
            corporate_id:
              category === "corporate" ? selectedCorporate : null,
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      const startDate = new Date();
      let expiryDate = new Date();

      if (duration === "monthly") {
  const today = new Date().getDate();
  const now = new Date();

  // Join 1–5 → end of this month
  if (today <= 5) {
    expiryDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );
  }

  // Join 6–end → end of next month
  else {
    expiryDate = new Date(
      now.getFullYear(),
      now.getMonth() + 2,
      0
    );
  }
}

      if (duration === "quarterly")
        expiryDate.setMonth(expiryDate.getMonth() + 3);

      if (duration === "semi_annual")
        expiryDate.setMonth(expiryDate.getMonth() + 6);

      if (duration === "annual")
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      // Create Membership
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

      // Record Payment
      const { error: paymentError } = await supabase
        .from("payments")
        .insert([
          {
            user_id: profile.id,
            membership_id: membership.id,
            amount: price,
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

  const calculateExpiryPreview = () => {
  const now = new Date();
  let expiry = new Date();

  if (duration === "monthly") {
    const today = now.getDate();

    if (today <= 5) {
      // End of current month
      expiry = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      // End of next month
      expiry = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    }
  }

  if (duration === "quarterly") {
    expiry = new Date(now.getFullYear(), now.getMonth() + 3, 0);
  }

  if (duration === "semi_annual") {
    expiry = new Date(now.getFullYear(), now.getMonth() + 6, 0);
  }

  if (duration === "annual") {
    expiry = new Date(now.getFullYear() + 1, now.getMonth(), 0);
  }

  setExpiryPreview(expiry);
};



  return (
    <div className="px-4 sm:px-6 lg:px-0 max-w-3xl mx-auto">

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black">
          Add New Member
        </h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Register a new member and record initial payment.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter member name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="Enter phone number"
              className="w-full border border-gray-200 rounded-xl px-4 py-3"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Membership Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3"
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
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi_annual">Semi Annual</option>
                <option value="annual">Annual</option>
              </select>
            </div>

          </div>

          {category === "corporate" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Corporate Company
              </label>

              <select
                value={selectedCorporate}
                onChange={(e) => setSelectedCorporate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3"
                required
              >
                <option value="">Choose Company</option>
                {corporates.map((corp) => (
                  <option key={corp.id} value={corp.id}>
                    {corp.company_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between">
            <span className="text-gray-500 text-sm">
              Membership Price
            </span>
            <span className="text-lg font-semibold text-orange-500">
              KES {price.toLocaleString()}
            </span>
          </div>
          {expiryPreview && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex justify-between">
              <span className="text-gray-500 text-sm">
                Expiry Date Preview
              </span>
              <span className="text-lg font-semibold text-orange-500">
                {expiryPreview.toLocaleDateString()}
              </span>
            </div>
          )}                

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3"
            >
              <option value="cash">Cash</option>
              <option value="mpesa">Mpesa</option>
              <option value="card">Card</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-xl"
          >
            {loading ? "Processing..." : "Add Member"}
          </button>

        </form>
      </div>
    </div>
  );
}