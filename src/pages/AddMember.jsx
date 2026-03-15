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
    fetchPlans();
    fetchCorporates();
  }, []);

  useEffect(() => {
    fetchPrice();
  }, [category, duration]);

  useEffect(() => {
    calculateExpiryPreview();
  }, [duration]);

  useEffect(() => {
  if (category === "corporate") {
    setDuration("monthly");
  }
}, [category]);

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

    if (duration === "monthly" && category !== "corporate") {
      const { data } = await supabase
        .from("prorated_rates")
        .select("price")
        .eq("category", category)
        .eq("day_of_month", today)
        .single();

      if (data) setPrice(data.price);
    } else {
      const { data } = await supabase
        .from("membership_plans")
        .select("price")
        .eq("category", category)
        .eq("duration", duration)
        .single();

      if (data) setPrice(data.price);
    }
  };

  const calculateExpiryPreview = () => {
    const now = new Date();
    let expiry = new Date(now);

    if (duration === "monthly") {
      const today = now.getDate();

      if (today <= 5) {
        expiry = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        expiry = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      }
    }

    if (duration === "quarterly") {
      expiry.setDate(expiry.getDate() + 90);
    }

    if (duration === "semi_annual") {
      expiry.setDate(expiry.getDate() + 180);
    }

    if (duration === "annual") {
      expiry.setDate(expiry.getDate() + 365);
    }

    setExpiryPreview(expiry);
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
      let expiryDate = new Date(startDate);

      if (duration === "monthly") {
        const today = startDate.getDate();

        if (today <= 5) {
          expiryDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            0
          );
        } else {
          expiryDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth() + 2,
            0
          );
        }
      }

      if (duration === "quarterly") {
        expiryDate.setDate(expiryDate.getDate() + 90);
      }

      if (duration === "semi_annual") {
        expiryDate.setDate(expiryDate.getDate() + 180);
      }

      if (duration === "annual") {
        expiryDate.setDate(expiryDate.getDate() + 365);
      }

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

  return (
    <div className="px-4 sm:px-6 lg:px-0 max-w-3xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-black">
          Add New Member
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          <input
            type="text"
            placeholder="Full Name"
            className="w-full border border-gray-200 rounded-xl px-4 py-3"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <input
            type="tel"
            placeholder="Phone"
            className="w-full border border-gray-200 rounded-xl px-4 py-3"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3"
          >
            <option value="tenant">Tenant</option>
            <option value="non_tenant">Non Tenant</option>
            <option value="corporate">Corporate</option>
          </select>

         <select
  value={duration}
  onChange={(e) => setDuration(e.target.value)}
  className="w-full border border-gray-200 rounded-xl px-4 py-3"
>
  <option value="monthly">Monthly</option>

  {category !== "corporate" && (
    <>
      <option value="quarterly">Quarterly</option>
      <option value="semi_annual">Semi Annual</option>
      <option value="annual">Annual</option>
    </>
  )}
</select>

          {category === "corporate" && (
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
          )}

          <div className="bg-gray-50 p-4 rounded-xl flex justify-between">
            <span>Membership Price</span>
            <span>KES {price.toLocaleString()}</span>
          </div>

          {expiryPreview && (
            <div className="bg-gray-50 p-4 rounded-xl flex justify-between">
              <span>Expiry Preview</span>
              <span>{expiryPreview.toLocaleDateString()}</span>
            </div>
          )}

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