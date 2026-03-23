import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="">
      I am home
      <div className="">
        Click to go to <Link href="/signin">signin</Link>
      </div>
      <div className="">
        Click to go to <Link href="/signup">signup</Link>
      </div>
    </div>
  );
}
