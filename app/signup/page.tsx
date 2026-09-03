import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { createClient } from "@/lib/supabase/server";

type SignUpPageProps = { searchParams: Promise<{ next?: string }> };

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/workspaces");

  const { next } = await searchParams;
  return <AuthForm mode="signup" nextPath={next} />;
}
