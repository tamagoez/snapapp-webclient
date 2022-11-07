import {
  useSession,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { SetOnline } from "../../scripts/userdata";

export default function LoginLead() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    if (!session) router.replace("/app/auth");
    else checkprofile();
    SetOnline();
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
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("next")) {
        router.replace(searchParams.get("next"));
      } else {
        router.replace("/app/dashboard");
      }
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
