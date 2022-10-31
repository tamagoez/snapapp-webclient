import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
const session = useSession();
  const supabase = useSupabaseClient();

export async function GetUsername(userid) {
    try {
        const { data, error } = await supabase
  .from('profiles')
            .select('username')
        if (error) throw error;
        
    } catch (error) {
        console.error(error.message)
        
    }
      
  }