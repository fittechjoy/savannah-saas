import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

import Layout from "./layout/Layout";
import Login from "./pages/LoginPage";

import Dashboard from "./pages/Dashboard";
import MembersPage from "./pages/MembersPage";
import PaymentsPage from "./pages/PaymentsPage";
import AttendancePage from "./pages/AttendancePage";
import ReportsPage from "./pages/ReportsPage";
import AddMember from "./pages/AddMember";
import MembershipPlansPage from "./pages/MembershipPlansPage";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  return (
    <Routes>

      {/* Public Route */}
      <Route
        path="/login"
        element={
          !session ? (
            <Login />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          session ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/members" element={<MembersPage />} />
                <Route path="/add-member" element={<AddMember />} />
                <Route path="/membership-plans" element={<MembershipPlansPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

    </Routes>
  );
}

export default App;
