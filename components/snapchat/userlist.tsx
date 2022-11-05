import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
export function PersonalList({ roomid, myid }) {
  console.log(`[PersonalList] Got props: roomid: ${roomid}, myid: ${myid}`);
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [username, setUsername] = useState("Loading...");
  async function getUserid() {
    try {
      const { data, error } = await supabase
        .from("personalmember")
        .select("userid")
        .eq("roomid", roomid)
        .neq("userid", myid)
        .limit(1)
        .single();
      if (error) throw error;
      console.dir(data);
      return data.userid;
    } catch (error) {
      console.error(error.message);
    }
  }
  async function getUsername() {
    let userid = await getUserid();
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userid)
        .limit(1)
        .single();
      if (error) throw error;
      console.dir(data);
      setUsername(data.username);
    } catch (error) {
      console.error(error.message);
    }
  }
  getUsername();
  return (
    <>
      <style jsx>{`
        .userlistbox {
          border-radius: 10px 10px 10px 10px;
          background-color: #f5f3f2;
          border-color: #000000;
          cursor: pointer;
          padding-left: 6px;
          border: solid 0.5px;
          display: flex;
          align-items: center;
        }
        .userlistbox:hover {
          background-color: #f5f3f2;
          filter: drop-shadow(10px 10px 4px #d8dbd9);
          z-index: 1;
        }
        .userlistbox img {
          width: 50px;
          height: 50px;
          background-color: #ffffff;
          border: solid 0px #000000;
          border-radius: 50%;
          margin-right: 20px;
          margin-left: 10px;
        }
        .userlistbox h3 {
          margin-top: 20px;
          margin-bottom: 0px;
        }
        .userlistbox p {
          margin-top: 5px;
          margin-bottom: 20px;
        }
      `}</style>
      <div
        onClick={() => router.push(`/snapchat/personal/${roomid}`)}
        className="userlistbox"
      >
        <div>
          <img src="https://pedpmlptqookenixzvqt.supabase.co/storage/v1/object/public/avatars/guest.svg" />
        </div>
        <div>
          <h3>{username}</h3>
          <p>クリックしてチャットを表示</p>
        </div>
      </div>
    </>
  );
}
