import {
  useSession,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
const { DateTime } = require("luxon");

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

// const userid = useUser().id;
export async function SetOnline(userid) {
  const supabase = useSupabaseClient();
  const nowtime = DateTime.now().setZone("utc").toString();
  console.log(`${userid}: Online at ${nowtime}`);
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ online_at: nowtime })
      .eq("id", userid);
    if (error) throw error;
  } catch (error) {
    console.error(error);
    alert(`ERROR: ${error.message}`);
  }
}
