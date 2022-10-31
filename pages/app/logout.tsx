import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Logout() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const session = useSession();

  async function logoutdeal() {
    const { error } = await supabase.auth.signOut();
  }
  logoutdeal();

  useEffect(() => {
    if (session) router.replace("/app/auth");
  }, [session]);
  return (
    <>
      <p>Logout...</p>
    </>
  );
}
