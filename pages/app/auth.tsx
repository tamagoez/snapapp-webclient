import { Auth, ThemeSupa } from "@supabase/auth-ui-react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AuthPage() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const query = router.query;
  useEffect(() => {
    if (session)
      if (query.next) router.replace(`/app/loginlead?next=${query.next}`);
      else router.replace("/app/loginlead");
  }, [session, router]);
  return (
    <>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme="default"
        localization={{
          variables: {
            sign_in: {
              email_label: "Email address",
              password_label: "Password",
            },
          },
        }}
      />
    </>
  );
}
