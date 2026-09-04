"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteUser } from "@/app/actions";
import { DeletionConfirmation } from "@/components/DeletionConfirmation";
import { Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const items = [
  { href: "/overview", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/team", label: "Team" },
  { href: "/workspaces", label: "Workspaces" },
];

export function AppNav() {
  const pathname = usePathname();
  const workspaceQuery = new URLSearchParams(useSearchParams().toString());
  const workspace = workspaceQuery.get("workspace");
  const query = workspace ? `?workspace=${encodeURIComponent(workspace)}` : "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { name } = useCurrentUser();
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (isLoggingOut) router.replace("/landing");
  }, [isLoggingOut, router]);

  useEffect(() => {
    items.forEach((item) => router.prefetch(`${item.href}${query}`));
  }, [query, router]);

  useEffect(() => {
    const closeProfileMenu = (event: PointerEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeProfileMenu);
    return () => document.removeEventListener("pointerdown", closeProfileMenu);
  }, []);

  async function handleDeleteAccount(password: string) {
    setIsDeletingAccount(true);
    setDeleteError("");
    try {
      await deleteUser({ password });
      setProfileOpen(false);
      setIsLoggingOut(true);
    } catch (actionError) {
      setDeleteError(
        actionError instanceof Error
          ? actionError.message
          : "Account could not be deleted.",
      );
      setIsDeletingAccount(false);
    }
  }

  function openAccountDeletion() {
    setDeletePassword("");
    setDeleteError("");
    setProfileOpen(false);
    setDeleteAccountOpen(true);
  }

  function closeAccountDeletion() {
    if (isDeletingAccount) return;
    setDeleteAccountOpen(false);
    setDeletePassword("");
    setDeleteError("");
  }

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav
      className="border-b border-border bg-surface"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-10">
        <div className="flex items-center gap-8">
          <Link
            href={`/workspaces`}
            className="text-xl font-semibold tracking-tight transition-colors duration-120 ease-out hover:text-accent sm:text-2xl"
            aria-label="Planora overview"
          >
            planora<span className="text-accent">.</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                query={query}
              />
            ))}
          </div>
        </div>
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            className="cursor-pointer flex items-center gap-3 rounded-lg p-1 text-left hover:bg-muted"
            aria-label="Open user menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
          >
            <Avatar name={name} />
            <span className="hidden text-sm font-medium sm:block">{name}</span>
          </button>
          {profileOpen && (
            <div
              className="absolute right-0 top-12 z-10 w-36 rounded-lg border border-border bg-surface p-1 shadow-[0_8px_24px_rgb(17_24_39_/8%)]"
              role="menu"
            >
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={async () => {
                  setIsLoggingOut(true);
                  setProfileOpen(false);
                  const { error } = await supabase.auth.signOut();
                  if (error) setIsLoggingOut(false);
                }}
                className="cursor-pointer block w-full rounded-md px-3 py-2 text-left text-sm text-secondary hover:bg-muted hover:text-primary disabled:cursor-not-allowed disabled:text-tertiary"
                role="menuitem"
              >
                {isLoggingOut ? "Logging out…" : "Log out"}
              </button>
              <div className="mt-1 border-t border-border pt-1">
                <button
                  type="button"
                  onClick={openAccountDeletion}
                  className="cursor-pointer block w-full rounded-md bg-danger-soft px-3 py-2 text-left text-sm font-medium text-danger transition-colors duration-120 hover:bg-danger hover:text-white"
                  role="menuitem"
                >
                  Delete account
                </button>
              </div>
            </div>
          )}
          <DeletionConfirmation
            open={deleteAccountOpen}
            mode="password"
            entityLabel="account"
            description={
              <>
                Deleting your account permanently removes your profile and
                data. Workspaces where you are the only member are deleted;
                workspaces you own are transferred to the most privileged
                remaining member; you are simply removed from other
                workspaces. This action cannot be undone.
              </>
            }
            confirmation={deletePassword}
            onConfirmationChange={setDeletePassword}
            error={deleteError}
            deleting={isDeletingAccount}
            onClose={closeAccountDeletion}
            onConfirm={handleDeleteAccount}
          />
          <button
            type="button"
            className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-secondary hover:bg-muted hover:text-primary md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" className="text-xl">
              {menuOpen ? "×" : "☰"}
            </span>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-border px-4 py-2 md:hidden">
          {items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              onClick={() => setMenuOpen(false)}
              mobile
              query={query}
            />
          ))}
        </div>
      )}
    </nav>
  );
}

function NavLink({
  item,
  active,
  onClick,
  mobile = false,
  query = "",
}: {
  item: { href: string; label: string };
  active: boolean;
  onClick?: () => void;
  mobile?: boolean;
  query?: string;
}) {
  return (
    <Link
      href={`${item.href}${query}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`${mobile ? "block border-b border-border py-3 last:border-b-0" : "border-b-2 py-5"} text-sm font-medium transition-colors duration-120 ease-out ${active ? "border-accent text-primary" : "border-transparent text-secondary hover:text-primary"}`}
    >
      {item.label}
    </Link>
  );
}
