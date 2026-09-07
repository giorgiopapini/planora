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

![Planora landing page](docs/screenshots/landing-page.png)

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

![Planora sign-up page](docs/screenshots/sign-up.png)

### 3. Sign-in page — `/signin`

The sign-in page authenticates an existing user with Supabase.

**User flow**

1. Enter email and password.
2. Submit the form.
3. The client calls `supabase.auth.signInWithPassword`.
4. On success, the user is sent to `/workspaces` or a safe relative `next` path.
5. Authenticated users visiting this page are redirected to `/workspaces`.

![Planora sign-in page](docs/screenshots/sign-in.png)

### 4. Workspace selector — `/workspaces`

This is the first authenticated page after sign-in.

**What it shows**

- Current user menu and sign-out control.
- All active workspaces where the user has an active membership.
- A workspace creation form.
- Empty state guidance when the user has no workspace yet.

Selecting a workspace sends the user into the application with the workspace identifier in the URL.

**Add a screenshot here**

![Planora workspace selector](docs/screenshots/workspaces.png)

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

![Planora overview dashboard](docs/screenshots/overview.png)

### 6. Projects directory — `/projects?workspace=<workspace-id>`

The projects page lists active projects in the selected workspace.

**What it shows**

- Breadcrumb-style workspace context.
- Project cards with name, status, remaining-task detail, progress, and completed/total task count.
- Empty state when no visible projects exist.
- `New project` form for users with project-management access.

Selecting a card opens the project detail page while preserving the workspace query parameter.

![Planora projects directory](docs/screenshots/projects.png)

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

![Project task list](docs/screenshots/project-workspace.png)
![Project Gantt view](docs/screenshots/project-gantt.png)
![Project calendar view](docs/screenshots/project-calendar.png)
![Project Kanban view](docs/screenshots/project-kanban.png)

### 8. Team page — `/team?workspace=<workspace-id>`

The team page manages workspace collaboration and shows assignment distribution.

**What it shows**

- Active members with names, email addresses, roles, and membership status.
- Pending invitations.
- Add-member flow that creates an invitation and sends an email through Resend.
- Role-management flow for eligible users.
- Weekly assignment heatmap by team member and day.

Permission-sensitive controls are hidden or restricted when the current user cannot manage members or roles.

![Planora team management](docs/screenshots/team.png)

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
| `/landing` | Public | Product marketing and feature overview. |
| `/signin` | Public | Sign in with Supabase Auth. |
| `/signup` | Public | Create a Supabase Auth account. |
| `/accept-invitation` | Mixed | Accept a workspace invitation after authentication. |
| `/workspaces` | Authenticated | Select or create a workspace. |
| `/overview` | Authenticated workspace member | Workspace dashboard. |
| `/projects` | Authenticated workspace member | Project directory and project creation. |
| `/projects/[projectId]` | Authenticated workspace member | Project details and task workspace. |
| `/team` | Authenticated workspace member | Members, roles, invitations, and assignment heatmap. |
| `/dev` | Public local preview | UI component gallery using local data. |

The authenticated pages are wrapped by `app/(private)/(app)/layout.tsx`, which verifies the Supabase user and renders the shared `AppNav`.

---

## Data and permission model

Supabase PostgreSQL stores the application data. The schema is centered on these tables:

- `profiles`
- `workspaces`
- `workspace_roles`
- `workspace_members`
- `workspace_invitations`
- `projects`
- `project_members`
- `workflow_statuses`
- `tasks`
- `task_assignees`
- `task_status_history`
- `tags`
- `task_tags`
- `milestones`
- `activity_events`
- `sprints`, `sprint_tasks`, and `member_capacity` for capacity-related features

Row-level security is enabled for application tables. Workspace access is checked using active membership, while capability helpers distinguish between:

- `owner_like` — workspace ownership, member/role management, project and task management, and workspace deletion.
- `project_manager` — project-scoped management, project and task operations, and limited member management according to the migration rules.
- `normal_user` — visibility according to assignment/project membership and status updates on permitted tasks.

Important authorization rules are implemented twice where appropriate: in application-side capability checks and in database policies/functions. Never rely only on a workspace name, project slug, or query parameter as an authorization boundary.

---

## Technology stack

- **Next.js 16.3.3** with the App Router.
- **React 19.2.8** and React DOM.
- **TypeScript 5** with strict checking and the `@/*` path alias.
- **Supabase JS 2.112.4** for database and authentication access.
- **`@supabase/ssr` 0.12.5** for browser/server clients and cookie-based sessions.
- **Resend 6.25.0** for workspace invitation email delivery.
- **Tailwind CSS 4** through the PostCSS integration.
- **ESLint 9** with the Next.js Core Web Vitals and TypeScript configurations.
- **Inter** loaded with `next/font/google`.

The repository uses `npm` and includes `package-lock.json`; use `npm`, not a different package manager, for reproducible installs.

---

## Project structure

```text
.
├── app/
│   ├── landing/                 # Public marketing page
│   ├── signin/                  # Sign-in page
│   ├── signup/                  # Sign-up page
│   ├── accept-invitation/       # Invitation acceptance
│   ├── (private)/
│   │   ├── page.tsx             # Auth-aware root redirect
│   │   ├── workspaces/           # Workspace selector
│   │   └── (app)/
│   │       ├── layout.tsx       # Authenticated shell and navigation
│   │       ├── overview/        # Dashboard
│   │       ├── projects/        # Project directory and details
│   │       └── team/            # Team management
│   ├── dev/                     # Component gallery
│   ├── actions.ts               # Server actions for mutations
│   ├── globals.css              # Tailwind theme tokens and global styles
│   └── layout.tsx               # Root metadata, font, locale provider
├── components/
│   ├── ui/                      # Reusable UI primitives and visualizations
│   ├── AppNav.tsx               # Authenticated navigation and user menu
│   ├── AuthForm.tsx             # Shared sign-in/sign-up form
│   ├── ProjectWorkspace.tsx     # Project and task interaction surface
│   ├── TeamMemberForm.tsx       # Members, invitations, and roles
│   └── ...
├── hooks/                       # Client hooks such as current-user state
├── lib/
│   ├── data.ts                  # Server-side data queries and mapping
│   ├── workspace.ts             # Workspace resolution and access context
│   ├── i18n.ts                  # English/Italian dictionaries
│   ├── i18n-server.ts           # Server translation helpers
│   ├── resend.ts                # Resend invitation email client
│   └── supabase/                # Browser and server Supabase clients
├── supabase/migrations/         # Ordered PostgreSQL migrations and RPCs
├── SQL.txt                     # Full schema/setup SQL reference
├── DB_SCHEMA.md                 # Proposed schema documentation
├── ACTUAL_DB_SCHEME.md          # Actual schema reference
├── DESIGN.md                    # UI/UX and accessibility rules
├── proxy.ts                     # Supabase session refresh proxy
├── package.json                 # Scripts and dependencies
└── tsconfig.json                # TypeScript configuration
```

---

## Requirements

Before installing, have the following available:

- Node.js compatible with the installed Next.js version.
- npm.
- A Supabase project.
- A Resend account and API key if workspace invitation emails are required.
- A Git client if downloading through Git.

No separate frontend database server is required; Planora connects to Supabase through its URL and public anonymous key.

---

## Installation

### 1. Download the codebase

Clone the repository and enter its directory:

```bash
git clone <YOUR_REPOSITORY_URL> planora
cd planora
```

Alternatively, download the repository archive from your Git provider, extract it, and open a terminal in the extracted project directory.

### 2. Install dependencies

```bash
npm install
```

This uses the committed `package-lock.json` to install the Next.js, React, Supabase, Resend, Tailwind, TypeScript, and ESLint dependencies.

### 3. Create the local environment file

Create a file named `.env.local` in the project root. Do not commit it. The repository ignores `.env*` files by default.

```bash
touch .env.local
```

Add the variables described in the next section.

### 4. Configure Supabase

Create or select a Supabase project, copy its project URL and public anonymous key, then place them in `.env.local`. Apply the database schema and migrations as described in [Supabase setup](#supabase-setup).

### 5. Configure Resend if invitations are needed

Create a Resend API key and add it to `.env.local`. You may use the default Resend testing sender during development, or configure a verified sending domain and set `RESEND_FROM_EMAIL`.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

The application reads the following variables:

| Variable | Required | Where it is used | Example |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser client, server client, and session proxy. | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser client, server client, and session proxy. | `your-public-anon-key` |
| `RESEND_API_KEY` | For invitation email | Server-only Resend client in `lib/resend.ts`. | `re_xxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Optional | Sender address for invitation email. Defaults to `Planora <onboarding@resend.dev>`. | `Planora <hello@example.com>` |
| `NEXT_PUBLIC_APP_URL` | Recommended for invitations | Base URL used to construct invitation links. | `http://localhost:3000` |
| `APP_URL` | Fallback | Used only if `NEXT_PUBLIC_APP_URL` is not set. | `http://localhost:3000` |

Example `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key

# Required for sending workspace invitations
RESEND_API_KEY=re_your_api_key

# Optional while using Resend's default development sender
RESEND_FROM_EMAIL=Planora <onboarding@resend.dev>

# Required/recommended for correct invitation links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Key handling rules

- Never commit `.env.local` or any secret API key.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is designed to be public, but database safety depends on correct Supabase RLS policies; it is not a service-role key.
- Never put a Supabase service-role key in a browser-exposed variable.
- `RESEND_API_KEY` is server-only and must not be prefixed with `NEXT_PUBLIC_`.
- Restart the Next.js server after changing environment variables.

---

## Supabase setup

The repository contains ordered migrations in `supabase/migrations/` and a consolidated SQL reference in `SQL.txt`.

### Recommended setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Apply the SQL/schema in the intended order.
4. Run the migrations in `supabase/migrations/` chronologically by filename, from `20260831_...` through the latest `20260907_...` migration.
5. Confirm that the public tables, functions, triggers, views, and RLS policies were created.
6. Create a test user through the Planora sign-up page.
7. Confirm that a profile row is created by the `auth.users` trigger.
8. Create a workspace and verify that default roles, workflow statuses, tags, membership, and activity are seeded.

If your Supabase project is new, use the consolidated `SQL.txt` as the complete schema reference where appropriate. If the database already contains an earlier version of the schema, prefer applying the ordered migrations so the existing data can be upgraded safely. Review SQL changes before running them in a production database.

### Authentication configuration

In Supabase Authentication settings:

- Enable the email/password provider.
- Configure email confirmation according to the environment.
- Set the local Site URL to `http://localhost:3000` during development.
- Add the deployed application URL when deploying.
- Ensure the confirmation flow returns users to an address served by the application.

### Invitation email configuration

The team invitation action creates a secure invitation record and builds a URL like:

```text
http://localhost:3000/accept-invitation?token=<invitation-token>
```

The recipient must authenticate with the same email address as the invitation before the database RPC accepts membership. Invitation records expire after seven days.

For production email delivery, verify a sending domain in Resend and set, for example:

```dotenv
RESEND_FROM_EMAIL=Planora <invitations@your-domain.com>
```

---

## Running the application

### Development

```bash
npm run dev
```

Then visit:

- `http://localhost:3000/landing` for the marketing page.
- `http://localhost:3000/signup` to create an account.
- `http://localhost:3000/signin` to sign in.
- `http://localhost:3000/dev` to inspect the component gallery.

After authentication, use `/workspaces` to select a workspace. The application will navigate to workspace-scoped pages such as `/overview?workspace=<id>`.

### Production build

```bash
npm run build
npm run start
```

`npm run start` serves the previously generated production build. Make sure production environment variables are available to the process before starting it.

### Linting

```bash
npm run lint
```

### Type checking

There is currently no dedicated `typecheck` script in `package.json`. Run TypeScript directly without emitting files:

```bash
npx tsc --noEmit
```

There is no test script currently defined in `package.json`.

---

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Next.js development server. |
| `npm run build` | Creates a production build. |
| `npm run start` | Serves the production build. |
| `npm run lint` | Runs ESLint. |
| `npx tsc --noEmit` | Type-checks the project without emitting files. |

---

## Internationalization

Planora currently supports:

- English: `en` — default.
- Italian: `it`.

The locale is stored in the `planora-locale` cookie. `LocaleProvider`, `LanguageToggle`, and the server translation helpers provide translated interface text. Add new messages to the dictionaries in `lib/i18n.ts` and use the existing translation helpers instead of hard-coding user-facing copy in new product pages.

---

## Design system and accessibility

The design system is documented in `DESIGN.md` and implemented through Tailwind CSS v4 theme tokens in `app/globals.css`.

Key principles include:

- Light mode with white surfaces and a neutral page background.
- Green reserved for primary, positive, active, and completed states.
- Borders instead of static shadows.
- Responsive layouts from a minimum viewport of 320px.
- Visible keyboard focus using an accent outline.
- Semantic labels and accessible names for controls.
- Dialogs with explicit titles, descriptions, close actions, and confirmation for destructive operations.
- Status communicated with text and values, not color alone.
- Reduced-motion support through `prefers-reduced-motion`.

Reusable primitives live in `components/ui/`, including cards, buttons, inputs, selects, textareas, badges, avatars, progress bars, modals, calendar, Gantt, Kanban, and heatmap components.

---

## Screenshots

Screenshots can be uploaded later and stored under `docs/screenshots/`. Suggested filenames:

```text
docs/screenshots/
├── landing-page.png
├── sign-in.png
├── sign-up.png
├── workspaces.png
├── overview.png
├── projects.png
├── project-workspace.png
├── project-task-list.png
├── project-gantt.png
├── project-calendar.png
├── project-kanban.png
├── team.png
├── accept-invitation.png
└── dev-components.png
```

Once an image is uploaded, replace or keep the corresponding placeholder with standard Markdown:

```md
![Overview dashboard](docs/screenshots/overview.png)
```

For a clickable full-size image:

```md
<a href="docs/screenshots/overview.png">
  <img src="docs/screenshots/overview.png" alt="Planora overview dashboard" width="900">
</a>
```

---

## Security notes

- Authenticated layouts verify the Supabase user before rendering private pages.
- Supabase session cookies are refreshed by `proxy.ts`.
- Workspace and project lookups are scoped to the selected workspace and authenticated membership.
- Database mutations use server actions and protected Supabase functions for sensitive operations.
- Workspace and project deletion require exact-name confirmation.
- Invitation tokens are stored and processed through the database invitation flow rather than trusting an email address alone.
- RLS policies must remain enabled and should be tested whenever schema or access logic changes.
- Do not expose service-role credentials in client code or `NEXT_PUBLIC_*` variables.

Before production deployment, review all RLS policies, Supabase Auth redirect URLs, Resend domain configuration, error logging, rate limits, and the retention policy for account/workspace deletion.

---

## Known limitations and next steps

- There is no automated test suite or test script yet.
- `npm run lint` is available, but CI should also run `npx tsc --noEmit` and `npm run build`.
- The component gallery at `/dev` is publicly reachable unless deployment-level protection is added.
- Workload percentages depend on configured task estimates and member capacity; incomplete capacity data results in zero or limited workload values.
- The current invitation flow requires the recipient to sign in with the invited email address.
- Screenshot assets are not included yet; add them under `docs/screenshots/` using the placeholders above.
- Production deployments should define a real `NEXT_PUBLIC_APP_URL` and a verified Resend sender.

---

## License

No license file is currently included in the repository. Add a license before distributing the project publicly.
