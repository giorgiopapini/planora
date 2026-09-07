import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Progress,
} from "@/components/ui";
import { getServerTranslations } from "@/lib/i18n-server";

type Translate = Awaited<ReturnType<typeof getServerTranslations>>["t"];

const demoPeople = [
  { name: "Alex Morgan" },
  { name: "Jordan Lee" },
  { name: "Sam Rivera" },
  { name: "Taylor Kim" },
];

const demoAssignments = [
  { name: "Alex Morgan", count: 7, capacity: 10 },
  { name: "Jordan Lee", count: 5, capacity: 8 },
  { name: "Sam Rivera", count: 3, capacity: 8 },
];

export default async function LandingPage() {
  const { t } = await getServerTranslations();

  return (
    <main className="min-h-screen overflow-hidden bg-page text-primary">
      <LandingNav t={t} />

      <section className="relative isolate">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(circle_at_50%_0%,var(--accent-soft),transparent_62%)]"
          aria-hidden="true"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-10 lg:pb-28 lg:pt-28">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-accent">
              {t("Calm project management for busy teams")}
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl lg:text-[4.25rem]">
              {t("Make progress feel lighter.")}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-secondary sm:text-lg sm:leading-8">
              {t(
                "Planora brings projects, priorities, and people into one clear workspace, so your team always knows what matters next.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg">{t("Start planning for free")}</Button>
              </Link>
              <Link
                href="#product"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-primary transition-colors duration-120 hover:bg-subtle"
              >
                {t("See how it works")}
                <span aria-hidden="true">↓</span>
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-4">
              <AvatarGroup people={demoPeople} />
              <p className="text-xs leading-5 text-secondary">
                {t("Designed for teams who want less noise")}
                <span className="block text-tertiary">
                  {t("and more momentum.")}
                </span>
              </p>
            </div>
          </div>

          <ProductPreview t={t} />
        </div>
      </section>

      <section
        id="why-planora"
        className="scroll-mt-16 border-y border-border bg-surface"
        aria-label={t("Benefits")}
      >
        <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:px-6 md:grid-cols-3 lg:px-10">
          <BenefitStat
            value={t("1 clear view")}
            detail={t("for every project and priority")}
          />
          <BenefitStat
            value={t("Less context switching")}
            detail={t("from planning to progress")}
            bordered
          />
          <BenefitStat
            value={t("Better balance")}
            detail={t("across every team member")}
          />
        </div>
      </section>

      <section
        id="product"
        className="scroll-mt-16 bg-page px-4 py-24 sm:px-6 lg:px-10 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow={t("A calmer way to work")}
            title={t("Everything your team needs. Nothing it doesn’t.")}
            detail={t(
              "Planora gives your team the structure to move with confidence, without burying the work under layers of process.",
            )}
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            <FeatureCard
              number="01"
              title={t("Plan with clarity")}
              detail={t(
                "Turn goals into organized projects, milestones, and focused tasks your team can actually act on.",
              )}
              icon="path"
            />
            <FeatureCard
              number="02"
              title={t("See the whole picture")}
              detail={t(
                "Keep status, ownership, timelines, and recent activity visible in one shared workspace.",
              )}
              icon="grid"
            />
            <FeatureCard
              number="03"
              title={t("Protect the team’s focus")}
              detail={t(
                "Spot overloaded people early and make thoughtful assignments before work gets stuck.",
              )}
              icon="people"
            />
          </div>
        </div>
      </section>

      <section className="bg-surface px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="text-sm font-medium text-accent">
              {t("Projects, in context")}
            </p>
            <h2 className="mt-5 max-w-lg text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              {t("Move from “what’s happening?” to “here’s what’s next.”")}
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-secondary sm:text-base">
              {t(
                "Give every project a home with clear ownership, simple status, and a timeline that keeps the next milestone in view.",
              )}
            </p>
            <Link
              href="/signup"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-accent-hover transition-colors duration-120 hover:text-accent"
            >
              {t("Bring your projects together")}{" "}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ProjectOverviewPreview t={t} />
        </div>
      </section>

      <section className="bg-page px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <AssignmentPreview t={t} />
          <div className="lg:pl-6">
            <Badge variant="success">{t("People, balanced")}</Badge>
            <h2 className="mt-5 max-w-lg text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              {t("Keep the workload human.")}
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-secondary sm:text-base">
              {t(
                "A busy team is not always a balanced team. See assignments at a glance, catch bottlenecks early, and keep good work moving without burning people out.",
              )}
            </p>
            <div className="mt-7 flex items-center gap-3 text-sm font-medium text-primary">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
                ✓
              </span>
              {t("Make better decisions with shared visibility.")}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow={t("Built to stay out of the way")}
            title={t("Simple enough to start. Thoughtful enough to stay.")}
            detail={t(
              "The best workflow is the one your team actually uses. Planora keeps the interface familiar, the hierarchy clear, and the important details close.",
            )}
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <QuoteCard
              quote={t(
                "Planora gives us the visibility we need without making project management feel like another project.",
              )}
              name="Maya Patel"
              role={t("Product lead")}
            />
            <QuoteCard
              quote={t(
                "The calmest place we have found to see what is moving, what is stuck, and who needs support.",
              )}
              name="Jordan Lee"
              role={t("Creative director")}
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-2xl bg-tint-900 px-6 py-14 text-center sm:px-12 sm:py-20">
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-36 -left-20 h-72 w-72 rounded-full border border-white/10"
              aria-hidden="true"
            />
            <p className="relative text-sm font-medium text-tint-300">
              {t("A better place to begin")}
            </p>
            <h2 className="relative mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              {t("Make room for the work that matters.")}
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl text-sm leading-7 text-tint-100 sm:text-base">
              {t(
                "Start with a clearer view of your projects, your priorities, and your people.",
              )}
            </p>
            <Link href="/signup" className="relative mt-8 inline-flex">
              <Button
                size="lg"
                className="bg-tint-700 text-white hover:bg-tint-500"
              >
                {t("Get started for free")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter t={t} />
    </main>
  );
}

function LandingNav({ t }: { t: Translate }) {
  return (
    <header className="relative z-20 border-b border-border bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/landing" className="text-2xl font-semibold tracking-tight">
          planora<span className="text-accent">.</span>
        </Link>
        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label={t("Landing page")}
        >
          <a
            href="#product"
            className="text-sm font-medium text-secondary transition-colors duration-120 hover:text-primary"
          >
            {t("Product")}
          </a>
          <a
            href="#why-planora"
            className="text-sm font-medium text-secondary transition-colors duration-120 hover:text-primary"
          >
            {t("Why Planora")}
          </a>
          <Link
            href="/signin"
            className="text-sm font-medium text-secondary transition-colors duration-120 hover:text-primary"
          >
            {t("Sign in")}
          </Link>
          <LanguageToggle />
          <Link href="/signup">
            <Button size="sm">{t("Get started")}</Button>
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <Link href="/signup">
            <Button size="sm">{t("Get started")}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function ProductPreview({ t }: { t: Translate }) {
  return (
    <div className="relative mx-auto w-full max-w-2xl lg:ml-auto">
      <div
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-accent-soft/70 blur-2xl"
        aria-hidden="true"
      />
      <Card className="overflow-hidden rounded-2xl border-border-strong bg-surface shadow-[0_24px_60px_rgb(17_24_39_/10%)]">
        <div className="flex h-11 items-center gap-2 border-b border-border bg-subtle px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <div className="ml-4 h-6 flex-1 rounded-md border border-border bg-surface px-3 py-1 text-[10px] text-tertiary">
            app.planora.com / overview
          </div>
        </div>
        <div className="grid min-h-[390px] grid-cols-[48px_1fr] sm:grid-cols-[62px_1fr]">
          <div className="border-r border-border bg-subtle p-3 sm:p-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
              p
            </div>
            <div className="mt-8 space-y-5">
              <MiniNavIcon active />
              <MiniNavIcon />
              <MiniNavIcon />
              <MiniNavIcon />
            </div>
          </div>
          <div className="min-w-0 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] text-secondary">
                  {t("Monday, September 7")}
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                  {t("Good morning")}, Alex
                </h3>
              </div>
              <div className="hidden sm:block">
                <Avatar name="Alex Morgan" size="sm" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              <PreviewMetric label={t("Completed")} value="24" accent />
              <PreviewMetric label={t("In progress")} value="12" />
              <PreviewMetric label={t("Due soon")} value="04" warning />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-xl border border-border p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold">{t("Project health")}</p>
                    <p className="mt-1 text-[10px] text-secondary">
                      {t("Across all projects")}
                    </p>
                  </div>
                  <span className="text-[10px] text-accent">{t("Live")}</span>
                </div>
                <div className="mt-6 flex h-24 items-end gap-2 sm:h-28">
                  {[42, 58, 47, 72, 66, 84, 76, 92, 81, 96].map(
                    (height, index) => (
                      <div
                        key={`project-health-bar-${index}`}
                        className="flex-1 rounded-t-sm bg-tint-100"
                      >
                        <div
                          className={`h-full rounded-t-sm ${index > 6 ? "bg-tint-700" : index > 3 ? "bg-tint-500" : "bg-tint-300"}`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-2 flex justify-between text-[9px] text-tertiary">
                  <span>{t("Aug 31")}</span>
                  <span>{t("Today")}</span>
                </div>
              </div>
              <div className="rounded-xl border border-border p-3 sm:p-4">
                <p className="text-xs font-semibold">{t("Team workload")}</p>
                <p className="mt-1 text-[10px] text-secondary">
                  {t("This week")}
                </p>
                <div className="mt-5 space-y-4">
                  <MiniWorkload name="Alex" value={78} />
                  <MiniWorkload name="Jordan" value={61} />
                  <MiniWorkload name="Sam" value={39} />
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-border p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">{t("Active projects")}</p>
                <span className="text-[10px] text-accent">
                  {t("View all")} →
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MiniProject
                  name={t("Website refresh")}
                  status={t("In progress")}
                  progress={72}
                />
                <MiniProject
                  name={t("Spring campaign")}
                  status={t("On track")}
                  progress={48}
                />
                <MiniProject
                  name={t("Hiring plan")}
                  status={t("Planning")}
                  progress={18}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProjectOverviewPreview({ t }: { t: Translate }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border bg-subtle p-4 sm:p-5">
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-secondary">
              {t("Projects")} / {t("Website refresh")}
            </p>
            <CardTitle className="mt-1">{t("Website refresh")}</CardTitle>
          </div>
          <Badge variant="success">{t("In progress")}</Badge>
        </div>
      </CardHeader>
      <div className="grid gap-0 md:grid-cols-[0.8fr_1.2fr]">
        <div className="border-b border-border p-4 md:border-b-0 md:border-r sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary">
            {t("Project owner")}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar name="Alex Morgan" />
            <div>
              <p className="text-sm font-medium">Alex Morgan</p>
              <p className="text-xs text-secondary">{t("Product design")}</p>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-secondary">{t("Due date")}</p>
              <p className="mt-1 text-sm font-medium">{t("Sep 30, 2026")}</p>
            </div>
            <div>
              <p className="text-[10px] text-secondary">{t("Progress")}</p>
              <p className="mt-1 text-sm font-medium">72%</p>
            </div>
          </div>
          <div className="mt-7 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs text-secondary">{t("Team")}</span>
            <AvatarGroup people={demoPeople.slice(0, 3)} />
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{t("Project timeline")}</p>
              <p className="mt-1 text-xs text-secondary">
                {t("September 1 – 30, 2026")}
              </p>
            </div>
            <span className="text-xs text-accent">{t("Today")}</span>
          </div>
          <div className="mt-7 space-y-5">
            <TimelineRow
              label={t("Discovery and research")}
              range={t("Sep 1 – 5")}
              width="24%"
              color="bg-tint-900"
            />
            <TimelineRow
              label={t("Interface design")}
              range={t("Sep 4 – 11")}
              width="44%"
              color="bg-accent"
            />
            <TimelineRow
              label={t("Build and integration")}
              range={t("Sep 10 – 19")}
              width="56%"
              color="bg-tint-500"
            />
            <TimelineRow
              label={t("Launch")}
              range={t("Sep 22")}
              width="16%"
              color="bg-tint-300"
              milestone
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function AssignmentPreview({ t }: { t: Translate }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
        <div>
          <p className="text-sm font-semibold">{t("Task assignments")}</p>
          <p className="mt-1 text-xs text-secondary">
            {t("Daily workload by team member")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">15</p>
          <p className="text-[10px] text-secondary">
            {t("assigned this week")}
          </p>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-[minmax(112px,0.9fr)_repeat(5,minmax(34px,1fr))] gap-1.5 text-center text-[10px] text-secondary sm:grid-cols-[minmax(150px,1fr)_repeat(5,minmax(42px,1fr))] sm:gap-2">
          <div className="px-2 py-2 text-left font-semibold uppercase tracking-[0.08em]">
            {t("Team member")}
          </div>
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
            <div
              key={day}
              className="py-2 font-semibold uppercase tracking-[0.08em]"
            >
              {t(day)}
            </div>
          ))}
          {demoAssignments.map((person, personIndex) => (
            <div key={person.name} className="contents">
              <div className="flex min-w-0 items-center gap-2 border-t border-border px-1 py-3 text-left sm:px-2">
                <Avatar name={person.name} size="sm" />
                <span className="min-w-0 truncate text-xs font-medium text-primary">
                  {person.name.split(" ")[0]}
                </span>
              </div>
              {[0, 1, 2, 3, 4].map((dayIndex) => {
                const count = Math.max(
                  0,
                  person.count - ((dayIndex + personIndex) % 4),
                );
                return (
                  <div
                    key={`${person.name}-${dayIndex}`}
                    className={`flex items-center justify-center border-t border-border py-2.5 text-xs font-semibold ${assignmentTone(count)}`}
                    title={`${person.name}: ${t("{{count}} assigned tasks", { count })}`}
                  >
                    {count}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-[10px] text-secondary">
          <span className="font-medium text-primary">{t("Tasks per day")}</span>
          <span className="h-4 w-4 rounded-[3px] bg-subtle" />
          <span className="h-4 w-4 rounded-[3px] bg-tint-100" />
          <span className="h-4 w-4 rounded-[3px] bg-tint-300" />
          <span className="h-4 w-4 rounded-[3px] bg-tint-700" />
          <span>{t("Low")}</span>
          <span>{t("High")}</span>
        </div>
      </div>
    </Card>
  );
}

function FeatureCard({
  number,
  title,
  detail,
  icon,
}: {
  number: string;
  title: string;
  detail: string;
  icon: "path" | "grid" | "people";
}) {
  return (
    <Card className="group transition-colors duration-120 hover:border-accent-border">
      <div className="flex items-start justify-between p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <FeatureIcon type={icon} />
        </span>
        <span className="text-xs font-semibold text-tertiary">{number}</span>
      </div>
      <div className="px-6 pb-6">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-secondary">{detail}</p>
      </div>
    </Card>
  );
}

function QuoteCard({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="text-3xl leading-none text-accent">“</div>
      <blockquote className="mt-4 max-w-xl text-lg leading-8 tracking-[-0.01em] text-primary">
        {quote}
      </blockquote>
      <div className="mt-7 flex items-center gap-3 border-t border-border pt-5">
        <Avatar name={name} />
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="mt-0.5 text-xs text-secondary">{role}</p>
        </div>
      </div>
    </Card>
  );
}

function SectionIntro({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-accent">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-5 text-sm leading-7 text-secondary sm:text-base">
        {detail}
      </p>
    </div>
  );
}

function BenefitStat({
  value,
  detail,
  bordered = false,
}: {
  value: string;
  detail: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`py-6 md:px-8 md:py-8 ${bordered ? "border-y border-border md:border-x md:border-y-0" : ""}`}
    >
      <p className="text-sm font-semibold text-primary">{value}</p>
      <p className="mt-1 text-xs text-secondary">{detail}</p>
    </div>
  );
}

function PreviewMetric({
  label,
  value,
  accent = false,
  warning = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-2.5 sm:p-3">
      <div
        className={`mb-2 h-1.5 w-1.5 rounded-full ${warning ? "bg-warning" : accent ? "bg-accent" : "bg-tint-300"}`}
      />
      <p className="text-base font-semibold sm:text-lg">{value}</p>
      <p className="mt-0.5 truncate text-[9px] text-secondary sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}

function MiniWorkload({ name, value }: { name: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[10px]">
        <span className="font-medium">{name}</span>
        <span className="text-secondary">{value}%</span>
      </div>
      <Progress value={value} label={`${name} workload`} />
    </div>
  );
}

function MiniProject({
  name,
  status,
  progress,
}: {
  name: string;
  status: string;
  progress: number;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-subtle p-2.5">
      <p className="truncate text-[10px] font-medium">{name}</p>
      <p className="mt-1 text-[9px] text-secondary">{status}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function TimelineRow({
  label,
  range,
  width,
  color,
  milestone = false,
}: {
  label: string;
  range: string;
  width: string;
  color: string;
  milestone?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(116px,0.9fr)_1.1fr] items-center gap-3 sm:grid-cols-[minmax(150px,0.8fr)_1.2fr] sm:gap-5">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{label}</p>
        <p className="mt-1 text-[10px] text-secondary">{range}</p>
      </div>
      <div className="relative h-2 rounded-full bg-muted">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${color}`}
          style={{ width }}
        />
        {milestone && (
          <span className="absolute right-[15%] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-[2px] bg-accent ring-4 ring-accent-soft" />
        )}
      </div>
    </div>
  );
}

function MiniNavIcon({ active = false }: { active?: boolean }) {
  return (
    <span
      className={`block h-4 w-full rounded ${active ? "bg-accent" : "bg-border-strong/70"}`}
    />
  );
}

function FeatureIcon({ type }: { type: "path" | "grid" | "people" }) {
  if (type === "path") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          d="M5 18.5 9.5 14l3 2.5L19 8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M16 8h3v3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "grid") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path
        d="M3.5 19c.5-3 2.3-4.5 5.5-4.5s5 1.5 5.5 4.5M14 15.5c2.7-.2 4.4 1 5 3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function assignmentTone(count: number) {
  if (count >= 6) return "bg-tint-700 text-white";
  if (count >= 4) return "bg-tint-300 text-tint-900";
  if (count >= 2) return "bg-tint-100 text-tint-900";
  return "bg-subtle text-secondary";
}

function LandingFooter({ t }: { t: Translate }) {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
        <Link href="/landing" className="text-xl font-semibold tracking-tight">
          planora<span className="text-accent">.</span>
        </Link>
        <div className="flex flex-wrap items-center gap-5 text-xs text-secondary">
          <Link
            href="/signin"
            className="transition-colors duration-120 hover:text-primary"
          >
            {t("Sign in")}
          </Link>
          <Link
            href="/signup"
            className="transition-colors duration-120 hover:text-primary"
          >
            {t("Get started")}
          </Link>
          <span className="text-tertiary">{t("Made for better work.")}</span>
        </div>
      </div>
    </footer>
  );
}
