return (
  <div className="max-w-6xl mx-auto space-y-10">

    {/* Header */}
    <div>
      <h1 className="text-3xl font-semibold text-black">
        Attendance
      </h1>
      <p className="text-gray-500 mt-2">
        Track daily member check-ins.
      </p>
    </div>

    {/* Summary Card */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <p className="text-sm text-gray-500">Today's Attendance</p>
      <p className="text-3xl font-bold text-orange-500 mt-2">
        {todayAttendance.length}
      </p>
    </div>

    {/* Search */}
    <div>
      <input
        type="text"
        placeholder="Search member..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>

    {/* Members List */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y">
      {filteredMembers.map((member) => {
        const checkedIn = todayAttendance.find(
          (a) => a.user_id === member.id
        );

        return (
          <div
            key={member.id}
            className="flex justify-between items-center px-6 py-4 hover:bg-orange-50 transition"
          >
            <p className="font-medium text-black">
              {member.full_name}
            </p>

            <button
              onClick={() => handleCheckIn(member.id)}
              disabled={checkedIn}
              className={`px-4 py-2 rounded-xl text-sm text-white transition ${
                checkedIn
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {checkedIn ? "Checked In" : "Check In"}
            </button>
          </div>
        );
      })}
    </div>

    {/* Today's Log */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-sm font-semibold text-gray-600 mb-4">
        Today's Check-ins
      </h2>

      {todayAttendance.length === 0 ? (
        <p className="text-gray-400 text-sm">
          No check-ins yet today.
        </p>
      ) : (
        <ul className="space-y-2">
          {todayAttendance.map((a) => (
            <li
              key={a.id}
              className="text-sm text-black"
            >
              {a.profiles?.full_name}
            </li>
          ))}
        </ul>
      )}
    </div>

  </div>
);
