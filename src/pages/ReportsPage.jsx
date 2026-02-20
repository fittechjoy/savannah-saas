import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export default function ReportsPage() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [expiredMembers, setExpiredMembers] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [revenueData, setRevenueData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [corporateRevenue, setCorporateRevenue] = useState(0);

const [selectedMonth, setSelectedMonth] = useState(
  new Date().toISOString().slice(0, 7)
);


  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date();
    monthStart.setDate(1);

    // Corporate revenue this month
const { data: corporatePayments } = await supabase
  .from("corporate_payments")
  .select("amount, billing_month")
  .gte("billing_month", monthStart.toISOString());

const corporateTotal =
  corporatePayments?.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  ) || 0;

setCorporateRevenue(corporateTotal);


    // Payments this month
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .gte("payment_date", monthStart.toISOString());

    const revenue =
      payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    setMonthlyRevenue(revenue);

    // Group revenue by day
    const grouped = {};
    payments?.forEach((p) => {
      const day = new Date(p.payment_date).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
      });
      grouped[day] = (grouped[day] || 0) + Number(p.amount);
    });

    const revenueArray = Object.keys(grouped).map((key) => ({
      day: key,
      revenue: grouped[key],
    }));

    setRevenueData(revenueArray);

    // Membership status
    const { data: memberships } = await supabase
      .from("memberships")
      .select("status");

    const active =
      memberships?.filter((m) => m.status === "active").length || 0;
    const expired =
      memberships?.filter((m) => m.status === "expired").length || 0;

    setActiveMembers(active);
    setExpiredMembers(expired);

    // Attendance Today
    const { data: attendance } = await supabase
      .from("attendance")
      .select("*")
      .gte("checkin_time", today);

    setTodayAttendance(attendance?.length || 0);

    // Last 7 days attendance
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formatted = date.toISOString().split("T")[0];

      const { data } = await supabase
        .from("attendance")
        .select("*")
        .gte("checkin_time", formatted);

      last7.push({
        day: date.toLocaleDateString("en-KE", { weekday: "short" }),
        count: data?.length || 0,
      });
    }

    setAttendanceData(last7);
  };

  const statusData = [
    { name: "Active", value: activeMembers },
    { name: "Expired", value: expiredMembers },
  ];

  const COLORS = ["#f97316", "#111111"];

  const Card = ({ title, value }) => (
    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-orange-500 mt-2">
        {value}
      </p>
    </div>
  );

  const exportMonthlyReport = async () => {
  const startDate = new Date(selectedMonth + "-01");
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  // Payments
  const { data: payments } = await supabase
    .from("payments")
    .select("amount, method, payment_date")
    .gte("payment_date", startDate.toISOString())
    .lt("payment_date", endDate.toISOString());

  const totalRevenue =
    payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const paymentCount = payments?.length || 0;

  // Memberships
  const { data: memberships } = await supabase
    .from("memberships")
    .select("status, created_at");

  const active =
    memberships?.filter((m) => m.status === "active").length || 0;

  const expired =
    memberships?.filter((m) => m.status === "expired").length || 0;

  const newMembers =
    memberships?.filter(
      (m) =>
        new Date(m.created_at) >= startDate &&
        new Date(m.created_at) < endDate
    ).length || 0;

  // Attendance
  const { data: attendance } = await supabase
    .from("attendance")
    .select("checkin_time")
    .gte("checkin_time", startDate.toISOString())
    .lt("checkin_time", endDate.toISOString());

  const totalAttendance = attendance?.length || 0;

  // Create CSV
  const csvContent = `
Savannah Fitness Exchange Monthly Report
Month,${selectedMonth}

Total Revenue,KES ${totalRevenue}
Number of Payments,${paymentCount}
Active Members,${active}
Expired Members,${expired}
New Members This Month,${newMembers}
Total Attendance,${totalAttendance}
`;

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `Savannah_Report_${selectedMonth}.csv`
  );

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportPDFReport = async () => {
  const startDate = new Date(selectedMonth + "-01");
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .gte("payment_date", startDate.toISOString())
    .lt("payment_date", endDate.toISOString());

  const totalRevenue =
    payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const { data: memberships } = await supabase
    .from("memberships")
    .select("status");

  const active =
    memberships?.filter((m) => m.status === "active").length || 0;

  const expired =
    memberships?.filter((m) => m.status === "expired").length || 0;

  const { data: attendance } = await supabase
    .from("attendance")
    .select("*")
    .gte("checkin_time", startDate.toISOString())
    .lt("checkin_time", endDate.toISOString());

  const totalAttendance = attendance?.length || 0;

  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(249, 115, 22); // Orange
  doc.text("Savannah Fitness Exchange", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Monthly Report - ${selectedMonth}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", `KES ${totalRevenue}`],
      ["Active Members", active],
      ["Expired Members", expired],
      ["Total Attendance", totalAttendance],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [0, 0, 0],
    },
  });

  doc.save(`Savannah_Report_${selectedMonth}.pdf`);
};


  return (
  <div className="px-4 sm:px-6 lg:px-0 max-w-7xl mx-auto space-y-8">

    {/* Header */}
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-black">
        Reports Dashboard
      </h1>
      <p className="text-slate-500 mt-1 text-sm sm:text-base">
        Membership health and financial analytics
      </p>
    </div>

    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">

  <input
    type="month"
    value={selectedMonth}
    onChange={(e) => setSelectedMonth(e.target.value)}
    className="border rounded-xl px-4 py-2"
  />

  <button
    onClick={exportMonthlyReport}
    className="bg-orange-500 text-white px-6 py-2 rounded-xl hover:bg-orange-600"
  >
    Export Monthly Report
  </button>

<button
  onClick={exportPDFReport}
  className="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800"
>
  Export PDF
</button>


</div>


    {/* Summary Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
      <Card title="Monthly Revenue" value={`KES ${monthlyRevenue.toLocaleString()}`} />
      <Card title="Active Memberships" value={activeMembers} />
      <Card title="Expired Memberships" value={expiredMembers} />
      <Card title="Today's Attendance" value={todayAttendance} />
      <Card title="Corporate Revenue" value={`KES ${corporateRevenue.toLocaleString()}`} /> 
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

      {/* Revenue Chart */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm">
        <h2 className="font-semibold mb-4 text-black text-sm sm:text-base">
          Revenue Trend
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Membership Pie */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm">
        <h2 className="font-semibold mb-4 text-black text-sm sm:text-base">
          Membership Distribution
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={statusData}
              dataKey="value"
              outerRadius={80}
              label
            >
              {statusData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance Line */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm lg:col-span-2">
        <h2 className="font-semibold mb-4 text-black text-sm sm:text-base">
          Last 7 Days Attendance
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#f97316"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  </div>
);

}
