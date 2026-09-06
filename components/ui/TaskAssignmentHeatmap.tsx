import { Avatar } from "./Avatar";

export type HeatmapDay = {
  date: Date | string;
  label?: string;
};

export type HeatmapUser = {
  id: string;
  name: string;
  assignments: number[];
  capacity?: number;
};

export type TaskAssignmentHeatmapProps = {
  users: HeatmapUser[];
  days: HeatmapDay[];
  maxAssignments?: number;
  className?: string;
};

const intensityClasses = [
  "bg-subtle text-secondary",
  "bg-tint-100 text-tint-900",
  "bg-tint-300 text-tint-900",
  "bg-tint-500 text-tint-900",
  "bg-tint-700 text-white",
  "bg-tint-900 text-white",
];

export function TaskAssignmentHeatmap({
  users,
  days,
  maxAssignments,
  className = "",
}: TaskAssignmentHeatmapProps) {
  const highestAssignment = Math.max(
    1,
    maxAssignments ?? 0,
    ...users.flatMap((user) => user.assignments),
  );
  const totals = users.map((user) =>
    user.assignments.reduce((total, assignments) => total + assignments, 0),
  );
  const totalAssignments = totals.reduce((total, value) => total + value, 0);
  const overloadedUsers = users.filter((user, index) => {
    const capacity = user.capacity ?? Infinity;
    return totals[index] > capacity;
  });

  return (
    <section
      className={`overflow-hidden rounded-xl border border-border bg-surface ${className}`}
      aria-label="Task assignments by team member"
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-primary">
            Task assignments
          </h2>
          <p className="mt-1 text-sm leading-6 text-secondary">
            Daily workload by team member
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-primary">
            {totalAssignments.toLocaleString("en-US")}
          </p>
          <p className="text-xs text-secondary">assigned this period</p>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-full border-collapse" aria-label="Task assignments by day">
          <caption className="sr-only">
            Number of assigned tasks for each team member by day
          </caption>
          <thead>
            <tr className="border-b border-border bg-subtle">
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-[190px] border-r border-border bg-subtle px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary sm:min-w-[220px] sm:px-6"
              >
                Team member
              </th>
              {days.map((day) => {
                const date = toDate(day.date);
                return (
                  <th
                    key={dateKey(date)}
                    scope="col"
                    className="min-w-[56px] border-r border-border px-2 py-3 text-center text-secondary last:border-r-0"
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.08em]">
                      {day.label ?? weekdayLabel(date)}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-primary">
                      {date.getDate()}
                    </span>
                  </th>
                );
              })}
              <th
                scope="col"
                className="min-w-[86px] border-l border-border px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary"
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, userIndex) => {
              const total = totals[userIndex];
              const capacity = user.capacity;
              const overloaded = capacity !== undefined && total > capacity;
              return (
                <tr key={user.id} className="border-b border-border last:border-b-0">
                  <th
                    scope="row"
                    className="sticky left-0 z-[1] min-w-[190px] border-r border-border bg-surface px-4 py-3 text-left sm:min-w-[220px] sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={user.name} size="sm" />
                      <span className="min-w-0 truncate text-sm font-medium text-primary">
                        {user.name}
                      </span>
                    </div>
                  </th>
                  {days.map((day, dayIndex) => {
                    const assignments = user.assignments[dayIndex] ?? 0;
                    return (
                      <td
                        key={`${user.id}-${dateKey(toDate(day.date))}`}
                        className="border-r border-border p-1.5 text-center last:border-r-0"
                      >
                        <HeatmapCell
                          assignments={assignments}
                          highestAssignment={highestAssignment}
                          label={`${user.name}, ${formatDate(day.date)}: ${assignments} assigned task${assignments === 1 ? "" : "s"}`}
                        />
                      </td>
                    );
                  })}
                  <td
                    className={`border-l border-border px-3 py-3 text-right text-sm font-semibold ${overloaded ? "text-danger" : "text-primary"}`}
                    title={
                      capacity === undefined
                        ? `${total} assigned tasks`
                        : `${total} of ${capacity} task capacity`
                    }
                  >
                    <span>{total}</span>
                    {capacity !== undefined && (
                      <span className="block text-[11px] font-normal text-secondary">
                        / {capacity}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="px-6 py-8 text-center text-sm text-secondary">
          No team members to display.
        </p>
      )}

      <footer className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border px-4 py-3 text-xs text-secondary sm:px-6">
        <span className="font-medium text-primary">Tasks per day</span>
        <div className="flex items-center gap-1.5" aria-label="Assignment intensity scale from zero to high">
          {intensityClasses.map((color, index) => (
            <span
              key={color}
              className={`inline-flex h-5 w-5 items-center justify-center rounded-[4px] text-[10px] font-semibold ${color}`}
              title={`${index === 0 ? 0 : Math.ceil((index / 5) * highestAssignment)} assigned tasks`}
              aria-hidden="true"
            />
          ))}
        </div>
        <span>Low</span>
        <span>High</span>
        {overloadedUsers.length > 0 && (
          <span className="ml-auto text-danger">
            {overloadedUsers.length} member{overloadedUsers.length === 1 ? "" : "s"} over capacity
          </span>
        )}
      </footer>
    </section>
  );
}

function HeatmapCell({
  assignments,
  highestAssignment,
  label,
}: {
  assignments: number;
  highestAssignment: number;
  label: string;
}) {
  const intensity = assignments === 0
    ? 0
    : Math.min(5, Math.max(1, Math.ceil((assignments / highestAssignment) * 5)));
  return (
    <span
      className={`flex h-9 w-full min-w-10 items-center justify-center rounded-[4px] text-xs font-semibold transition-colors ${intensityClasses[intensity]}`}
      title={label}
      aria-label={label}
      role="img"
    >
      {assignments}
    </span>
  );
}

function toDate(value: Date | string) {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" })
    .format(date)
    .slice(0, 2);
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(toDate(value));
}
