"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function WorkspaceUserMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  async function logOut() {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setIsLoggingOut(false);
      return;
    }
    router.replace("/landing");
  }

  return <div className="relative mt-5 inline-block" ref={menuRef}><button type="button" className="flex cursor-pointer items-center gap-3 rounded-lg p-1 text-left hover:bg-muted" aria-label="Open user menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}><Avatar name={name} /><span className="text-sm font-medium">{name}</span></button>{open && <div className="absolute left-1/2 top-12 z-10 w-36 -translate-x-1/2 rounded-lg border border-border bg-surface p-1 text-left shadow-[0_8px_24px_rgb(17_24_39_/8%)]" role="menu"><button type="button" disabled={isLoggingOut} onClick={logOut} className="block w-full cursor-pointer rounded-md px-3 py-2 text-sm text-secondary hover:bg-muted hover:text-primary disabled:cursor-not-allowed disabled:text-tertiary" role="menuitem">{isLoggingOut ? "Logging out…" : "Log out"}</button></div>}</div>;
}
