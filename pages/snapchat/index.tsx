import Link from "next/link";

export default function SnapChatDashboard() {
  return (
    <>
      <div>
        <p>
          製作時間が全然足りなくてまだ個人チャットしか作れていません。
          <br />
          あとデザインはかろうじて使用できるくらいにしか編集していません。というか編集していません。
        </p>
        <Link href="/snapchat/personal">個人チャット</Link>
      </div>
    </>
  );
}
