import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Pencil } from "lucide-react";

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("membership_plans")
      .select("*");

    setPlans(data || []);
  };

  const updatePrice = async (id) => {
    await supabase
      .from("membership_plans")
      .update({ price: Number(newPrice) })
      .eq("id", id);

    setEditingId(null);
    setNewPrice("");
    fetchPlans();
  };

  const categoryOrder = ["tenant", "non_tenant", "corporate"];
  const durationOrder = ["monthly", "quarterly", "semi_annual", "annual"];

  const grouped = categoryOrder.map((category) => {
    const categoryPlans = plans
      .filter((p) => p.category === category)
      .sort(
        (a, b) =>
          durationOrder.indexOf(a.duration) -
          durationOrder.indexOf(b.duration)
      );

    return { category, plans: categoryPlans };
  });

 return (
  <div className="px-4 sm:px-6 lg:px-0 max-w-5xl mx-auto space-y-8">

    {/* Page Header */}
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
        Membership Plans
      </h1>
    </div>

    <div className="space-y-10">

      {grouped.map(
        (group) =>
          group.plans.length > 0 && (
            <div key={group.category}>

              {/* Category Header */}
              <div className="mb-4">
                <h2 className="text-base sm:text-lg font-semibold capitalize text-slate-700">
                  {group.category.replace("_", " ")}
                </h2>
              </div>

              {/* Category Card */}
              <div className="bg-white rounded-2xl shadow-sm border-l-4 border-orange-500 overflow-hidden">

                {group.plans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-4 sm:px-6 py-5 group ${
                      index !== group.plans.length - 1
                        ? "border-b"
                        : ""
                    }`}
                  >
                    {/* Left Side */}
                    <div>
                      <p className="font-medium capitalize text-slate-700 text-sm sm:text-base">
                        {plan.duration.replace("_", " ")}
                      </p>

                      {group.category === "corporate" && (
                        <p className="text-xs text-slate-500 mt-1">
                          Min Members: {plan.corporate_minimum || 5}
                        </p>
                      )}
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">

                      {editingId === plan.id ? (
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                          <input
                            type="number"
                            value={newPrice}
                            onChange={(e) =>
                              setNewPrice(e.target.value)
                            }
                            className="border rounded-lg px-3 py-2 w-full sm:w-32 text-sm"
                          />
                          <button
                            onClick={() => updatePrice(plan.id)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">

                          {/* Price Badge */}
                          <span className="bg-orange-100 text-orange-700 font-semibold px-4 py-1 rounded-full text-sm whitespace-nowrap">
                            KES {plan.price.toLocaleString()}
                          </span>

                          {/* Edit Icon */}
                          <button
                            onClick={() => {
                              setEditingId(plan.id);
                              setNewPrice(plan.price);
                            }}
                            className="sm:opacity-0 sm:group-hover:opacity-100 transition"
                          >
                            <Pencil
                              size={16}
                              className="text-slate-500 hover:text-orange-500"
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              </div>
            </div>
          )
      )}
    </div>
  </div>
);

}
