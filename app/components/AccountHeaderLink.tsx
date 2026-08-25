"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AccountHeaderLink() {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  useEffect(() => {
    const refresh = () => { void fetch("/api/account/me").then((response) => response.json()).then((data) => {
      setName(data.customer?.name || "");
      setAvatarUrl(data.customer?.avatarUrl || "");
    }).catch(() => undefined); };
    refresh();
    window.addEventListener("huy-account-change", refresh);
    return () => window.removeEventListener("huy-account-change", refresh);
  }, []);
  return <Link className="header-account-link" href="/tai-khoan" aria-label={name ? `Tài khoản ${name}` : "Đăng nhập hoặc đăng ký"}>{avatarUrl ? <Image className="header-account-avatar" src={avatarUrl} alt="" width={28} height={28} unoptimized /> : <span className="header-account-icon" aria-hidden="true" />}<strong>{name ? name.split(" ").at(-1) : "Tài khoản"}</strong></Link>;
}
