import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function CorporateCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [ratePerMember, setRatePerMember] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editName, setEditName] = useState("");
  const [editContactPerson, setEditContactPerson] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [editRate, setEditRate] = useState(5000);
 


useEffect(() => {
  fetchCompanies();
}, []);


const fetchCompanies = async () => {
  const { data, error } = await supabase
    .from("corporates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const companiesWithCounts = await Promise.all(
    (data || []).map(async (company) => {
      const { count, error: countError } = await supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .eq("corporate_id", company.id)
        .eq("status", "active");

      if (countError) {
        console.error(countError);
      }

      return {
        ...company,
        active_members: count || 0,
      };
    })
  );

  setCompanies(companiesWithCounts);
};



  const addCompany = async () => {
    if (!companyName) {
      alert("Company name required");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("corporates").insert([
      {
        company_name: companyName,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        rate_per_member: ratePerMember,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error adding company");
    } else {
      setCompanyName("");
      setContactPerson("");
      setContactPhone("");
      setRatePerMember(5000);
      fetchCompanies();
    }

    setLoading(false);
  };

  const deactivateCompany = async (id) => {
    await supabase
      .from("corporates")
      .update({ is_active: false })
      .eq("id", id);

    fetchCompanies();
  };

  const openEditModal = (company) => {
  setEditingCompany(company);
  setEditName(company.company_name);
  setEditContactPerson(company.contact_person || "");
  setEditContactPhone(company.contact_phone || "");
  setEditRate(company.rate_per_member || 5000);
};

const updateCompany = async () => {
  if (!editingCompany) return;

  const { error } = await supabase
    .from("corporates")
    .update({
      company_name: editName,
      contact_person: editContactPerson,
      contact_phone: editContactPhone,
      rate_per_member: editRate,
    })
    .eq("id", editingCompany.id);

  if (error) {
    console.error(error);
    alert("Error updating company");
    return;
  }

  setEditingCompany(null);
  fetchCompanies();
};


  return (
    <div className="max-w-6xl mx-auto space-y-10">

      <div>
        <h1 className="text-3xl font-bold text-black">
          Corporate Companies
        </h1>
        <p className="text-slate-500 mt-2">
          Manage corporate clients and billing rates.
        </p>
        
      </div>

      {/* Add Company Card */}
      
      <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">

        <input
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full border rounded-xl px-4 py-3"
        />

        <input
          type="text"
          placeholder="Contact Person"
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          className="w-full border rounded-xl px-4 py-3"
        />

        <input
          type="text"
          placeholder="Contact Phone"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="w-full border rounded-xl px-4 py-3"
        />

        <input
          type="number"
          placeholder="Rate Per Member"
          value={ratePerMember}
          onChange={(e) => setRatePerMember(e.target.value)}
          className="w-full border rounded-xl px-4 py-3"
        />

        <button
          onClick={addCompany}
          disabled={loading}
          className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition"
        >
          {loading ? "Adding..." : "Add Company"}
        </button>
        
<button
  onClick={() => openEditModal(company)}
  className="text-blue-500 hover:text-blue-700 text-sm mr-4"
>
  Edit
</button>


      </div>

    {/* Company List */}
<div className="space-y-4">

  {companies.map((company) => (
    <div
      key={company.id}
      className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center"
    >
      <div>
        <p className="font-semibold text-black">
          {company.company_name}
        </p>

        <p className="text-sm text-slate-500">
          Contact: {company.contact_person} | {company.contact_phone}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          Active Members:{" "}
          <span className="font-semibold text-black">
            {company.active_members}
          </span>
        </p>

        <p className="text-sm text-orange-500 font-semibold mt-1">
          Rate: KES {company.rate_per_member}
        </p>

        <p className="text-sm font-semibold text-black mt-1">
          Estimated Monthly Billing:
          <span className="text-orange-500">
            {" "}
            KES {(company.active_members * company.rate_per_member).toLocaleString()}
          </span>
        </p>
      </div>

      {company.is_active && (
        <button
          onClick={() => deactivateCompany(company.id)}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Deactivate
        </button>
      )}
    </div>
  ))}

</div>

{editingCompany && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">

      <h2 className="text-xl font-semibold text-black">
        Edit Company
      </h2>

      <input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />

      <input
        type="text"
        value={editContactPerson}
        onChange={(e) => setEditContactPerson(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />

      <input
        type="text"
        value={editContactPhone}
        onChange={(e) => setEditContactPhone(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />

      <input
        type="number"
        value={editRate}
        onChange={(e) => setEditRate(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />

      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={() => setEditingCompany(null)}
          className="text-slate-500"
        >
          Cancel
        </button>

        <button
          onClick={updateCompany}
          className="bg-orange-500 text-white px-6 py-2 rounded-xl"
        >
          Save Changes
        </button>
      </div>

    </div>
  </div>
)}


    </div>
  );
}
