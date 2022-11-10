import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  SessionContextProvider,
  Session,
  useSession,
  useUser,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { FeedBack } from "../components/FeedBack";
// import { SetOnline } from "../scripts/userdata";
import "../styles/globals.css";
import "../styles/twemoji.css";
const { DateTime } = require("luxon");
function MyApp({
  Component,
  pageProps,
}: AppProps<{
  initialSession: Session;
}>) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  const session = useSession();
  // const user = useUser();

  async function setonline() {
    const nowtime = DateTime.now().setZone("utc").toString();
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user.id) return;
    console.log(`[setStatus] Setting ${user.id}: ${nowtime}`);
    const { error } = await supabaseClient
      .from("profiles")
      .update({ online_at: nowtime })
      .eq("id", user?.id);
    if (error) console.error(error);
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      setonline();
    }, 10000);
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <Component {...pageProps} />
      <FeedBack />
    </SessionContextProvider>
  );
}
export default MyApp;
