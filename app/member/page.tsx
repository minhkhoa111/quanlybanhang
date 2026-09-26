import type { Metadata } from "next";
import AccountPanel from "@/app/tai-khoan/AccountPanel";

export const metadata: Metadata = { title: "Infinity Member" };

export default function MemberPage() {
  return <main className="account-page shell"><AccountPanel /></main>;
}
