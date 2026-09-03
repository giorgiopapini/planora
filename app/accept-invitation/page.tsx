import { redirect } from "next/navigation";
import { acceptWorkspaceInvitation } from "@/app/actions";
import { Button, Card, CardContent } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function AcceptInvitationPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(
      `/signin?next=/accept-invitation${token ? `?token=${encodeURIComponent(token)}` : ""}`,
    );

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <h1 className="text-xl font-semibold">Accept workspace invitation</h1>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Join the workspace associated with this invitation.
          </p>
          {token ? (
            <form action={acceptWorkspaceInvitation} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <Button type="submit" size="lg" className="w-full">
                Accept invitation
              </Button>
            </form>
          ) : (
            <p className="mt-6 text-sm text-danger">
              This invitation link is missing its token.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
