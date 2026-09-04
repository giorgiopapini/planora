"use server";

import { randomBytes, createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendWorkspaceInvitationEmail } from "@/lib/resend";

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication is required");
  return { supabase, user };
}

function text(value: unknown, field: string) {
  const result = String(value ?? "").trim();
  if (!result) throw new Error(`${field} is required`);
  return result;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `workspace-${Date.now()}`;
}

function databaseStatus(value: string) {
  return value.toLowerCase().replace(/\s+/g, "_");
}

type WorkspacePermission = "owner_like" | "project_manager" | "normal_user";
type WorkspaceCapability =
  "workspace_delete" | "member_manage" | "project_manage" | "task_manage";

function workspaceRoleNameError(
  error: { message?: string } | null,
  fallback: string,
): Error {
  if (error?.message?.includes("workspace_roles_unique_name")) {
    return new Error("A role with this name already exists.");
  }
  return new Error(error?.message || fallback);
}

function workspacePermission(value: unknown): WorkspacePermission {
  if (
    value === "owner_like" ||
    value === "project_manager" ||
    value === "normal_user"
  )
    return value;
  throw new Error("A valid workspace permission is required");
}

async function assertWorkspacePermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  permission: WorkspaceCapability,
) {
  const { data, error } = await supabase.rpc("has_workspace_permission", {
    p_workspace_id: workspaceId,
    p_permission_key: permission,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You do not have permission to make this change");
}

async function assertProjectManageAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  workspaceId: string,
  userId: string,
) {
  const [
    { data: ownerLike, error: ownerLikeError },
    { data: canManageProjects, error: permissionError },
  ] = await Promise.all([
    supabase.rpc("has_workspace_permission", {
      p_workspace_id: workspaceId,
      p_permission_key: "workspace_delete",
    }),
    supabase.rpc("has_workspace_permission", {
      p_workspace_id: workspaceId,
      p_permission_key: "project_manage",
    }),
  ]);
  if (ownerLikeError || permissionError)
    throw new Error(
      ownerLikeError?.message ||
        permissionError?.message ||
        "Project permissions could not be loaded",
    );
  if (ownerLike) return;
  if (!canManageProjects)
    throw new Error("Project management access is required");

  const [
    { data: createdProject, error: createdError },
    { data: projectMembership, error: membershipError },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("workspace_id", workspaceId)
      .eq("created_by", userId)
      .maybeSingle(),
    supabase
      .from("project_members")
      .select("project_id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  if (createdError || membershipError) {
    throw new Error(
      createdError?.message ||
        membershipError?.message ||
        "Project access could not be loaded",
    );
  }
  if (!createdProject && !projectMembership)
    throw new Error("You do not have access to this project");
}

async function assertWorkspaceOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string,
) {
  const ownerId = await workspaceOwnerId(supabase, workspaceId);
  if (ownerId !== userId)
    throw new Error("Only the workspace owner can manage roles");
}

async function workspaceOwnerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
) {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error || !workspace)
    throw new Error(error?.message || "Workspace not found");
  return workspace.owner_id;
}

async function workspaceActorPermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string,
) {
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
      .select("workspace_roles(permission_key)")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  if (workspaceError || membershipError || !workspace || !membership) {
    throw new Error(
      workspaceError?.message ||
        membershipError?.message ||
        "Workspace permissions could not be loaded",
    );
  }
  const role = Array.isArray(membership.workspace_roles)
    ? membership.workspace_roles[0]
    : membership.workspace_roles;
  return workspace.owner_id === userId
    ? "owner_like"
    : role?.permission_key || "normal_user";
}

async function assertAssignableWorkspaceRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  roleId: string,
  userId: string,
) {
  await assertWorkspacePermission(supabase, workspaceId, "member_manage");
  const [
    { data: role, error: roleError },
    { data: actorPermission, error: actorError },
  ] = await Promise.all([
    supabase
      .from("workspace_roles")
      .select("role_key, permission_key")
      .eq("workspace_id", workspaceId)
      .eq("id", roleId)
      .is("archived_at", null)
      .maybeSingle(),
    workspaceActorPermission(supabase, workspaceId, userId),
  ]);
  if (roleError || actorError || !role)
    throw new Error(
      roleError?.message || actorError?.message || "Workspace role not found",
    );
  if (role.role_key === "owner")
    throw new Error("The Owner role cannot be assigned");
  if (
    actorPermission === "project_manager" &&
    role.permission_key !== "normal_user"
  )
    throw new Error("Project managers can only assign normal user roles");
}

async function assertManageableWorkspaceMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  targetUserId: string,
  actorUserId: string,
) {
  await assertWorkspacePermission(supabase, workspaceId, "member_manage");
  const [
    { data: workspace, error: workspaceError },
    { data: target, error: targetError },
    actorPermission,
  ] = await Promise.all([
    supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceId)
      .maybeSingle(),
    supabase
      .from("workspace_members")
      .select("workspace_roles(permission_key)")
      .eq("workspace_id", workspaceId)
      .eq("user_id", targetUserId)
      .eq("status", "active")
      .maybeSingle(),
    workspaceActorPermission(supabase, workspaceId, actorUserId),
  ]);
  if (workspaceError || targetError || !workspace || !target)
    throw new Error(
      workspaceError?.message ||
        targetError?.message ||
        "Workspace member not found",
    );
  if (workspace.owner_id === targetUserId)
    throw new Error("The workspace owner cannot be modified");
  const targetRole = Array.isArray(target.workspace_roles)
    ? target.workspace_roles[0]
    : target.workspace_roles;
  if (
    actorPermission === "project_manager" &&
    targetRole?.permission_key !== "normal_user"
  )
    throw new Error("Project managers can only manage normal users");
}

export async function deleteWorkspace(input: {
  workspaceId: string;
  workspaceName: string;
}) {
  const { supabase } = await authenticatedClient();
  const workspaceName = text(input.workspaceName, "Workspace name");
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", input.workspaceId)
    .maybeSingle();
  if (workspaceError || !workspace)
    throw new Error(workspaceError?.message || "Workspace not found");
  if (workspace.name !== workspaceName)
    throw new Error("Workspace name confirmation does not match");
  const { error } = await supabase.rpc("delete_workspace", {
    p_workspace_id: input.workspaceId,
    p_workspace_name: workspaceName,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/workspaces");
}

export async function deleteUser(input: { password: string }) {
  const { supabase, user } = await authenticatedClient();
  const password = text(input.password, "Password");
  if (!user.email) throw new Error("Account email is required");

  // Re-authenticate with the supplied password before deleting the account.
  const { error: verificationError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (verificationError)
    throw new Error("The password you entered is incorrect.");

  const { error } = await supabase.rpc("delete_user");
  if (error) throw new Error(error.message);

  await supabase.auth.signOut();
  revalidatePath("/");
}

export async function createWorkspace(name: string) {
  const { supabase, user } = await authenticatedClient();
  const workspaceName = text(name, "Workspace name");
  const { error } = await supabase.rpc("create_workspace", {
    p_name: workspaceName,
    p_slug: `${slugify(workspaceName)}-${user.id.slice(0, 8)}`,
    p_description: null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/workspaces");
}

export async function createProject(input: {
  workspaceId: string;
  name: string;
  description: string;
  startDate: string;
  dueDate: string;
  ownerId: string;
  memberIds: string[];
}) {
  const { supabase, user } = await authenticatedClient();
  await assertWorkspacePermission(
    supabase,
    input.workspaceId,
    "project_manage",
  );
  const name = text(input.name, "Project name");
  const description = text(input.description, "Project description");
  if (
    !input.workspaceId ||
    !input.startDate ||
    !input.dueDate ||
    !input.ownerId
  )
    throw new Error("Project details are incomplete");
  const memberIds = Array.from(new Set([input.ownerId, ...input.memberIds]));
  const { error } = await supabase.rpc("create_project", {
    p_workspace_id: input.workspaceId,
    p_name: name,
    p_slug: `${slugify(name)}-${Date.now().toString(36)}`,
    p_description: description,
    p_start_date: input.startDate,
    p_due_date: input.dueDate,
    p_owner_id: input.ownerId,
    p_member_ids: memberIds,
    p_created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/projects");
}

export async function updateProject(input: {
  projectId: string;
  name: string;
  description: string;
  status: string;
  ownerId: string;
  startDate: string;
  dueDate: string;
  memberIds: string[];
}) {
  const { supabase, user } = await authenticatedClient();
  const name = text(input.name, "Project name");
  const description = text(input.description, "Project description");
  const memberIds = Array.from(new Set([input.ownerId, ...input.memberIds]));
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("workspace_id, owner_id")
    .eq("id", input.projectId)
    .maybeSingle();
  if (projectError || !project)
    throw new Error(projectError?.message || "Project not found");
  await assertProjectManageAccess(
    supabase,
    input.projectId,
    project.workspace_id,
    user.id,
  );
  const { data: existing, error: existingError } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", input.projectId);
  if (existingError) throw new Error(existingError.message);
  const { data: canManageProjects, error: permissionError } =
    await supabase.rpc("can_manage_projects", {
      p_workspace_id: project.workspace_id,
    });
  if (permissionError) throw new Error(permissionError.message);
  if (!canManageProjects)
    throw new Error("Project management access is required");

  if (canManageProjects) {
    // Add the new owner first because the database validates owner membership at commit time.
    const { error: addError } = await supabase.from("project_members").upsert(
      memberIds.map((userId) => ({
        project_id: input.projectId,
        user_id: userId,
        project_role:
          userId === input.ownerId ? "Project owner" : "Project team",
      })),
    );
    if (addError) throw new Error(addError.message);
  }
  const { error } = await supabase
    .from("projects")
    .update({
      name,
      description,
      status: databaseStatus(input.status),
      owner_id: input.ownerId,
      start_date: input.startDate,
      due_date: input.dueDate,
    })
    .eq("id", input.projectId);
  if (error) throw new Error(error.message);
  if (canManageProjects) {
    const toRemove = (existing ?? [])
      .map((member) => member.user_id)
      .filter((userId) => !memberIds.includes(userId));
    if (toRemove.length) {
      const { error: removeError } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", input.projectId)
        .in("user_id", toRemove);
      if (removeError) throw new Error(removeError.message);
    }
  }
  revalidatePath("/projects");
  revalidatePath(`/projects/${input.projectId}`);
}

export async function deleteProject(input: {
  projectId: string;
  projectName: string;
}) {
  const { supabase, user } = await authenticatedClient();
  const projectName = text(input.projectName, "Project name");
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", input.projectId)
    .maybeSingle();
  if (projectError || !project)
    throw new Error(projectError?.message || "Project not found");
  const { data: projectWorkspace, error: workspaceError } = await supabase
    .from("projects")
    .select("workspace_id")
    .eq("id", input.projectId)
    .maybeSingle();
  if (workspaceError || !projectWorkspace)
    throw new Error(workspaceError?.message || "Project not found");
  await assertProjectManageAccess(
    supabase,
    input.projectId,
    projectWorkspace.workspace_id,
    user.id,
  );
  if (project.name !== projectName)
    throw new Error("Project name confirmation does not match");
  const { error } = await supabase.rpc("delete_project", {
    p_project_id: input.projectId,
    p_project_name: projectName,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/projects");
  revalidatePath(`/projects/${input.projectId}`);
}

export async function createTask(input: {
  projectId: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string | null;
  priority: string;
  assigneeId?: string;
}) {
  const { supabase, user } = await authenticatedClient();
  const title = text(input.title, "Task name");
  const description = input.description.trim();
  const { data: status, error: statusError } = await supabase
    .from("workflow_statuses")
    .select("id")
    .eq("key", "todo")
    .eq(
      "workspace_id",
      (
        await supabase
          .from("projects")
          .select("workspace_id")
          .eq("id", input.projectId)
          .single()
      ).data?.workspace_id ?? "",
    )
    .maybeSingle();
  if (statusError || !status)
    throw new Error(
      statusError?.message ||
        "Todo status is not configured for this workspace",
    );
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("workspace_id")
    .eq("id", input.projectId)
    .maybeSingle();
  if (projectError || !project)
    throw new Error(projectError?.message || "Project not found");
  await assertProjectManageAccess(
    supabase,
    input.projectId,
    project.workspace_id,
    user.id,
  );
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      status_id: status.id,
      title,
      description,
      start_date: input.startDate,
      due_date: input.dueDate || null,
      priority: databaseStatus(input.priority),
      created_by: user.id,
      position: Date.now() / 1000,
    })
    .select("id")
    .single();
  if (error || !task)
    throw new Error(error?.message || "Task could not be created");
  if (input.assigneeId) {
    const { error: assigneeError } = await supabase
      .from("task_assignees")
      .insert({
        task_id: task.id,
        user_id: input.assigneeId,
        assigned_by: user.id,
      });
    if (assigneeError) throw new Error(assigneeError.message);
  }
  revalidatePath(`/projects/${input.projectId}`);
  return task.id;
}

export async function updateTask(input: {
  taskId: string;
  title?: string;
  description?: string;
  startDate?: string;
  dueDate?: string | null;
  priority?: string;
  statusName?: string;
  assigneeIds?: string[];
}) {
  const { supabase, user } = await authenticatedClient();
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, project_id, project:projects(workspace_id)")
    .eq("id", input.taskId)
    .maybeSingle();
  if (taskError || !task)
    throw new Error(taskError?.message || "Task not found");
  const workspace = Array.isArray(task.project)
    ? task.project[0]
    : task.project;
  const { data: canManageTasks, error: permissionError } = await supabase.rpc(
    "can_manage_tasks",
    { p_workspace_id: workspace?.workspace_id ?? "" },
  );
  if (permissionError) throw new Error(permissionError.message);
  if (canManageTasks) {
    await assertProjectManageAccess(
      supabase,
      task.project_id,
      workspace?.workspace_id ?? "",
      user.id,
    );
  }
  if (!canManageTasks) {
    if (
      !input.statusName ||
      input.title !== undefined ||
      input.description !== undefined ||
      input.startDate !== undefined ||
      input.dueDate !== undefined ||
      input.priority !== undefined ||
      input.assigneeIds !== undefined
    ) {
      throw new Error(
        "Normal users can only update the status of tasks assigned to them",
      );
    }
    const { data: assignment, error: assignmentError } = await supabase
      .from("task_assignees")
      .select("user_id")
      .eq("task_id", input.taskId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (assignmentError) throw new Error(assignmentError.message);
    if (!assignment)
      throw new Error("Only an assigned user can update this task");
  }
  const changes: Record<string, unknown> = {};
  if (input.title !== undefined) changes.title = text(input.title, "Task name");
  if (input.description !== undefined)
    changes.description = input.description.trim();
  if (input.startDate !== undefined) changes.start_date = input.startDate;
  if (input.dueDate !== undefined) changes.due_date = input.dueDate || null;
  if (input.priority !== undefined)
    changes.priority = databaseStatus(input.priority);
  if (input.statusName !== undefined) {
    const workspace = Array.isArray(task.project)
      ? task.project[0]
      : task.project;
    const { data: status, error: statusError } = await supabase
      .from("workflow_statuses")
      .select("id")
      .eq("workspace_id", workspace?.workspace_id ?? "")
      .eq("name", input.statusName)
      .maybeSingle();
    if (statusError || !status)
      throw new Error(statusError?.message || "Task status not found");
    changes.status_id = status.id;
  }
  if (Object.keys(changes).length) {
    const { error } = await supabase
      .from("tasks")
      .update(changes)
      .eq("id", input.taskId);
    if (error) throw new Error(error.message);
  }
  if (input.assigneeIds) {
    const { error: deleteError } = await supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", input.taskId);
    if (deleteError) throw new Error(deleteError.message);
    if (input.assigneeIds.length) {
      const { error: addError } = await supabase.from("task_assignees").insert(
        input.assigneeIds.map((userId) => ({
          task_id: input.taskId,
          user_id: userId,
          assigned_by: user.id,
        })),
      );
      if (addError) throw new Error(addError.message);
    }
  }
  revalidatePath(`/projects/${task.project_id}`);
}

export async function deleteTask(taskId: string) {
  const { supabase, user } = await authenticatedClient();
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("project_id, projects(workspace_id)")
    .eq("id", taskId)
    .maybeSingle();
  if (taskError || !task)
    throw new Error(taskError?.message || "Task not found");
  const taskWorkspace = Array.isArray(task.projects)
    ? task.projects[0]
    : task.projects;
  await assertProjectManageAccess(
    supabase,
    task.project_id,
    taskWorkspace?.workspace_id ?? "",
    user.id,
  );
  const { data: deletedTask, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!deletedTask)
    throw new Error(
      "Task could not be deleted. Check the task deletion policy in Supabase.",
    );
  revalidatePath(`/projects/${task.project_id}`);
}

async function applicationUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      throw new Error("NEXT_PUBLIC_APP_URL must be a valid URL");
    }
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  if (!host) throw new Error("The application URL is not configured");
  const protocol = requestHeaders.get("x-forwarded-proto") || "http";
  if (protocol !== "http" && protocol !== "https")
    throw new Error("The application protocol is invalid");
  return `${protocol}://${host}`;
}

export async function inviteWorkspaceMember(input: {
  workspaceId: string;
  email: string;
  roleId: string;
}) {
  const { supabase, user } = await authenticatedClient();
  await assertWorkspacePermission(supabase, input.workspaceId, "member_manage");
  await assertAssignableWorkspaceRole(
    supabase,
    input.workspaceId,
    input.roleId,
    user.id,
  );
  const email = text(input.email, "Email").toLowerCase();
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitationUrl = new URL("/accept-invitation", await applicationUrl());
  invitationUrl.searchParams.set("token", token);
  const [
    { data: workspace, error: workspaceError },
    { data: role, error: roleError },
  ] = await Promise.all([
    supabase
      .from("workspaces")
      .select("name")
      .eq("id", input.workspaceId)
      .maybeSingle(),
    supabase
      .from("workspace_roles")
      .select("name")
      .eq("id", input.roleId)
      .eq("workspace_id", input.workspaceId)
      .maybeSingle(),
  ]);
  if (workspaceError || !workspace)
    throw new Error(workspaceError?.message || "Workspace not found");
  if (roleError || !role)
    throw new Error(roleError?.message || "Workspace role not found");

  const { data: invitation, error } = await supabase
    .from("workspace_invitations")
    .insert({
      workspace_id: input.workspaceId,
      email,
      role_id: input.roleId,
      invited_by: user.id,
      token_hash: tokenHash,
    })
    .select("id")
    .single();
  if (error || !invitation)
    throw new Error(error?.message || "Invitation could not be created");

  const inviterName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "A Planora user";
  try {
    await sendWorkspaceInvitationEmail({
      recipientEmail: email,
      inviterName,
      workspaceName: workspace.name,
      roleName: role.name,
      invitationUrl: invitationUrl.toString(),
    });
  } catch (emailError) {
    await supabase
      .from("workspace_invitations")
      .delete()
      .eq("id", invitation.id)
      .eq("status", "pending");
    throw new Error(
      emailError instanceof Error
        ? emailError.message
        : "Invitation email could not be sent",
    );
  }

  revalidatePath("/team");
  return { id: invitation.id, email, roleId: input.roleId };
}

export async function dismissWorkspaceInvitation(input: {
  workspaceId: string;
  invitationId: string;
}) {
  const { supabase, user } = await authenticatedClient();
  await assertWorkspacePermission(supabase, input.workspaceId, "member_manage");
  const { data: invitation, error: invitationError } = await supabase
    .from("workspace_invitations")
    .select("id, role_id, status")
    .eq("id", input.invitationId)
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  if (invitationError || !invitation)
    throw new Error(invitationError?.message || "Invitation not found");
  if (invitation.status !== "pending")
    throw new Error("Only pending invitations can be dismissed");
  await assertAssignableWorkspaceRole(
    supabase,
    input.workspaceId,
    invitation.role_id,
    user.id,
  );
  const { data: deletedInvitation, error } = await supabase
    .from("workspace_invitations")
    .delete()
    .eq("id", input.invitationId)
    .eq("workspace_id", input.workspaceId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!deletedInvitation)
    throw new Error(
      "The invitation could not be dismissed. It may have already been accepted or removed.",
    );
  revalidatePath("/team");
}

export async function acceptWorkspaceInvitation(formData: FormData) {
  const { supabase } = await authenticatedClient();
  const token = text(formData.get("token"), "Invitation token");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { error } = await supabase.rpc("accept_workspace_invitation", {
    p_token_hash: tokenHash,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/workspaces");
}

export async function updateWorkspaceMemberRole(input: {
  workspaceId: string;
  userId: string;
  roleId: string;
}) {
  const { supabase, user } = await authenticatedClient();
  await assertManageableWorkspaceMember(
    supabase,
    input.workspaceId,
    input.userId,
    user.id,
  );
  await assertAssignableWorkspaceRole(
    supabase,
    input.workspaceId,
    input.roleId,
    user.id,
  );
  const { error } = await supabase
    .from("workspace_members")
    .update({ role_id: input.roleId })
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.userId);
  if (error) throw new Error(error.message);
  revalidatePath("/team");
}

export async function removeWorkspaceMember(input: {
  workspaceId: string;
  userId: string;
}) {
  const { supabase, user } = await authenticatedClient();
  await assertManageableWorkspaceMember(
    supabase,
    input.workspaceId,
    input.userId,
    user.id,
  );
  const { error } = await supabase
    .from("workspace_members")
    .update({ status: "removed", removed_at: new Date().toISOString() })
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.userId);
  if (error) throw new Error(error.message);
  revalidatePath("/team");
}

export async function createWorkspaceRole(input: {
  workspaceId: string;
  name: string;
  permissionKey: string;
}) {
  const { supabase, user } = await authenticatedClient();
  await assertWorkspaceOwner(supabase, input.workspaceId, user.id);
  const name = text(input.name, "Role name");
  const permissionKey = workspacePermission(input.permissionKey);
  if (["owner", "unknown"].includes(name.toLowerCase()))
    throw new Error("Owner and Unknown roles are reserved");
  const roleKey = slugify(name).replace(/-/g, "_");
  const { data, error } = await supabase
    .from("workspace_roles")
    .insert({
      workspace_id: input.workspaceId,
      name,
      role_key: `${roleKey}_${Date.now().toString(36)}`,
      permission_key: permissionKey,
      is_system: false,
    })
    .select("id, role_key, name, permission_key, is_system")
    .single();
  if (error || !data)
    throw workspaceRoleNameError(error, "Role could not be created");
  revalidatePath("/team");
  return {
    id: data.id,
    roleKey: data.role_key,
    name: data.name,
    permissionKey: (data.permission_key ||
      "normal_user") as WorkspacePermission,
    isSystem: data.is_system,
  };
}

export async function renameWorkspaceRole(input: {
  workspaceId: string;
  roleId: string;
  name: string;
}) {
  const { supabase, user } = await authenticatedClient();
  await assertWorkspaceOwner(supabase, input.workspaceId, user.id);
  const name = text(input.name, "Role name");
  if (["owner", "unknown"].includes(name.toLowerCase()))
    throw new Error("Owner and Unknown roles are reserved");
  const { error } = await supabase
    .from("workspace_roles")
    .update({ name })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.roleId)
    .eq("is_system", false);
  if (error) throw workspaceRoleNameError(error, "Role could not be renamed");
  revalidatePath("/team");
}

export async function deleteWorkspaceRole(input: {
  workspaceId: string;
  roleId: string;
}) {
  const { supabase, user } = await authenticatedClient();
  await assertWorkspaceOwner(supabase, input.workspaceId, user.id);
  const { error } = await supabase.rpc("delete_workspace_role", {
    p_workspace_id: input.workspaceId,
    p_role_id: input.roleId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/team");
}
