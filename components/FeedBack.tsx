import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { MdFeedback, MdClose } from "react-icons/md";

export function FeedBack() {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [short, setShort] = useState("");
  const [long, setLong] = useState("");
  const [envdata, setEnvdata] = useState("");
  const [userid, setUserid] = useState(null);

  async function submit() {
    try {
      const { error } = await supabase
        .from("feedback")
        .insert({ short: short, long: long, envdata: envdata, userid: userid });
      if (error) throw error;
      setShort("");
      setLong("");
      setEnvdata("");
      setUserid(null);
    } catch (error) {
      console.error(error.message);
    }
  }
  const versionsha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
  return (
    <>
      <style jsx>{`
        .feedback-button {
          display: inline-flex;
          flex-shrink: 0;
          position: fixed;
          bottom: 60px;
          right: -76px;
          background-color: #f5f3f2;
          border-color: #f5f3f2;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          text-align: cetner;
          border-radius: 7px 0px 0px 7px;
          opacity: 40%;
        }
        .feedback-button:hover {
          animation: slideIn 0.2s ease 1 forwards;
        }
        .feedback-button div {
          display: flex;
          place-items: center;
        }
        .feedback-button span {
          padding-top: 6px;
          font-size: 25px;
        }
        .feedback-button #fbtext {
          padding-top: 0px;
          margin-left: 4px;
          font-size: 15px;
          font-weight: 600;
        }
        .feedback-parent {
          display: none;
          position: fixed;
          background-color: #f5f3f2;
          z-index: 5000;
          width: 360px;
          height: 500px;
          inset: 0;
          margin: auto;
          padding-left: 3px;
        }
        .feedback-modal #long {
          width: 350px;
          height: 200px;
        }
        .feedback-modal #preview {
          width: 350px;
          height: 70px;
        }
        .feedback-modal #short {
          width: 350px;
        }
        .feedback-modal label {
          font-size: 12px;
        }
        #feedback {
          display: none;
        }
        #feedback:checked ~ .feedback-parent {
          animation: zoomIn 0.2s ease 1 forwards;
          display: block;
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
        @keyframes slideIn {
          0% {
            transform: translateX(0px);
            opacity: 40%;
            background-color: #f5f3f2;
            border-color: #f5f3f2;
          }
          100% {
            transform: translateX(-75px);
            color: white;
            background-color: #68666c;
            border-color: #68666c;
            opacity: 100%;
          }
        }
      `}</style>
      <input type="checkbox" id="feedback" />
      <button
        className="feedback-button"
        onClick={() =>
          ((document.getElementById("feedback") as HTMLInputElement).checked =
            true)
        }
      >
        <div>
          <span>
            <MdFeedback />
          </span>
          <span id="fbtext">Feedback</span>
        </div>
      </button>
      <div className="feedback-parent">
        <div className="feedback-modal">
          <label htmlFor="feedback">
            <MdClose />
          </label>
          <div>
            <label>
              ご利用中のバージョン:{" "}
              <b>{versionsha?.substring(0, 7) || "nightly"}</b>
            </label>
          </div>
          <div>
            <label htmlFor="short">簡潔に説明してください(30字以内)</label>
            <input
              id="short"
              type="text"
              title="短い説明"
              placeholder="簡潔に説明してください(30字以内)"
              maxLength={30}
              onChange={(e) => setShort(e.target.value)}
              value={short}
            ></input>
          </div>
          <div>
            <label htmlFor="long">
              発生条件等具体的な説明を入力してください(500字以内)
            </label>
            <br />
            <textarea
              id="long"
              title="詳細"
              placeholder="発生条件等具体的な説明を入力してください(500字以内)"
              maxLength={500}
              onChange={(e) => setLong(e.target.value)}
              value={long}
            ></textarea>
          </div>
          <div>
            <input
              type="checkbox"
              title="使用環境の送信を許可する"
              id="envdata"
              onChange={(e) =>
                e.target.checked
                  ? setEnvdata(
                      `${navigator.platform}; ${navigator.language}; ${navigator.userAgent}`
                    )
                  : setEnvdata("")
              }
            />
            <label htmlFor="envdata">使用環境の送信を許可する</label>
          </div>
          <div>
            <input
              type="checkbox"
              title="ユーザー情報の送信を許可する(ご連絡に使用します)"
              id="userdata"
              disabled={!user?.id}
              onChange={(e) =>
                e.target.checked ? setUserid(user?.id || null) : setUserid(null)
              }
            />
            <label htmlFor="userdata">
              ユーザー情報の送信を許可する(ご連絡に使用します)
            </label>
          </div>
          <div>
            <label>送信される情報</label>
            <br />
            <textarea
              readOnly={true}
              value={`Short\n${short}\n---\nLong\n${long}\n---\nEnv\n${envdata}\n---\nUser\n${userid}`}
              id="preview"
            ></textarea>
          </div>
          <button onClick={() => submit()}>送信する</button>
        </div>
      </div>
    </>
  );
}
