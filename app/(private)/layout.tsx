import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { createClient } from "@/lib/supabase/server";

export default async function PrivateLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/landing");

  return <main className="min-h-screen bg-page"><AppNav />{children}</main>;
}
