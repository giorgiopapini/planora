import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Project,
  ProjectMember,
  ProjectTask,
  TaskPriority,
} from "@/lib/projects";

type ProfileRow = { id: string; full_name: string; email: string | null };
type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  archived_at?: string | null;
};
export type WorkspacePermission =
  "owner_like" | "project_manager" | "normal_user";
export type WorkspaceCapabilities = {
  userId: string;
  permission: WorkspacePermission;
  canManageMembers: boolean;
  canManageRoles: boolean;
  canManageProjects: boolean;
  canManageTasks: boolean;
  canUpdateTaskStatus: boolean;
  canDeleteWorkspace: boolean;
  canViewAllProjects: boolean;
  canViewAllTasks: boolean;
};
type RoleRow = {
  id: string;
  role_key: string;
  name: string;
  permission_key: WorkspacePermission | null;
  is_system: boolean;
};
type MemberRow = {
  workspace_id: string;
  user_id: string;
  role_id: string;
  status: string;
  profiles: ProfileRow | ProfileRow[] | null;
  workspace_roles: RoleRow | RoleRow[] | null;
};
type InvitationRow = {
  id: string;
  email: string;
  role_id: string;
  status: string;
  created_at: string;
  workspace_roles: RoleRow | RoleRow[] | null;
};
type ProjectRow = {
  id: string;
  workspace_id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string;
  status: string;
  owner_id: string;
  start_date: string;
  due_date: string;
  workspaces: WorkspaceRow | WorkspaceRow[] | null;
  profiles: ProfileRow | ProfileRow[] | null;
};
type ProjectCountTaskRow = {
  project_id: string;
  workflow_statuses: { category: string } | { category: string }[] | null;
  task_assignees: { user_id: string }[];
};
type StatusRow = {
  id: string;
  key: string;
  name: string;
  category: string;
  position: number;
  is_terminal: boolean;
};
type TaskRow = {
  id: string;
  project_id: string;
  status_id: string;
  title: string;
  description: string;
  priority: string;
  start_date: string;
  due_date: string | null;
  task_assignees: {
    user_id: string;
    profiles: ProfileRow | ProfileRow[] | null;
  }[];
  task_tags: {
    tag_id: string;
    tags: { id: string; name: string } | { id: string; name: string }[] | null;
  }[];
};
type OverviewTaskRow = {
  id: string;
  due_date: string | null;
  estimate_minutes: number | null;
  task_assignees: { user_id: string }[];
  workflow_statuses: { category: string } | { category: string }[] | null;
};
type MilestoneRow = {
  id: string;
  title: string;
  target_date: string;
  status: string;
  position: number;
};
type ActivityRow = {
  id: number;
  action_label: string;
  target_label: string;
  task_id?: string | null;
  created_at: string;
  profiles: ProfileRow | ProfileRow[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
function displayDate(value: string | null | undefined) {
  if (!value) return "No due date";
  const date = value.slice(0, 10);
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return "No due date";
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}
function relativeTime(value: string) {
  const seconds = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}
function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
function projectStatus(value: string): Project["status"] {
  return value === "in_progress"
    ? "In progress"
    : value === "on_track"
      ? "On track"
      : value === "archived"
        ? "Archived"
        : "Planning";
}
function taskPriority(value: string): TaskPriority {
  return value === "low"
    ? "Low"
    : value === "high"
      ? "High"
      : value === "urgent"
        ? "Urgent"
        : "Medium";
}
function milestoneStatus(
  value: string,
): "Completed" | "In progress" | "Upcoming" {
  return value === "completed"
    ? "Completed"
    : value === "in_progress"
      ? "In progress"
      : "Upcoming";
}

export async function getWorkspaceCapabilities(
  workspaceId: string,
): Promise<WorkspaceCapabilities> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication is required");
  }

  const [
    { data: workspace, error: workspaceError },
    { data: membership, error: membershipError },
  ] = await Promise.all([
    supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .maybeSingle(),
    supabase
      .from("workspace_members")
      .select("role_id, workspace_roles(permission_key)")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  if (workspaceError || membershipError) {
    throw new Error(
      workspaceError?.message ||
        membershipError?.message ||
        "Workspace permissions could not be loaded",
    );
  }
  if (!workspace || !membership) {
    throw new Error("Active workspace membership is required");
  }

  const role = one(membership.workspace_roles as RoleRow | RoleRow[] | null);
  const permission: WorkspacePermission =
    workspace.owner_id === user.id
      ? "owner_like"
      : role?.permission_key || "normal_user";
  const canViewAllProjects = permission === "owner_like";
  const canViewAllTasks = permission !== "normal_user";
  return {
    userId: user.id,
    permission,
    canManageMembers: permission !== "normal_user",
    canManageRoles: workspace.owner_id === user.id,
    canManageProjects: permission !== "normal_user",
    canManageTasks: permission !== "normal_user",
    canUpdateTaskStatus: true,
    canDeleteWorkspace: permission === "owner_like",
    canViewAllProjects,
    canViewAllTasks,
  };
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", user.id)
    .maybeSingle();
  return (
    data ?? {
      id: user.id,
      full_name:
        user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      email: user.email ?? null,
    }
  );
}

export async function getWorkspaces() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspaces!inner(id, name, slug, description, archived_at)")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((membership) =>
      one(membership.workspaces as WorkspaceRow | WorkspaceRow[] | null),
    )
    .filter(
      (workspace): workspace is WorkspaceRow =>
        workspace !== null && !workspace.archived_at,
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      "workspace_id, user_id, role_id, status, profiles!workspace_members_user_id_fkey(id, full_name, email), workspace_roles(id, role_key, name, permission_key, is_system)",
    )
    .eq("workspace_id", workspaceId)
    .neq("status", "removed")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as MemberRow[];
}

export async function getWorkspaceRoles(workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_roles")
    .select("id, role_key, name, permission_key, is_system")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("is_system", { ascending: false })
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as RoleRow[];
}

export async function getWorkspaceInvitations(workspaceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_invitations")
    .select(
      "id, email, role_id, status, created_at, workspace_roles(id, role_key, name, permission_key, is_system)",
    )
    .eq("workspace_id", workspaceId)
    .eq("status", "pending")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as InvitationRow[];
}

export async function getProjects(
  workspaceId: string,
  capabilities?: WorkspaceCapabilities,
) {
  const supabase = await createClient();
  const access = capabilities || (await getWorkspaceCapabilities(workspaceId));
  const visibleProjectIds = access.canViewAllProjects
    ? null
    : await getVisibleProjectIds(supabase, workspaceId, access);
  if (visibleProjectIds && visibleProjectIds.length === 0) return [];

  let projectsQuery = supabase
    .from("projects")
    .select(
      "id, workspace_id, slug, name, short_description, description, status, owner_id, start_date, due_date, workspaces(id, name, slug, description), profiles!projects_owner_id_fkey(id, full_name, email)",
    )
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("due_date")
    .order("name");
  let taskQuery = supabase
    .from("tasks")
    .select("project_id, workflow_statuses(category), task_assignees(user_id)")
    .is("deleted_at", null);
  if (visibleProjectIds) {
    projectsQuery = projectsQuery.in("id", visibleProjectIds);
    taskQuery = taskQuery.in("project_id", visibleProjectIds);
  }
  const [
    { data: projects, error: projectsError },
    { data: taskRows, error: tasksError },
  ] = await Promise.all([projectsQuery, taskQuery]);
  if (projectsError) throw new Error(projectsError.message);
  if (tasksError) throw new Error(tasksError.message);
  const counts = new Map<string, { total: number; completed: number }>();
  ((taskRows ?? []) as ProjectCountTaskRow[])
    .filter(
      (task) =>
        access.canViewAllTasks ||
        task.task_assignees.some(
          (assignee) => assignee.user_id === access.userId,
        ),
    )
    .forEach((task) => {
      const current = counts.get(task.project_id) || {
        total: 0,
        completed: 0,
      };
      current.total += 1;
      if (one(task.workflow_statuses)?.category === "completed")
        current.completed += 1;
      counts.set(task.project_id, current);
    });
  return (projects ?? []).map((project) => {
    const count = counts.get(project.id) || { total: 0, completed: 0 };
    return mapProject(project as ProjectRow, count);
  });
}

export async function getProject(
  workspaceId: string,
  slug: string,
  capabilities?: WorkspaceCapabilities,
) {
  const access = capabilities || (await getWorkspaceCapabilities(workspaceId));
  const projects = await getProjects(workspaceId, access);
  const project = projects.find((item) => item.slug === slug);
  if (!project) return null;
  return getProjectDetails(project, access);
}

export async function getOverview(
  workspaceId: string,
  userId: string,
  capabilities?: WorkspaceCapabilities,
) {
  const supabase = await createClient();
  const access = capabilities || (await getWorkspaceCapabilities(workspaceId));
  const projectIds =
    (access.canViewAllProjects
      ? (
          await supabase
            .from("projects")
            .select("id")
            .eq("workspace_id", workspaceId)
            .is("archived_at", null)
        ).data?.map((project) => project.id)
      : await getVisibleProjectIds(supabase, workspaceId, access)) || [];
  const [
    { data: projects, error: projectsError },
    taskResult,
    { data: activity, error: activityError },
    { data: members, error: membersError },
    { data: capacity, error: capacityError },
  ] = await Promise.all([
    projectIds.length
      ? supabase
          .from("projects")
          .select("id, status, due_date")
          .eq("workspace_id", workspaceId)
          .in("id", projectIds)
          .is("archived_at", null)
      : Promise.resolve({ data: [], error: null }),
    projectIds.length
      ? supabase
          .from("tasks")
          .select(
            "id, due_date, estimate_minutes, task_assignees(user_id), workflow_statuses(category)",
          )
          .in("project_id", projectIds)
          .is("deleted_at", null)
          .then((result) => {
            if (access.canViewAllTasks) return result;
            return {
              data: (result.data || []).filter((task) =>
                (task.task_assignees || []).some(
                  (assignee) => assignee.user_id === access.userId,
                ),
              ),
              error: result.error,
            };
          })
      : Promise.resolve({ data: [], error: null }),
    projectIds.length
      ? supabase
          .from("activity_events")
          .select(
            "id, action_label, target_label, task_id, created_at, profiles(id, full_name, email)",
          )
          .eq("workspace_id", workspaceId)
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("workspace_members")
      .select(
        "user_id, profiles!workspace_members_user_id_fkey(id, full_name, email)",
      )
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .then((result) => {
        if (access.canViewAllTasks) return result;
        return {
          data: (result.data || []).filter(
            (member) => member.user_id === access.userId,
          ),
          error: result.error,
        };
      }),
    supabase
      .from("member_capacity")
      .select("user_id, capacity_minutes, effective_from, effective_to")
      .eq("workspace_id", workspaceId)
      .lte("effective_from", new Date().toISOString().slice(0, 10))
      .or(
        `effective_to.is.null,effective_to.gte.${new Date().toISOString().slice(0, 10)}`,
      ),
  ]);
  if (
    projectsError ||
    taskResult.error ||
    activityError ||
    membersError ||
    capacityError
  )
    throw new Error(
      [
        projectsError,
        taskResult.error,
        activityError,
        membersError,
        capacityError,
      ].find(Boolean)?.message || "Overview could not be loaded",
    );

  const taskRows = (taskResult.data ?? []) as OverviewTaskRow[];
  const completed = taskRows.filter(
    (task) => one(task.workflow_statuses)?.category === "completed",
  ).length;
  const inProgress = taskRows.filter(
    (task) => one(task.workflow_statuses)?.category === "active",
  ).length;
  const todo = taskRows.filter(
    (task) => one(task.workflow_statuses)?.category === "todo",
  ).length;
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const dueSoon = taskRows.filter(
    (task) =>
      task.due_date && task.due_date >= today && task.due_date <= nextWeek,
  ).length;
  const capacityMap = new Map(
    (capacity ?? []).map((item) => [item.user_id, item.capacity_minutes]),
  );
  const assignedMinutes = new Map<string, number>();
  taskRows.forEach((task) =>
    task.task_assignees.forEach((assignee) =>
      assignedMinutes.set(
        assignee.user_id,
        (assignedMinutes.get(assignee.user_id) || 0) +
          (task.estimate_minutes || 0),
      ),
    ),
  );
  const workload = (members ?? []).slice(0, 3).map((member) => {
    const profile = one(member.profiles as ProfileRow | ProfileRow[] | null);
    const available = capacityMap.get(member.user_id) || 0;
    return {
      name:
        member.user_id === userId
          ? "Your workload"
          : profile?.full_name || profile?.email || "User",
      value: available
        ? Math.min(
            100,
            Math.round(
              ((assignedMinutes.get(member.user_id) || 0) / available) * 100,
            ),
          )
        : 0,
    };
  });
  return {
    metrics: { completed, created: projects?.length || 0, inProgress, dueSoon },
    status: { completed, inProgress, todo },
    workload,
    activity: ((activity ?? []) as ActivityRow[])
      .filter((event) =>
        access.canViewAllTasks && !event.task_id
          ? true
          : Boolean(
              event.task_id &&
              taskRows.some((task) => task.id === event.task_id),
            ),
      )
      .map((event) => {
        const profile = one(event.profiles);
        return {
          person: profile?.full_name || profile?.email || "User",
          action: event.action_label,
          target: event.target_label,
          time: relativeTime(event.created_at),
        };
      }),
  };
}

async function getProjectDetails(
  project: Project,
  capabilities: WorkspaceCapabilities,
) {
  const supabase = await createClient();
  const [
    { data: tasks, error: tasksError },
    { data: statuses, error: statusesError },
    { data: members, error: membersError },
    { data: milestones, error: milestonesError },
    { data: activity, error: activityError },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "id, project_id, status_id, title, description, priority, start_date, due_date, task_assignees(user_id, profiles!task_assignees_user_id_fkey(id, full_name, email)), task_tags(tag_id, tags(id, name))",
      )
      .eq("project_id", project.id)
      .is("deleted_at", null)
      .order("position")
      .order("created_at"),
    supabase
      .from("workflow_statuses")
      .select("id, key, name, category, position, is_terminal")
      .eq("workspace_id", project.workspaceId)
      .is("archived_at", null)
      .order("position")
      .order("name"),
    supabase
      .from("project_members")
      .select(
        "user_id, project_role, profiles!project_members_user_id_fkey(id, full_name, email)",
      )
      .eq("project_id", project.id),
    supabase
      .from("milestones")
      .select("id, title, target_date, status, position")
      .eq("project_id", project.id)
      .is("archived_at", null)
      .order("position")
      .order("target_date"),
    supabase
      .from("activity_events")
      .select(
        "id, action_label, target_label, task_id, created_at, profiles(id, full_name, email)",
      )
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if (
    tasksError ||
    statusesError ||
    membersError ||
    milestonesError ||
    activityError
  )
    throw new Error(
      [
        tasksError,
        statusesError,
        membersError,
        milestonesError,
        activityError,
      ].find(Boolean)?.message || "Project could not be loaded",
    );
  const statusMap = new Map(
    ((statuses ?? []) as StatusRow[]).map((status) => [status.id, status]),
  );
  const taskList = ((tasks ?? []) as TaskRow[])
    .filter(
      (task) =>
        capabilities.canViewAllTasks ||
        task.task_assignees.some(
          (assignee) => assignee.user_id === capabilities.userId,
        ),
    )
    .map((task) => mapTask(task, statusMap.get(task.status_id)));
  const projectMembers = (members ?? []).map((member) => {
    const profile = one(
      (member as { profiles: ProfileRow | ProfileRow[] | null }).profiles,
    );
    return {
      userId: member.user_id,
      name: profile?.full_name || profile?.email || "User",
      role: (member as { project_role: string }).project_role,
    } satisfies ProjectMember;
  });
  return {
    ...project,
    taskList,
    team: capabilities.canViewAllTasks
      ? projectMembers
      : projectMembers.filter(
          (member) => member.userId === capabilities.userId,
        ),
    milestones: ((milestones ?? []) as MilestoneRow[]).map((milestone) => ({
      title: milestone.title,
      date: displayDate(milestone.target_date),
      status: milestoneStatus(milestone.status),
    })),
    activity: ((activity ?? []) as ActivityRow[])
      .filter((event) =>
        capabilities.canViewAllTasks
          ? true
          : Boolean(
              event.task_id &&
              taskList.some((task) => task.id === event.task_id),
            ),
      )
      .map((event) => {
        const profile = one(event.profiles);
        return {
          person: profile?.full_name || profile?.email || "User",
          action: event.action_label,
          target: event.target_label,
          time: relativeTime(event.created_at),
        };
      }),
    workflowStatuses: ((statuses ?? []) as StatusRow[]).map((status) => ({
      id: status.id,
      name: status.name,
    })),
  } satisfies Project;
}

async function getVisibleProjectIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  capabilities: WorkspaceCapabilities,
) {
  if (capabilities.canViewAllProjects) return null;
  const [
    { data: memberships, error: membershipsError },
    { data: created, error: createdError },
  ] = await Promise.all([
    supabase
      .from("project_members")
      .select("project_id, projects!inner(workspace_id)")
      .eq("user_id", capabilities.userId)
      .eq("projects.workspace_id", workspaceId),
    capabilities.permission === "project_manager"
      ? supabase
          .from("projects")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("created_by", capabilities.userId)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (membershipsError || createdError) {
    throw new Error(
      membershipsError?.message ||
        createdError?.message ||
        "Project access could not be loaded",
    );
  }
  return Array.from(
    new Set([
      ...(memberships || []).map((membership) => membership.project_id),
      ...(created || []).map((project) => project.id),
    ]),
  );
}

function mapProject(
  project: ProjectRow,
  count: { total: number; completed: number },
): Project {
  const profile = one(project.profiles);
  const workspace = one(project.workspaces);
  const progress = count.total
    ? Math.round((count.completed / count.total) * 100)
    : 0;
  return {
    id: project.id,
    workspaceId: project.workspace_id,
    slug: project.slug,
    name: project.name,
    status: projectStatus(project.status),
    progress,
    detail: `${Math.max(0, count.total - count.completed)} tasks remaining`,
    description:
      project.description ||
      project.short_description ||
      "No description provided.",
    ownerId: project.owner_id,
    owner: profile?.full_name || profile?.email || "User",
    startDate: displayDate(project.start_date),
    startDateIso: project.start_date.slice(0, 10),
    dueDate: displayDate(project.due_date),
    dueDateIso: project.due_date.slice(0, 10),
    workspace: workspace?.name || "Workspace",
    tasks: { completed: count.completed, total: count.total },
    taskList: [],
    milestones: [],
    team: [],
    activity: [],
    workflowStatuses: [],
  };
}
function mapTask(task: TaskRow, status?: StatusRow): ProjectTask {
  const assignees = task.task_assignees.map((assignee) => {
    const profile = one(assignee.profiles);
    return {
      id: assignee.user_id,
      name: profile?.full_name || profile?.email || "User",
    };
  });
  const tags = task.task_tags
    .map((taskTag) => one(taskTag.tags))
    .filter((tag): tag is { id: string; name: string } => Boolean(tag));
  return {
    id: task.id,
    title: task.title,
    status: status?.name || titleCase(status?.key || "todo"),
    statusId: task.status_id,
    startDate: displayDate(task.start_date),
    startDateIso: task.start_date.slice(0, 10),
    dueDate: displayDate(task.due_date),
    dueDateIso: task.due_date ? task.due_date.slice(0, 10) : null,
    assignees: assignees.map((person) => person.name),
    assigneeIds: assignees.map((person) => person.id),
    priority: taskPriority(task.priority),
    tags: tags.map((tag) => tag.name),
    tagIds: tags.map((tag) => tag.id),
    detail: task.description || "No description provided.",
  };
}
