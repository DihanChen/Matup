"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

const HIDDEN_PATHS = new Set(["/login", "/signup"]);

export default function NavbarShell() {
  const pathname = usePathname();
  const isHidden = HIDDEN_PATHS.has(pathname);

  if (isHidden) return null;

  return <Navbar />;
}
