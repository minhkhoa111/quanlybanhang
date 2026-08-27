import type { Metadata } from "next";
import AccountPanel from "./AccountPanel";
export const metadata: Metadata = { title: "Tài khoản | Infinity Company" };
export default function AccountPage() { return <main className="account-page shell"><AccountPanel /></main>; }
