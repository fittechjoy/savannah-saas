import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [expired, setExpired] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    setTotal(profiles?.length || 0);

    const { data: memberships } = await supabase
      .from("memberships")
      .select("status, expiry_date, user_id");

    const activeMembers = memberships?.filter(m => m.status === "active") || [];
    const expiredMembers = memberships?.filter(m => m.status === "expired") || [];

    setActive(activeMembers.length);
    setExpired(expiredMembers.length);

    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);

    const expiring = activeMembers.filter(
      m => new Date(m.expiry_date) <= sevenDays
    );

    setExpiringSoon(expiring);
  };

  const Card = ({ title, value }) => (
    <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-orange-500 hover:shadow-md transition">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-black mt-2">{value}</p>
    </div>
  );

  return (
    <div className="space-y-10">

      <div>
        <h1 className="text-3xl font-semibold text-black">
          Dashboard Overview
        </h1>
        <p className="text-gray-500 mt-2">
          Monitor membership activity and renewal priorities.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card title="Total Members" value={total} />
        <Card title="Active Members" value={active} />
        <Card title="Expired Members" value={expired} />
        <Card title="Expiring Soon" value={expiringSoon.length} />
      </div>

    </div>
  );
}
