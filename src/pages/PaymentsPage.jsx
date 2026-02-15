import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function PaymentsPage() {
  const [memberships, setMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");

  // Fetch memberships with related member and plan data
  const fetchMemberships = async () => {
    const { data, error } = await supabase
      .from("memberships")
      .select(`
        *,
        profiles ( full_name ),
        membership_plans ( duration, price )
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error) {
      setMemberships(data || []);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  // Renew membership (Create new record)
  const renewMembership = async () => {
    if (!selectedMembership || !amount) return;

    const oldMembership = memberships.find(
      (m) => m.id === selectedMembership
    );

    if (!oldMembership) return;

    const duration = oldMembership.membership_plans?.duration;

    const startDate = new Date();
    let expiryDate = new Date();

    if (duration === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (duration === "quarterly") {
      expiryDate.setMonth(expiryDate.getMonth() + 3);
    } else if (duration === "semi_annual") {
      expiryDate.setMonth(expiryDate.getMonth() + 6);
    } else if (duration === "annual") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    // 1️⃣ Expire old membership
    await supabase
      .from("memberships")
      .update({ status: "expired" })
      .eq("id", selectedMembership);

    // 2️⃣ Create new membership
    const { data: newMembership, error } = await supabase
      .from("memberships")
      .insert([
        {
          user_id: oldMembership.user_id,
          plan_id: oldMembership.plan_id,
          start_date: startDate,
          expiry_date: expiryDate,
          status: "active"
        }
      ])
      .select()
      .single();

    if (error) {
      alert("Error renewing membership");
      return;
    }

    // 3️⃣ Record payment linked to new membership
    await supabase.from("payments").insert([
      {
        user_id: oldMembership.user_id,
        membership_id: newMembership.id,
        amount: Number(amount),
        method: method
      }
    ]);

    alert("Membership renewed successfully!");

    setSelectedMembership(null);
    setAmount("");
    fetchMemberships();
  };

  return (
    <div style={{ color: "white" }}>
      <h1 style={{ color: "orange" }}>Payments & Renewals</h1>

      {memberships.length === 0 && (
        <p>No active memberships found.</p>
      )}

      {memberships.map((membership) => (
        <div
          key={membership.id}
          style={{
            padding: "15px",
            marginBottom: "15px",
            background: "#1a1a1a",
            borderRadius: "6px"
          }}
        >
          <strong>
            {membership.profiles?.full_name || "Unknown Member"}
          </strong>
          <br />
          Plan: {membership.membership_plans?.duration}
          <br />
          Expiry:{" "}
          {new Date(membership.expiry_date).toLocaleDateString()}

          <button
            onClick={() => setSelectedMembership(membership.id)}
            style={{
              marginLeft: "15px",
              padding: "6px 12px",
              background: "orange",
              border: "none",
              cursor: "pointer",
              marginTop: "10px"
            }}
          >
            Renew
          </button>
        </div>
      ))}

      {selectedMembership && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            background: "#111",
            borderRadius: "6px"
          }}
        >
          <h3>Record Payment</h3>

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ padding: "10px", marginRight: "10px" }}
          />

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{ padding: "10px", marginRight: "10px" }}
          >
            <option value="cash">Cash</option>
            <option value="mpesa">MPesa</option>
            <option value="bank">Bank</option>
          </select>

          <button
            onClick={renewMembership}
            style={{
              padding: "10px 20px",
              background: "orange",
              border: "none",
              cursor: "pointer"
            }}
          >
            Confirm Renewal
          </button>
        </div>
      )}
    </div>
  );
}

export default PaymentsPage;
