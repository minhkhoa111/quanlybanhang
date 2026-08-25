import type { Metadata } from "next";
import AccountPanel from "./AccountPanel";
export const metadata: Metadata = { title: "Tài khoản | Huy Apple" };
export default function AccountPage() { return <main className="account-page shell"><AccountPanel /></main>; }
