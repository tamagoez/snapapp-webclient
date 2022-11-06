import {
  useSession,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function LoginLead() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const user = useUser();
  useEffect(() => {
    if (!session) router.replace("/app/auth");
    else checkprofile();
  }, [user]);
  async function checkprofile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .limit(1)
        .single();
      if (error) throw error;
      console.dir(data);
      router.replace("/app/dashboard");
      return data;
    } catch (error) {
      console.error(error.message);
      router.replace("/app/profile");
    }
  }
  return (
    <>
      <p>
        Please wait a moment...
        <br />
        We&apos;re going to lead you to page!
      </p>
    </>
  );
}
