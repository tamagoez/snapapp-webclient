import {
  useSession,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { relative } from "path";
import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { IoIosArrowBack, IoIosArrowDown } from "react-icons/io";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
const { DateTime } = require("luxon");
import Twemoji from "react-twemoji";

export default function ChatRoom({}) {
  const router = useRouter();
  const roomid = router.query.roomid as string;
  console.log(`roomid: ${roomid}`);
  const supabase = useSupabaseClient();
  const user = useUser();
  const userid = user?.id;
  const [username, setUsername] = useState("Loading...");
  const [messages, setMessages] = useState([]);

  let notifysound;

  const session = useSession();
  useEffect(() => {
    if (session) console.log("logined");
    else router.replace(`/app/auth?next=${location.pathname}`);
  }, [session]);

  // body をクリックしたときの処理を定義
  if (typeof document !== "undefined")
    document.body.addEventListener(
      "click",
      () => {
        prepareSound();
      },
      { once: true }
    );

  // 既読機構
  //
  const [readid, setReadid] = useState(undefined);
  // if (typeof window !== "undefined") window.addEventListener("scroll", updatereadid, { once: true });
  async function updatereadid() {
    if (readid === undefined) return;
    const toppos = document.getElementById(readid).getBoundingClientRect().top;
    const innerHeight = window.innerHeight;
    console.log(
      `[updatereadid] innerHeight: ${innerHeight} / toppos: ${toppos}`
    );
    if (toppos <= innerHeight) {
      console.log("[updatereadid] Start Update!");
      setReadid(readid + 1);
      console.log(`readid: ${readid}`);
    }
    setTimeout(() => {
      window.addEventListener("scroll", updatereadid, { once: true });
    }, 2000);
  }
  async function fetchReadid(userid) {
    if (!userid) return;
    // const supabase = useSupabaseClient();
    try {
      const { data, error } = await supabase
        .from("personalmember")
        .select("read")
        .eq("userid", userid)
        .eq("roomid", roomid)
        .limit(1)
        .single();
      if (error) throw error;
      console.dir(data);
      setReadid(document.getElementsByClassName("mychatbox")[data.read]);
    } catch (error) {
      console.error(error);
      // alert(error.message);
    }
  }
  //

  // オンライン機構
  const [rawlogin, setRawlogin] = useState();
  const [oid, setOID] = useState(undefined);
  async function getOID() {
    try {
      const { data, error } = await supabase
        .from("personalmember")
        .select("userid")
        .eq("roomid", roomid)
        .neq("userid", userid)
        .limit(1)
        .single();
      if (error) throw error;
      console.dir(data);
      setOID(data.userid);
      return data.userid;
    } catch (error) {
      console.error(error);
      // alert(error.message);
    }
  }
  async function getLastLogin() {
    console.log(`oid: ${oid}`);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("online_at")
        .eq("id", await getOID())
        .limit(1)
        .single();
      if (error) throw error;
      console.dir(data);
      setRawlogin(data.online_at);
    } catch (error) {
      console.error(error.message);
    }
  }
  getLastLogin();
  useEffect(() => {
    const intervalId = setInterval(() => {
      getLastLogin();
    }, 10000);
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  //

  //kari
  const [newMessage, setNewMessage] = useState(null);

  async function fetchMessages(roomid) {
    if (!roomid) return;
    // const supabase = useSupabaseClient();
    try {
      const { data, error } = await supabase
        .from("personalchat")
        .select("id, userid, text, created_at")
        .eq("roomid", roomid)
        .order("id", { ascending: true });
      if (error) throw error;
      console.dir(data);
      return data;
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  ///

  useEffect(() => {
    if (roomid && userid) {
      console.log("useEffect executed");
      getUsername(roomid);
      fetchReadid(userid);
      getOID();
      fetchMessages(roomid).then((data) => {
        setMessages(data);
        console.log("fetched");
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
  }, [roomid, userid]);

  // New message recieved from Postgres
  useEffect(() => {
    if (newMessage) {
      const handleAsync = async () => {
        setMessages(messages.concat(newMessage));
        if (newMessage.userid !== userid) playSound();
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
      if (!newMessage) scroll();
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
  }, [messages, newMessage]);

  const readLog = function () {
    if (document && newMessage) {
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
      sendmessage(
        (document.getElementById("messageinput") as HTMLInputElement).value
      );
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
    setTimeout(() => {
      (document.getElementById("messageinput") as HTMLInputElement).value = "";
      document.getElementById("messageinput").focus;
    }, 20);
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
          font-size: 14px;
        }
        #chatframe {
          margin-bottom: 45px;
        }
        .topnav .lastlogin {
          margin: 0;
          font-size: 8px;
          padding: 0;
        }
      `}</style>
      <audio id="notifysound" preload="auto">
        <source src="/snapchat/recieve.mp3" type="audio/mp3" />
      </audio>
      <div className="topnav">
        <div>
          <p onClick={() => router.back()}>
            <IoIosArrowBack />
          </p>
        </div>
        <div>
          <h4>{username}</h4>
          <p className="lastlogin">
            {onlinecheck(rawlogin) ? (
              <b>オンラインです</b>
            ) : (
              `最終ログイン: ${replacetz(rawlogin)}`
            )}
          </p>
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
        .gobottom {
          width: 40px;
          height: 40px;
          position: fixed;
          z-index: 100;
          bottom: 55px;
          display: inline-flex;
          flex-shrink: 0;
          border-radius: 50%;
          background-color: #f5f3f2;
          border-color: #f5f3f2;
          left: 15px;
          font-size: 40px;
          opacity: 40%;
          padding-top: 3px;
          cursor: pointer;
          color: #aaabab;
        }
        .gobottom:hover {
          animation: onhovergobottom 0.4s ease 1 forwards;
        }
        @keyframes onhovergobottom {
          0% {
            opacity: 40%;
          }
          100% {
            opacity: 100%;
          }
        }
      `}</style>
      <div className="bottominput">
        <textarea
          className="messageinput"
          id="messageinput"
          placeholder={`メッセージを入力
[SHIFT+Enterで送信 / Enterで改行]`}
          onKeyDown={(e) => keyDown(e)}
        />
        <button
          onClick={() => {
            sendmessage(
              (document.getElementById("messageinput") as HTMLInputElement)
                .value
            );
          }}
        >
          <IoSend />
        </button>
      </div>
      <div className="gobottom" onClick={() => scroll()}>
        <IoIosArrowDown />
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
          font-size: 6px;
          padding-left: 4px;
        }
      `}</style>
      <div className="mychatbox" id={messageid}>
        <div className="mychat">
          <div>
            <img
              src="https://pedpmlptqookenixzvqt.supabase.co/storage/v1/object/public/avatars/guest.svg"
              alt="仮アイコン"
            />
          </div>
          <p className="chattext">
            <Twemoji options={{ className: "twemoji" }}>
              <ReactMarkdown
                remarkPlugins={[gfm, remarkBreaks]}
                unwrapDisallowed={false}
                linkTarget="_blank"
              >
                {text}
              </ReactMarkdown>
            </Twemoji>
          </p>
        </div>
      </div>
      <p className="created_at">
        {messageid} / {replacetz(created_at)}
      </p>
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
          font-size: 6px;
          padding-right: 5px;
        }
      `}</style>
      <div className="mychatbox" id={messageid}>
        <div className="mychat">
          <p className="chattext">
            <Twemoji options={{ className: "twemoji" }}>
              <ReactMarkdown
                remarkPlugins={[gfm, remarkBreaks]}
                unwrapDisallowed={false}
                linkTarget="_blank"
              >
                {text}
              </ReactMarkdown>
            </Twemoji>
          </p>
          <div>
            <img src="https://pedpmlptqookenixzvqt.supabase.co/storage/v1/object/public/avatars/guest.svg" />
          </div>
        </div>
      </div>
      <p className="created_at">
        {messageid} / {replacetz(created_at)}
      </p>
    </>
  );
}

function replacetz(time) {
  // const systemtz = DateTime.now().locale;
  // Settings.defaultZone = "system";
  const defaulttime = DateTime.fromISO(time);
  const rezoned = defaulttime.setZone(DateTime.local().zoneName);
  return rezoned.toFormat("FF").toString();
}

function onlinecheck(data) {
  const now = DateTime.fromISO(DateTime.utc());
  const gottime = DateTime.fromISO(data);
  const difftime = now.diff(gottime);
  console.log("[onlinecheck]: " + difftime);
  return difftime < 15000;
}

function prepareSound() {
  const notifysound = document.getElementById(
    "notifysound"
  ) as HTMLAudioElement;
  notifysound.play();
  notifysound.pause();
}

function playSound() {
  const notifysound = document.getElementById(
    "notifysound"
  ) as HTMLAudioElement;
  notifysound.currentTime = 0;
  notifysound.play();
}
