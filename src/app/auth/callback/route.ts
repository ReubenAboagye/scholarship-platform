import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { NextRequest, NextResponse } from "next/server";

function popupHtml(type: "success" | "error", destination?: string, errorMsg?: string) {
  const data =
    type === "success"
      ? `{ type: "oauth:success", destination: "${destination ?? "/dashboard"}" }`
      : `{ type: "oauth:error", error: "${errorMsg ?? "confirmation_failed"}" }`;

  return `<!DOCTYPE html>
<html>
  <body>
    <script>
      if (window.opener) {
        window.opener.postMessage(${data}, "*");
      }
      window.close();
    </script>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("next") ?? searchParams.get("redirectTo"));
  const isPopup = searchParams.get("popup") === "true";

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
        return new NextResponse(popupHtml("success", destination), {
          headers: { "Content-Type": "text/html" },
        });
      }
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  if (isPopup) {
    return new NextResponse(popupHtml("error", undefined, "confirmation_failed"), {
      headers: { "Content-Type": "text/html" },
    });
  }

  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`);
}
