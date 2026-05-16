import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { NextRequest, NextResponse } from "next/server";

function popupHtml(
  origin: string,
  type: "success" | "error",
  destination?: string,
  errorMsg?: string
) {
  const data =
    type === "success"
      ? { type: "oauth:success", destination: destination ?? "/dashboard" }
      : { type: "oauth:error", error: errorMsg ?? "confirmation_failed" };
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");
  const targetOrigin = JSON.stringify(origin).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html>
  <body>
    <script>
      if (window.opener) {
        window.opener.postMessage(${payload}, ${targetOrigin});
      }
      window.close();
    </script>
  </body>
</html>`;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("next") ?? searchParams.get("redirectTo"));
  const isPopup = searchParams.get("popup") === "true";

  // Use the canonical app origin, never the request origin, to prevent
  // Host-header poisoning of redirect and postMessage targets.
  const origin = APP_URL;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if this user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser();
      let destination = next;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("id", user.id)
          .single();

        // New user or incomplete onboarding → wizard
        if (!profile?.onboarding_complete) {
          destination = "/onboarding";
        }
      }

      if (isPopup) {
        return new NextResponse(popupHtml(origin, "success", destination), {
          headers: { "Content-Type": "text/html" },
        });
      }
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  if (isPopup) {
    return new NextResponse(popupHtml(origin, "error", undefined, "confirmation_failed"), {
      headers: { "Content-Type": "text/html" },
    });
  }

  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`);
}
