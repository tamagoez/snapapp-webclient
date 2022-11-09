import {
  useSession,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { PersonalList } from "../../../components/snapchat/userlist";

export default function SnapChatPersonalMenu() {
  // const errormsg = console.error.bind(document!);
  const supabase = useSupabaseClient();
  const user = useUser();
  const userid = user?.id;
  const session = useSession();
  const router = useRouter();

  const [adduserid, setAdduserid] = useState("");
  const [addrequest, setAddRequest] = useState("");

  const [roomid, setRoomid] = useState([]);

  async function getRoomid() {
    console.log("[getRoomid]");
    try {
      const { data, error } = await supabase
        .from("personalmember")
        .select("roomid")
        .eq("userid", userid);
      if (error) throw error;
      console.dir(data);
      setRoomid(data);
      console.log(roomid);
    } catch (error) {
      console.error(error.message);
    }
    return roomid;
  }

  useEffect(() => {
    if (session) getRoomid();
  }, [session]);

  async function sendrequest() {
    async function insertsupabase(
      info: string,
      insertdata,
      to: string,
      select: string
    ) {
      console.log(info);
      try {
        const { data, error } = await supabase
          .from(to)
          .insert(insertdata)
          .select();
        if (error) throw error;
        console.dir(data);
        return data[0];
      } catch (error) {
        console.error(error.message);
      }
    }

    // get uuid from handle id
    console.log(`[1/5] Getting UUID from handle_id`);
    let newuseruuid;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle_id", adduserid)
        .limit(1)
        .single();
      if (error) throw error;
      console.log("UUID looks: " + data.id);
      newuseruuid = data.id;
    } catch (error) {
      console.error(error);
      if (error.code === "PGRST116") {
        alert("ユーザーIDが正しくありません");
      } else alert(error.message);
      return error;
    }

    const newroom = await insertsupabase(
      "[2/5] Creating personal room",
      { users: [userid, newuseruuid], permit: false },
      "personalroom",
      "id"
    );
    const newroomid = newroom.id;
    console.log(newroomid);
    insertsupabase(
      `[3/5] Add user ${userid} to ${newroomid}`,
      { userid: userid, invitetype: "send", roomid: newroomid },
      "personalmember",
      ""
    );

    insertsupabase(
      `[4/5] Add user ${newuseruuid} to ${newroomid}`,
      { userid: newuseruuid, invitetype: "recieve", roomid: newroomid },
      "personalmember",
      ""
    );
    insertsupabase(
      `[5/5] Send a request on room ${newroomid}`,
      { userid: userid, roomid: newroomid, text: addrequest },
      "personalchat",
      ""
    );
    alert(
      "個人チャットの準備ができました!\n相手から承諾されるとチャットをすることができるようになります!"
    );
  }

  return (
    <>
      <style jsx>{`
        .acu-parent {
          display: none;
          position: fixed;
          background-color: #f5f3f2;
          z-index: 1000;
          width: 360px;
          height: 500px;
          inset: 0;
          margin: auto;
          padding-left: 3px;
        }
        #add-chat-user {
          display: none;
        }
        #add-chat-user:checked ~ .acu-parent {
          animation: zoomIn 0.2s ease 1 forwards;
          display: block;
        }
        .acu-modal #userid {
          width: 350px;
        }
        .acu-modal label {
          font-size: 12px;
        }
        .acu-modal #requestlabel {
          line-height: 0px;
        }
        .acu-modal #request {
          width: 350px;
          height: 200px;
        }
        .acu-modal button {
          width: 350px;
        }
        @keyframes zoomIn {
          0% {
            transform: scale(0.8);
            opacity: 70%;
          }
          100% {
            transform: scale(1);
            opacity: 100%;
          }
        }
      `}</style>
      <input type="checkbox" id="add-chat-user" />
      <button
        className="acu-button"
        onClick={() =>
          ((
            document.getElementById("add-chat-user") as HTMLInputElement
          ).checked = true)
        }
      >
        <div>
          <span>+ 追加する</span>
        </div>
      </button>
      <button onClick={() => router.push("/app/dashboard")}>
        <span>Dashboardに戻る</span>
      </button>
      <div className="acu-parent">
        <div className="acu-modal">
          <label htmlFor="add-chat-user">
            <MdClose />
          </label>
          <div>
            <label htmlFor="userid">ユーザーIDを入力してください</label>
            <input
              id="userid"
              type="text"
              title="ユーザーIDを入力"
              placeholder="ユーザーIDを入力してください。@マークは不要です。"
              maxLength={30}
              onChange={(e) => setAdduserid(e.target.value)}
              value={adduserid}
            ></input>
          </div>
          <div>
            <label htmlFor="request" id="requestlabel">
              リクエスト内容を入力してください(300字以内)。
              <br />
              リクエスト先に送信されます。
            </label>
            <br />
            <textarea
              id="request"
              title="リクエストを入力"
              placeholder="リクエスト内容を入力してください(300字以内)。リクエスト先に送信されます。"
              maxLength={200}
              onChange={(e) => setAddRequest(e.target.value)}
              value={addrequest}
            ></textarea>
          </div>
          <button onClick={() => sendrequest()}>送信する</button>
        </div>
      </div>
      {roomid.map((x) => (
        <PersonalList key={x.roomid} roomid={x.roomid} myid={userid} />
      ))}
    </>
  );
}
