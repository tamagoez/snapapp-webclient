import { useSession, useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import router from "next/router";
import { useEffect, useState } from "react";
import { GetUsername } from "../../scripts/userdata";

export default function Dashboard() {
  const user = useUser();
  const session = useSession();
  // const [username, setUsername] = useState(null);
  useEffect(() => {
    if (session) console.log("logined");
    else router.replace("/app/auth");
  }, [session]);
  return (
    <>
      <h1>ようこそ!</h1>
      <p>
        <Link href="/snapchat">SnapChat</Link>
      </p>
      <p>
        <Link href="/app/profile">プロフィール</Link>
      </p>
      <p>
        <Link href="/app/logout">ログアウト</Link>
      </p>
    </>
  );
}
