import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  SessionContextProvider,
  Session,
  useSession,
  useUser,
} from "@supabase/auth-helpers-react";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { FeedBack } from "../components/FeedBack";
// import { SetOnline } from "../scripts/userdata";
import "../styles/globals.css";

function MyApp({
  Component,
  pageProps,
}: AppProps<{
  initialSession: Session;
}>) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  const session = useSession();

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
