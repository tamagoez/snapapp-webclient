import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { IoSend } from "react-icons/io5";

function OpponentChat({ userid, messageid }) {
  return <></>;
}

function MyChat({ userid, messageid }) {
  return <></>;
}

export default function ChatRoom({}) {
  const router = useRouter();
  const roomid = router.query.roomid as string;

  console.log(`roomid: ${roomid}`);
  const supabase = useSupabaseClient();
  const user = useUser();
  const userid = user?.id;
  const [inputvalue, setInputValue] = useState(null);

  console.log("fetching");
  const [messages, setMessages] = useState([]);
  fetchMessages(roomid, (messages) => {
    messages.forEach((x) => setMessages(messages));
  });
  console.dir(messages);
  console.log("finished");

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

  function MessageInput() {
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
            width: 5%;
          }
        `}</style>
        <div className="bottominput">
          <textarea
            className="messageinput"
            placeholder="Send a new message"
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
      <ChatComponent chat={messages} />
      <MessageInput />
    </>
  );
}

function ChatComponent({ chat }) {
  if (!chat) return <p>Loading...</p>;
  return chat.map((x) => (
    <>
      <p>{x.id}</p>
      <p>{x.text}</p>
    </>
  ));
}

async function fetchMessages(roomid, setState) {
  if (!roomid) return;
  const supabase = useSupabaseClient();
  try {
    const { data, error } = await supabase
      .from("personalchat")
      .select("id, userid, text")
      .eq("roomid", roomid);
    if (error) throw error;
    console.dir(data);
    if (setState) setState(data);
    // return data;
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}
