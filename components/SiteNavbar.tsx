"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function SiteNavbar() {
  const pathname = usePathname();

  /*
   * Owner pages have their own ERP sidebar/header.
   * Therefore, don't render the normal website navbar there.
   */
  if (pathname.startsWith("/owner")) {
    return null;
  }

  return <Navbar />;
}