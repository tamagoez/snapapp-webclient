import {
  useSession,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { relative } from "path";
import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { IoIosArrowBack } from "react-icons/io";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
const { DateTime } = require("luxon");

export default function ChatRoom({}) {
  const router = useRouter();
  const roomid = router.query.roomid as string;
  console.log(`roomid: ${roomid}`);
  const supabase = useSupabaseClient();
  const user = useUser();
  const userid = user?.id;
  const [username, setUsername] = useState("Loading...");
  const [messages, setMessages] = useState([]);

  const session = useSession();
  useEffect(() => {
    if (session) console.log("logined");
    else router.replace(`/app/auth?next=${location.pathname}`);
  }, [session]);

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
    if (roomid && userid) {
      getUsername(roomid);
      fetchMessages(roomid).then((data) => {
        setMessages(data);
        console.log(messages);
        scroll();
      });
      supabase.removeAllChannels().then(() =>
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
          .subscribe()
      );
    }
  }, [roomid, userid, supabase]);

  // New message recieved from Postgres
  useEffect(() => {
    if (newMessage) {
      const handleAsync = async () => {
        setMessages(messages.concat(newMessage));
      };
      console.log(newMessage.roomid == roomid);
      if (newMessage.roomid == roomid) handleAsync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage, roomid]);

  const messagesEndRef = useRef(null);
  function scroll() {
    messagesEndRef.current?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  }
  useEffect(() => {
    if (document) {
      //スクロールイベントリスナーに登録
      window.addEventListener("scroll", readLog, { once: true });
      // https://1-notes.com/javascript-event-when-the-element-enters-the-screen-by-scrolling/
      let innerHeight = window.innerHeight;
      let elementslists = document.getElementsByClassName("mychatbox");
      let scrollpos =
        elementslists[elementslists.length - 1]?.getBoundingClientRect().top;
      console.log(`innerHeight: ${innerHeight} / scrollpos: ${scrollpos}`);
      if (scrollpos <= innerHeight) {
        scroll();
      }
    }
  }, [messages]);

  const readLog = function () {
    if (document) {
      // https://1-notes.com/javascript-event-when-the-element-enters-the-screen-by-scrolling/
      let innerHeight = window.innerHeight;
      let elementslists = document.getElementsByClassName("mychatbox");
      let scrollpos =
        elementslists[elementslists.length - 1]?.getBoundingClientRect().top;
      console.log(`innerHeight: ${innerHeight} / scrollpos: ${scrollpos}`);
      if (scrollpos <= innerHeight) {
        console.log(newMessage.id);
      }
    }
  };

  async function getUsername(roomid) {
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
    if (ouserid) {
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
  }

  const [inputvalue, setInputValue] = useState("");
  const keyDown = (event) => {
    // Watch for enter key
    if (event.shiftKey && event.key === "Enter") {
      console.log(`Shift + Enter`);
      sendmessage(inputvalue);
      setTimeout(() => {
        setInputValue("");
        document.getElementById("messageinput").focus;
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
        .topnav {
          display: flex;
          align-items: center;
          position: fixed;
          top: 0;
          height: 40px;
          width: 100%;
          background-color: #eeeeee;
          opacity: 90%;
          padding-left: 5px;
        }
        .topnav p {
          margin: 0;
          font-size: 20px;
          padding-left: 4px;
          padding-right: 4px;
          cursor: pointer;
        }
        .topnav h4 {
          margin: 0;
        }
        #chatframe {
          margin-bottom: 45px;
        }
      `}</style>
      <div className="topnav">
        <div>
          <p onClick={() => router.back()}>
            <IoIosArrowBack />
          </p>
        </div>
        <div>
          <h4>{username}</h4>
        </div>
      </div>
      <div id="chatframe">
        {messages.map((x) => (
          <ChatComponent x={x} userid={userid} key={x.key} />
        ))}
      </div>
      <div ref={messagesEndRef} style={{ height: 0 }} id="scrollpos" />
      <style jsx>{`
        .bottominput {
          position: fixed;
          bottom: -2px;
          display: flex;
          width: 100%;
          height: 47px;
          background-color: #eeeeee;
        }
        .messageinput {
          width: 95%;
          border: 1px solid #cccccc;
          border-radius: 5px 5px 5px 5px;
          resize: none;
          font-size: 14px;
        }
        .messageinput:focus {
          border: 2px solid #0000ff;
          outline: 0;
          font-size: 16px;
        }
        .bottominput button {
          width: 7%;
          min-width: 45px;
          border: 1px solid #cccccc;
          border-radius: 5px 5px 5px 5px;
        }
      `}</style>
      <div className="bottominput">
        <textarea
          className="messageinput"
          id="messageinput"
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
              document.getElementById("messageinput").focus;
            }, 20);
          }}
        >
          <IoSend />
        </button>
      </div>
    </>
  );
}

function ChatComponent({ x, userid }) {
  // console.dir(x);
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
          align-items: center;
        }
        .mychat img {
          width: 40px;
          height: 40px;
          background-color: #ffffff;
          border: solid 0px #000000;
          border-radius: 50%;
        }
        .chattext {
          background-color: #eeeeee;
          margin-right: 10px;
          border-radius: 0px 12px 12px 12px;
          padding-right: 8px;
          padding-left: 8px;
          margin-block-end: 0;
        }
        .created_at {
          margin: 0;
          font-size: 5px;
        }
      `}</style>
      <div className="mychatbox">
        <div className="mychat">
          <div>
            <img
              src="https://pedpmlptqookenixzvqt.supabase.co/storage/v1/object/public/avatars/guest.svg"
              alt="仮アイコン"
            />
          </div>
          <p className="chattext">
            <ReactMarkdown
              remarkPlugins={[gfm, remarkBreaks]}
              unwrapDisallowed={false}
              linkTarget="_blank"
            >
              {text}
            </ReactMarkdown>
          </p>
        </div>
      </div>
      <p className="created_at">{replacetz(created_at)}</p>
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
          margin: 0;
        }
        .mychat {
          display: inline-flex;
          align-items: center;
        }
        .mychat img {
          width: 40px;
          height: 40px;
          background-color: #ffffff;
          border: solid 0px #000000;
          border-radius: 50%;
        }
        .chattext {
          background-color: #b2dfdb;
          margin-right: 10px;
          border-radius: 12px 0px 12px 12px;
          padding-right: 8px;
          padding-left: 8px;
          margin-block-end: 0;
        }
        .created_at {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          margin: 0;
          font-size: 5px;
          padding-right: 5px;
        }
      `}</style>
      <div className="mychatbox">
        <div className="mychat">
          <p className="chattext">
            <ReactMarkdown
              remarkPlugins={[gfm, remarkBreaks]}
              unwrapDisallowed={false}
              linkTarget="_blank"
            >
              {text}
            </ReactMarkdown>
          </p>
          <div>
            <img src="https://pedpmlptqookenixzvqt.supabase.co/storage/v1/object/public/avatars/guest.svg" />
          </div>
        </div>
      </div>
      <p className="created_at">{replacetz(created_at)}</p>
    </>
  );
}

function replacetz(time) {
  // const systemtz = DateTime.now().locale;
  // Settings.defaultZone = "system";
  const defaulttime = DateTime.fromISO(time);
  const rezoned = defaulttime.setZone(DateTime.local().zoneName);
  return rezoned.toFormat("ff").toString();
}
