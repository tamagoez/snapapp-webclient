import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";

export async function GetUsername(userid: string) {
  const session = useSession();
  const supabase = useSupabaseClient();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userid)
      .limit(1)
      .single();
    if (error) throw error;
    console.log(data);
    return data.username;
  } catch (error) {
    console.error(error.message);
  }
}

export async function GetUsericon(userid: string) {}
