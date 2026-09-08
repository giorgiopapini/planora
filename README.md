# Planora

> A calm, focused project-management workspace for organizing projects, tasks, timelines, and team capacity.

Planora is a full-stack Next.js application for teams that need one shared place to plan initiatives, assign work, monitor progress, and manage workspace access. It combines a marketing site, Supabase authentication, workspace-scoped data, permission-aware server actions, and multiple task visualizations in a clean, light interface.

This README documents the product, page flows, project structure, local installation, environment variables, Supabase setup, and the areas where screenshots can be added later.

---

## Table of contents

- [Product overview](#product-overview)
- [Core capabilities](#core-capabilities)
- [Page showcase](#page-showcase)
- [Navigation and route map](#navigation-and-route-map)
- [Data and permission model](#data-and-permission-model)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Running the application](#running-the-application)
- [Useful scripts](#useful-scripts)
- [Internationalization](#internationalization)
- [Design system and accessibility](#design-system-and-accessibility)
- [Screenshots](#screenshots)
- [Security notes](#security-notes)
- [Known limitations and next steps](#known-limitations-and-next-steps)

---

## Product overview

Planora is organized around three concepts:

1. **Workspaces** — isolated team environments that contain members, roles, projects, tasks, milestones, tags, activity, and capacity data.
2. **Projects** — initiatives with an owner, description, dates, status, team, milestones, and tasks.
3. **Tasks** — actionable work items with statuses, priorities, dates, assignees, tags, and descriptions.

A signed-in user first chooses a workspace. From there, the application provides an overview dashboard, project directory, project workspace, and team-management area. The selected workspace is preserved in the URL using the `workspace` query parameter.

The interface is deliberately light and scannable: white cards, thin borders, generous spacing, green action states, accessible focus styles, and no unnecessary visual noise.

---

## Core capabilities

### Workspace management

- Create a workspace after signing up.
- Select among all active workspaces associated with the current user.
- Carry the selected workspace across the authenticated navigation.
- Delete a workspace through a confirmation flow that requires typing its exact name.
- Protect the workspace owner from accidental removal.

### Authentication

- Sign up with full name, email, password, and password confirmation.
- Sign in with email and password.
- Preserve a safe relative `next` path for invitation and other redirected flows.
- Sign out from the user menu.
- Delete an account after password re-authentication.
- Use Supabase Auth cookies with the Next.js server and browser clients.

### Project management

- Create projects with a name, description, dates, owner, and team members.
- View active projects as progress cards.
- Calculate project progress from task status rather than storing a second mutable counter.
- Edit project metadata and team membership.
- Delete projects through an explicit name-confirmation flow.

### Task management

- Create, edit, and delete tasks.
- Set task title, description, start date, due date, priority, status, and assignee.
- Search task titles, descriptions, and tags.
- Filter tasks by workflow status and priority.
- Change task status directly from the list or by moving it in the Kanban board.
- Inspect the same work through four views:
  - Task list
  - Gantt timeline
  - Calendar
  - Kanban board

### Team and permissions

- View active workspace members and pending invitations.
- Invite collaborators by email.
- Assign workspace roles and permissions.
- Create, rename, and remove eligible custom roles.
- Display the weekly task-assignment heatmap.
- Restrict project, task, member, and role operations according to workspace capabilities.

### Reporting and visibility

- Overview metrics for completed tasks, projects, in-progress tasks, and tasks due soon.
- Status distribution across the selected workspace.
- Workload against configured member capacity.
- Recent activity feed.
- Project health summary, team, milestones, and activity.

---

## Page showcase

The sections below describe what each page does. Screenshot placeholders are intentionally included so images can be added later without changing the documentation structure.

### 1. Landing page — `/landing`

The public entry point introduces Planora and does not require authentication.

**What it shows**

- Planora branding and public navigation.
- Product and benefits sections.
- A dashboard-style product preview built with the application’s own UI primitives.
- Project overview, project timeline, and team workload previews.
- Task-assignment preview showing workload intensity by day.
- Testimonials and a final call to action.
- Language toggle plus links to sign in and create an account.

**How it works**

- The page is rendered as a server component.
- Content is translated through the server translation helper.
- CTA buttons link to `/signup`.
- The `Product` and `Why Planora` links scroll to sections on the same page.
- The preview is illustrative and does not query the database.

**Add a screenshot here**

```md
![Planora landing page](docs/screenshots/landing-page.png)
```

**HTML-style product description**

```html
<section class="planora-page planora-landing">
  <header>Brand · Product · Why Planora · Sign in · Get started</header>
  <main>
    <section class="hero">
      <p>Calm project management for busy teams</p>
      <h1>Make progress feel lighter.</h1>
      <p>Projects, priorities, and people in one clear workspace.</p>
      <a href="/signup">Start planning for free</a>
      <a href="#product">See how it works</a>
      <div class="product-preview">Overview dashboard preview</div>
    </section>
    <section id="why-planora">Clear visibility · Less context switching · Better balance</section>
    <section id="product">Projects · timelines · assignments · team visibility</section>
    <section class="call-to-action"><a href="/signup">Get started for free</a></section>
  </main>
</section>
```

### 2. Sign-up page — `/signup`

The sign-up page creates a Supabase Auth account.

**User flow**

1. Enter full name, email, password, and password confirmation.
2. Submit the form.
3. The client calls `supabase.auth.signUp` and stores the full name in user metadata.
4. If email confirmation is enabled and no session is returned, the page asks the user to check their email.
5. If a session is returned, the user is sent to `/workspaces` or the validated relative `next` path.

The form includes password visibility toggles, client-side password matching, loading feedback, translated labels, and error/status messages.

**Add a screenshot here**

```md
![Planora sign-up page](docs/screenshots/sign-up.png)
```

### 3. Sign-in page — `/signin`

The sign-in page authenticates an existing user with Supabase.

**User flow**

1. Enter email and password.
2. Submit the form.
3. The client calls `supabase.auth.signInWithPassword`.
4. On success, the user is sent to `/workspaces` or a safe relative `next` path.
5. Authenticated users visiting this page are redirected to `/workspaces`.

**Add a screenshot here**

```md
![Planora sign-in page](docs/screenshots/sign-in.png)
```

### 4. Workspace selector — `/workspaces`

This is the first authenticated page after sign-in.

**What it shows**

- Current user menu and sign-out control.
- All active workspaces where the user has an active membership.
- A workspace creation form.
- Empty state guidance when the user has no workspace yet.

Selecting a workspace sends the user into the application with the workspace identifier in the URL.

**Add a screenshot here**

```md
![Planora workspace selector](docs/screenshots/workspaces.png)
```

### 5. Overview dashboard — `/overview?workspace=<workspace-id>`

The overview is the workspace-level dashboard.

**What it shows**

- Completed task count.
- Active project count.
- In-progress task count.
- Tasks due in the next seven days.
- Status overview segmented by completed, in-progress, and todo work.
- Team workload based on estimated task minutes and member capacity.
- Recent activity from the selected workspace.
- Owner-only danger zone for deleting the workspace.

**How it works**

The page resolves the selected workspace with `requireWorkspace`, checks capabilities, and loads data through server-side Supabase queries. Non-privileged members receive data scoped to the projects and tasks they can see.

**Add a screenshot here**

```md
![Planora overview dashboard](docs/screenshots/overview.png)
```

### 6. Projects directory — `/projects?workspace=<workspace-id>`

The projects page lists active projects in the selected workspace.

**What it shows**

- Breadcrumb-style workspace context.
- Project cards with name, status, remaining-task detail, progress, and completed/total task count.
- Empty state when no visible projects exist.
- `New project` form for users with project-management access.

Selecting a card opens the project detail page while preserving the workspace query parameter.

**Add a screenshot here**

```md
![Planora projects directory](docs/screenshots/projects.png)
```

### 7. Project workspace — `/projects/<project-slug>?workspace=<workspace-id>`

The project workspace is the main operational page for a project.

**Project summary**

- Project status badge.
- Workspace context.
- Project description.
- Owner, start date, and target date.
- Team avatar group.
- Project health card with completion percentage and task counts.
- Milestones and recent project activity.

**Task controls**

- Search tasks.
- Filter by status.
- Filter by priority.
- Open the add-task modal.
- Edit or delete tasks according to permissions.
- Edit or delete the project according to permissions.

**Task visualization tabs**

| Tab | Purpose |
| --- | --- |
| Task list | Searchable and filterable list with status, priority, assignee, tags, dates, edit, and delete controls. |
| Gantt | Displays tasks as date-range bars; clicking a task opens its editor when permitted. |
| Calendar | Displays task intervals and due dates in a calendar layout. |
| Kanban | Groups tasks by workflow status and supports drag-and-drop status updates. |

**Add a screenshot here**

```md
![Project task list](docs/screenshots/project-workspace.png)
![Project Gantt view](docs/screenshots/project-gantt.png)
![Project calendar view](docs/screenshots/project-calendar.png)
![Project Kanban view](docs/screenshots/project-kanban.png)
```

### 8. Team page — `/team?workspace=<workspace-id>`

The team page manages workspace collaboration and shows assignment distribution.

**What it shows**

- Active members with names, email addresses, roles, and membership status.
- Pending invitations.
- Add-member flow that creates an invitation and sends an email through Resend.
- Role-management flow for eligible users.
- Weekly assignment heatmap by team member and day.

Permission-sensitive controls are hidden or restricted when the current user cannot manage members or roles.

**Add a screenshot here**

```md
![Planora team management](docs/screenshots/team.png)
```

### 9. Invitation acceptance — `/accept-invitation?token=<token>`

Invitation links open this page.

- Signed-out users are redirected to sign in while preserving the invitation URL.
- Signed-in users see the invitation explanation and an `Accept invitation` button.
- The server action validates the token, expiration, and authenticated email before creating or reactivating membership.
- A missing token produces an explicit error state.

### 10. Component gallery — `/dev`

`/dev` is a local visual reference for reusable UI components. It uses local preview data and is not part of the authenticated product flow.

It demonstrates buttons, badges, form controls, avatars, progress bars, dashboard cards, Kanban, project details, calendar, Gantt, heatmap, status visualizations, and activity-list patterns.

---

## Navigation and route map

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Redirects to `/landing` or `/workspaces` based on auth state. |
| `/landing` | Public | Product marketing page. |
| `/signin` · `/signup` | Public | Supabase Auth. |
| `/accept-invitation` | Mixed | Accept a workspace invitation after authentication. |
| `/workspaces` | Authenticated | Select or create a workspace. |
| `/overview` | Member | Workspace dashboard. |
| `/projects` | Member | Project directory and creation. |
| `/projects/[projectId]` | Member | Project details and task workspace. |
| `/team` | Member | Members, roles, invitations, heatmap. |
| `/dev` | Public | Component gallery (local data). |

## Stack

- Next.js 16 (App Router), React 19, TypeScript 5 (strict, `@/*` alias)
- Supabase JS 2 + `@supabase/ssr` for database, auth, and cookie sessions
- Tailwind CSS 4, Resend for invitation email, ESLint 9, Inter via `next/font`

## Project structure

```text
app/
  landing/ signin/ signup/ accept-invitation/ dev/
  (private)/workspaces/
  (private)/(app)/layout.tsx    # authenticated shell + nav
  (private)/(app)/overview/ projects/ team/
  actions.ts                    # server actions
components/ui/                  # reusable primitives
components/                     # AppNav, AuthForm, ProjectWorkspace, TeamMemberForm...
hooks/                          # client hooks (current user, etc.)
lib/                            # data.ts, workspace.ts, i18n.ts, resend.ts, supabase/
supabase/migrations/            # ordered PostgreSQL migrations
SQL.txt, DB_SCHEMA.md, ACTUAL_DB_SCHEME.md, DESIGN.md
```

## Getting started

### 1. Install

```bash
git clone <YOUR_REPOSITORY_URL> planora
cd planora
npm install
```

Requires Node.js (compatible with the installed Next.js version) and npm. Use npm — the repo ships a `package-lock.json`.

### 2. Configure environment

Create `.env.local` in the project root (never commit it):

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key — safe in the browser only because of RLS. |
| `RESEND_API_KEY` | For invitations | Server-only; never prefix with `NEXT_PUBLIC_`. |
| `RESEND_FROM_EMAIL` | Optional | Defaults to `Planora <onboarding@resend.dev>`. |
| `NEXT_PUBLIC_APP_URL` | Recommended | Base URL for invitation links. `APP_URL` is the fallback. |

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
RESEND_API_KEY=re_your_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Restart the dev server after changing env vars.

### 3. Set up Supabase

1. Create a Supabase project and enable the email/password provider.
2. In the SQL editor, apply the migrations in `supabase/migrations/` in filename order (`20260831_...` → latest). For a brand-new project, `SQL.txt` is the consolidated schema reference.
3. Set the auth Site URL to `http://localhost:3000` for development; add your deployed URL later.
4. Sign up through the app and verify the profile trigger, then create a workspace and verify the seeded roles, statuses, tags, and membership.

For production email, verify a sending domain in Resend and set `RESEND_FROM_EMAIL=Planora <invitations@your-domain.com>`.

### 4. Run

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run start   # serve the build
npm run lint
npx tsc --noEmit   # type-check (no dedicated script)
```

## Notes

- **i18n** — English (`en`, default) and Italian (`it`). Locale lives in the `planora-locale` cookie; add messages to `lib/i18n.ts` and use the translation helpers instead of hard-coding copy.
- **Design** — see `DESIGN.md`. Light mode, borders over shadows, green reserved for primary/positive states, keyboard-visible focus, reduced-motion support. Primitives in `components/ui/`.
- **Security** — RLS is enabled on all application tables; authorization is enforced both in server-side capability checks and database policies. Deletion flows require exact-name confirmation. Never expose service-role keys in client code.
- **Limitations** — no test suite yet; `/dev` is publicly reachable; workload data depends on configured task estimates and member capacity; invitations require signing in with the invited email.
- **License** — none yet; add one before distributing publicly.
