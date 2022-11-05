import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { relative } from "path";
import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import supabase from "../../../utils/supabase";

export default function ChatRoom({}) {
  const router = useRouter();
  const roomid = router.query.roomid as string;
  console.log(`roomid: ${roomid}`);
  const supabase = useSupabaseClient();
  const user = useUser();
  const userid = user?.id;
  const [username, setUsername] = useState("Loading...");
  const [messages, setMessages] = useState([]);

  //kari
  const [newMessage, setNewMessage] = useState(null);

  async function fetchMessages(roomid) {
    if (!roomid) return;
    // const supabase = useSupabaseClient();
    try {
      const { data, error } = await supabase
        .from("personalchat")
        .select("id, userid, text, created_at")
        .eq("roomid", roomid);
      if (error) throw error;
      console.dir(data);
      return data;
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  useEffect(() => {
    if (roomid) {
      getUsername();
      fetchMessages(roomid).then((data) => {
        setMessages(data);
        console.log(messages);
      });
      supabase
        .channel(`public:personalchat:roomid=eq.${roomid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "*", table: "personalchat" },
          (payload) => {
            console.log("Change received!", payload.new);
            setNewMessage(payload.new);
          }
        )
        .subscribe();
    }
  }, [roomid]);

  // New message recieved from Postgres
  useEffect(() => {
    if (newMessage) {
      const handleAsync = async () => {
        setMessages(messages.concat(newMessage));
      };
      handleAsync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage]);

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  }, [messages]);

  async function getUsername() {
    let ouserid;
    try {
      const { data, error } = await supabase
        .from("personalmember")
        .select("userid")
        .eq("roomid", roomid)
        .neq("userid", userid)
        .limit(1)
        .single();
      if (error) throw error;
      ouserid = data.userid;
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", ouserid)
        .limit(1)
        .single();
      if (error) throw error;
      setUsername(data.username);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  function MessageInput({ userid, roomid }) {
    const [inputvalue, setInputValue] = useState("");
    const keyDown = (event) => {
      // Watch for enter key
      if (event.shiftKey && event.key === "Enter") {
        console.log(`Shift + Enter`);
        sendmessage(inputvalue);
        setTimeout(() => {
          setInputValue("");
        }, 20);
      }
    };
    async function sendmessage(value) {
      console.log(`${userid}: ${value} -> ${roomid}`);
      try {
        const { error } = await supabase
          .from("personalchat")
          .insert({ userid: userid, text: value, roomid: roomid });
        if (error) throw error;
      } catch (error) {
        console.error(error);
        alert(`ERROR: ${error.message}`);
      }
    }
    return (
      <>
        <style jsx>{`
          .bottominput {
            position: fixed;
            bottom: 0;
            display: flex;
            width: 100%;
            height: 45px;
          }
          .messageinput {
            width: 95%;
            border: 2px solid #cccccc;
            border-radius: 5px 5px 5px 5px;
            resize: none;
          }
          .messageinput:focus {
            border: 2px solid #0000ff;
            outline: 0;
          }
          .bottominput button {
            width: 7%;
            min-width: 45px;
          }
        `}</style>
        <div className="bottominput">
          <textarea
            className="messageinput"
            placeholder={`メッセージを入力
[SHIFT+Enterで送信 / Enterで改行]`}
            value={inputvalue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => keyDown(e)}
          />
          <button
            onClick={() => {
              sendmessage(inputvalue);
              setTimeout(() => {
                setInputValue("");
              }, 20);
            }}
          >
            <IoSend />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        #chatframe {
          margin-bottom: 45px;
        }
      `}</style>
      <div className="topnav">
        <h4>{username}</h4>
      </div>
      <div id="chatframe">
        {messages.map((x) => (
          <ChatComponent x={x} userid={userid} />
        ))}
      </div>
      <div ref={messagesEndRef} style={{ height: 0 }} />
      <MessageInput userid={userid} roomid={roomid} />
    </>
  );
}

function ChatComponent({ x, userid }) {
  console.dir(x);
  if (x.userid === userid) {
    return (
      <MyChat
        userid={x.userid}
        messageid={x.id}
        text={x.text}
        created_at={x.created_at}
      />
    );
  } else {
    return (
      <OpponentChat
        userid={x.userid}
        messageid={x.id}
        text={x.text}
        created_at={x.created_at}
      />
    );
  }
}

function OpponentChat({ userid, messageid, text, created_at }) {
  return (
    <>
      <style jsx>{`
        .mychatbox {
          width: 100%;
          display: flex;
          justify-content: flex-start;
        }
        .mychat {
          display: inline-flex;
        }
        .mychat img {
          width: 50px;
          height: 50px;
          background-color: #ffffff;
          border: solid 0px #000000;
          border-radius: 50%;
        }
        .chattext {
          background-color: #dfe2ea;
          margin-right: 10px;
        }
        .created_at {
          margin: 0;
          font-size: 5px;
        }
      `}</style>
      <div className="mychatbox">
        <div className="mychat">
          <div>
            <img src="https://pedpmlptqookenixzvqt.supabase.co/storage/v1/object/public/avatars/guest.svg" />
          </div>
          <p className="chattext">{text}</p>
        </div>
      </div>
      <p className="created_at">{created_at}</p>
    </>
  );
}

function MyChat({ userid, messageid, text, created_at }) {
  return (
    <>
      <style jsx>{`
        .mychatbox {
          width: 100%;
          display: flex;
          justify-content: flex-end;
        }
        .mychat {
          display: inline-flex;
        }
        .mychat img {
          width: 50px;
          height: 50px;
          background-color: #ffffff;
          border: solid 0px #000000;
          border-radius: 50%;
        }
        .chattext {
          background-color: #dfe2ea;
          margin-right: 10px;
        }
        .created_at {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          margin: 0;
          font-size: 5px;
        }
      `}</style>
      <div className="mychatbox">
        <div className="mychat">
          <p className="chattext">{text}</p>

          <div>
            <img src="https://pedpmlptqookenixzvqt.supabase.co/storage/v1/object/public/avatars/guest.svg" />
          </div>
        </div>
      </div>
      <p className="created_at">{created_at}</p>
    </>
  );
}
