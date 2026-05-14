"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User } from "lucide-react";

export function Nav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-30 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
            path === "/" ? "text-teal-brand" : "text-gray-400"
          }`}
        >
          <Home size={22} />
          <span className="text-xs font-medium">Home</span>
        </Link>
        <Link
          href="/profile"
          className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
            path === "/profile" ? "text-teal-brand" : "text-gray-400"
          }`}
        >
          <User size={22} />
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
