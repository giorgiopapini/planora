export type ProjectStatus = "In progress" | "On track" | "Planning";
export type TaskStatus = "Todo" | "In progress" | "In review" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type MilestoneStatus = "Completed" | "In progress" | "Upcoming";

export type ProjectTask = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string;
  assignees: string[];
  priority: TaskPriority;
  tags: string[];
  detail: string;
};

export type Project = {
  slug: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  detail: string;
  description: string;
  owner: string;
  startDate: string;
  dueDate: string;
  workspace: string;
  tasks: { completed: number; total: number };
  taskList: ProjectTask[];
  milestones: { title: string; date: string; status: MilestoneStatus }[];
  team: { name: string; role: string }[];
  activity: { person: string; action: string; target: string; time: string }[];
};

export const projects: Project[] = [
  {
    slug: "website-refresh",
    name: "Website refresh",
    status: "In progress",
    progress: 72,
    detail: "12 tasks remaining",
    description: "Refresh the marketing site to make Planora easier to understand, explore, and adopt.",
    owner: "Alex Morgan",
    startDate: "Aug 4, 2026",
    dueDate: "Sep 30, 2026",
    workspace: "Product Development",
    tasks: { completed: 36, total: 50 },
    taskList: [
      { id: "website-1", title: "Finalize homepage copy", status: "Completed", dueDate: "Sep 4, 2026", assignees: ["Taylor Kim"], priority: "Medium", tags: ["Content"], detail: "Approve the final copy for the refreshed homepage and supporting pages." },
      { id: "website-2", title: "Build navigation implementation", status: "Completed", dueDate: "Sep 6, 2026", assignees: ["Jordan Lee"], priority: "High", tags: ["Engineering"], detail: "Implement the responsive site navigation and keyboard interactions." },
      { id: "website-3", title: "Review homepage wireframes", status: "In review", dueDate: "Sep 10, 2026", assignees: ["Sam Rivera", "Alex Morgan"], priority: "High", tags: ["Design", "Product"], detail: "Review the latest wireframes and collect final stakeholder feedback." },
      { id: "website-4", title: "Create pricing page", status: "In progress", dueDate: "Sep 14, 2026", assignees: ["Sam Rivera"], priority: "Medium", tags: ["Design"], detail: "Turn the approved pricing content into a polished page layout." },
      { id: "website-5", title: "Set up analytics events", status: "Todo", dueDate: "Sep 18, 2026", assignees: ["Jordan Lee"], priority: "Low", tags: ["Engineering"], detail: "Add the key conversion and navigation events needed after launch." },
      { id: "website-6", title: "Prepare launch QA checklist", status: "Todo", dueDate: "Sep 26, 2026", assignees: ["Alex Morgan"], priority: "Urgent", tags: ["Product"], detail: "Document launch checks across browsers, responsive widths, and accessibility." },
    ],
    milestones: [
      { title: "Content and audience research", date: "Aug 12", status: "Completed" },
      { title: "Design system approved", date: "Aug 22", status: "Completed" },
      { title: "Engineering handoff", date: "Sep 10", status: "In progress" },
      { title: "Launch QA", date: "Sep 26", status: "Upcoming" },
    ],
    team: [
      { name: "Alex Morgan", role: "Project owner" },
      { name: "Jordan Lee", role: "Engineering" },
      { name: "Sam Rivera", role: "Product design" },
      { name: "Taylor Kim", role: "Content" },
    ],
    activity: [
      { person: "Jordan Lee", action: "completed", target: "navigation implementation", time: "2 hours ago" },
      { person: "Sam Rivera", action: "updated", target: "the homepage wireframes", time: "Yesterday" },
      { person: "Alex Morgan", action: "moved Launch QA", target: "to Sep 26", time: "Yesterday" },
    ],
  },
  {
    slug: "mobile-app-launch",
    name: "Mobile app launch",
    status: "On track",
    progress: 48,
    detail: "8 tasks remaining",
    description: "Coordinate the final product, engineering, and launch work for the new mobile experience.",
    owner: "Jordan Lee",
    startDate: "Aug 12, 2026",
    dueDate: "Oct 18, 2026",
    workspace: "Product Development",
    tasks: { completed: 19, total: 40 },
    taskList: [
      { id: "mobile-1", title: "Confirm beta scope", status: "Completed", dueDate: "Sep 1, 2026", assignees: ["Alex Morgan"], priority: "High", tags: ["Product"], detail: "Align product and engineering on the scope for internal beta." },
      { id: "mobile-2", title: "Build notification settings", status: "In progress", dueDate: "Sep 12, 2026", assignees: ["Maya Patel"], priority: "Medium", tags: ["Engineering"], detail: "Give people control over the notifications they receive on mobile." },
      { id: "mobile-3", title: "Run internal beta", status: "In review", dueDate: "Sep 15, 2026", assignees: ["Jordan Lee", "Maya Patel"], priority: "High", tags: ["Product", "Engineering"], detail: "Coordinate feedback from the internal beta group and triage findings." },
      { id: "mobile-4", title: "Prepare app store assets", status: "Todo", dueDate: "Oct 3, 2026", assignees: ["Alex Morgan"], priority: "Medium", tags: ["Content"], detail: "Prepare screenshots, descriptions, and release notes for submission." },
      { id: "mobile-5", title: "Submit release candidate", status: "Todo", dueDate: "Oct 8, 2026", assignees: ["Maya Patel"], priority: "Urgent", tags: ["Engineering"], detail: "Submit the release candidate for app store review." },
    ],
    milestones: [
      { title: "Beta scope confirmed", date: "Aug 20", status: "Completed" },
      { title: "Internal beta", date: "Sep 15", status: "In progress" },
      { title: "App store submission", date: "Oct 8", status: "Upcoming" },
      { title: "Public launch", date: "Oct 18", status: "Upcoming" },
    ],
    team: [
      { name: "Jordan Lee", role: "Project owner" },
      { name: "Alex Morgan", role: "Product" },
      { name: "Maya Patel", role: "Mobile engineering" },
    ],
    activity: [
      { person: "Maya Patel", action: "started", target: "the notification settings task", time: "1 hour ago" },
      { person: "Jordan Lee", action: "added", target: "the internal beta milestone", time: "4 hours ago" },
      { person: "Alex Morgan", action: "commented on", target: "the onboarding checklist", time: "Monday" },
    ],
  },
  {
    slug: "q3-marketing-plan",
    name: "Q3 marketing plan",
    status: "Planning",
    progress: 20,
    detail: "14 tasks remaining",
    description: "Build a focused campaign plan for the quarter and align the team around measurable outcomes.",
    owner: "Taylor Kim",
    startDate: "Sep 1, 2026",
    dueDate: "Sep 30, 2026",
    workspace: "Marketing",
    tasks: { completed: 5, total: 25 },
    taskList: [
      { id: "marketing-1", title: "Write campaign brief", status: "In progress", dueDate: "Sep 5, 2026", assignees: ["Taylor Kim"], priority: "High", tags: ["Marketing"], detail: "Define the audience, message, channels, and success criteria for the quarter." },
      { id: "marketing-2", title: "Draft channel plan", status: "Todo", dueDate: "Sep 12, 2026", assignees: ["Maya Patel"], priority: "Medium", tags: ["Marketing", "Product"], detail: "Map the campaign message to the channels and moments where it will have the most impact." },
      { id: "marketing-3", title: "Review creative direction", status: "Todo", dueDate: "Sep 20, 2026", assignees: ["Sam Rivera", "Taylor Kim"], priority: "Medium", tags: ["Design", "Content"], detail: "Review the creative direction and confirm the visual language for the campaign." },
      { id: "marketing-4", title: "Set campaign goals", status: "Completed", dueDate: "Sep 3, 2026", assignees: ["Taylor Kim"], priority: "Low", tags: ["Product"], detail: "Agree on measurable goals and reporting cadence for the campaign." },
    ],
    milestones: [
      { title: "Campaign brief", date: "Sep 5", status: "In progress" },
      { title: "Channel plan", date: "Sep 12", status: "Upcoming" },
      { title: "Creative review", date: "Sep 20", status: "Upcoming" },
      { title: "Campaign kickoff", date: "Sep 30", status: "Upcoming" },
    ],
    team: [
      { name: "Taylor Kim", role: "Project owner" },
      { name: "Sam Rivera", role: "Creative" },
      { name: "Maya Patel", role: "Marketing operations" },
    ],
    activity: [
      { person: "Taylor Kim", action: "created", target: "the campaign brief", time: "3 hours ago" },
      { person: "Sam Rivera", action: "joined", target: "the project team", time: "Yesterday" },
      { person: "Taylor Kim", action: "set the project status", target: "to Planning", time: "Monday" },
    ],
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}
