const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function emptyRow() {
  return { day: "Monday", start: "18:00", end: "20:00" };
}

function AvailabilityEditor({ items, onChange }) {
  function updateRow(index, field, value) {
    const next = items.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    onChange(next);
  }

  function addRow() {
    onChange([...items, emptyRow()]);
  }

  function removeRow(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800">Availability</h3>
        <button
          type="button"
          onClick={addRow}
          className="text-xs font-medium text-slate-900 border border-slate-300 rounded-md px-2 py-1 hover:bg-slate-50"
        >
          + Add time slot
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-slate-400 italic">No availability added yet.</p>
      )}

      <div className="space-y-2">
        {items.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={row.day}
              onChange={(e) => updateRow(index, "day", e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={row.start}
              onChange={(e) => updateRow(index, "start", e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="time"
              value={row.end}
              onChange={(e) => updateRow(index, "end", e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-xs text-red-600 hover:underline ml-auto"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AvailabilityEditor;
