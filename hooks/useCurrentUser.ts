"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserFullName } from "@/lib/user";

export function useCurrentUser() {
  const [name, setName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setName(getUserFullName(data.user));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setName(getUserFullName(session?.user ?? null));
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  return { name };
}
