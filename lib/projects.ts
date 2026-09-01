export type ProjectStatus = "In progress" | "On track" | "Planning" | "Archived";
export type TaskStatus = "Todo" | "In progress" | "In review" | "Completed" | string;
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type MilestoneStatus = "Completed" | "In progress" | "Upcoming";

export type ProjectMember = {
  userId: string;
  name: string;
  role: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  status: TaskStatus;
  statusId: string;
  dueDate: string;
  assignees: string[];
  assigneeIds: string[];
  priority: TaskPriority;
  tags: string[];
  tagIds: string[];
  detail: string;
};

export type Project = {
  id: string;
  workspaceId: string;
  slug: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  detail: string;
  description: string;
  ownerId: string;
  owner: string;
  startDate: string;
  dueDate: string;
  workspace: string;
  tasks: { completed: number; total: number };
  taskList: ProjectTask[];
  milestones: { title: string; date: string; status: MilestoneStatus }[];
  team: ProjectMember[];
  activity: { person: string; action: string; target: string; time: string }[];
  workflowStatuses: { id: string; name: string }[];
};
