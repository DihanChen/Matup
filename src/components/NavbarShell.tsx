"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

const HIDDEN_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

export default function NavbarShell() {
  const pathname = usePathname();
  const isHidden = HIDDEN_PATHS.has(pathname);

  if (isHidden) return null;

  return <Navbar />;
}
