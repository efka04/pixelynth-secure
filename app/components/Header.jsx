"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import { useRouter } from "next/navigation";
import SearchBar from "./header/SearchBar";
import UserProfile from "./header/UserProfile";
import { useSearch } from "../context/OptimizedSearchContext";
import { useColor } from "../context/ColorContext";
import BurgerMenu from "./header/BurgerMenu";
import Link from "next/link";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setSelectedPeople, setSelectedOrientation, setSelectedSort } = useSearch();
  const { setSelectedColor } = useColor();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
  }, [status, session]);

  const resetFilters = () => {
    setSelectedColor(null);
    setSelectedPeople("all");
    setSelectedOrientation("all");
    setSelectedSort("relevance");
  };

  const handleLogoClick = useCallback(() => {
    resetFilters();
    router.push("/");
  }, [resetFilters, router]);

  const onCreateClick = () => {
      router.push(`/account/${session.user.username}/upload`);
 
  };

  if (!isMounted || status === "loading") {
    return (
      <header className="bg-white  fixed top-1 w-full z-50">
        <nav className="w-full bg-white">
          <div className="flex items-center justify-between px-4 py-2 md:px-6">
            <button onClick={handleLogoClick} className="flex-shrink-0 flex items-center">
              <span className="font-bold text-black text-lg" style={{ fontFamily: 'PPNeueMachina', fontWeight: 800 }}>
                Pixelynth
              </span>
            </button>
            <div className="flex-1 mx-4">
              <SearchBar />
            </div>
            <div className="flex items-center gap-2" style={{ minWidth: "100px" }}>
              <BurgerMenu />
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-black fixed top-0 w-full z-50">
      <nav className="w-full bg-white">
        <div className="flex items-center justify-between px-4 py-2 md:px-6">
          <button onClick={handleLogoClick} className="flex-shrink-0 flex items-center">
            <span className="font-bold text-black text-lg" style={{ fontFamily: 'PPNeueMachina', fontWeight: 800 }}>
              Pixelynth
            </span>
          </button>
          <div className="flex-1 mx-4">
            <SearchBar />
          </div>
          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                <button
                  onClick={onCreateClick}
                  className="bg-black hover:bg-red-900 p-2 text-sm text-white rounded-full"
                >
                  <FaPlus size={16} />
                </button>
                <UserProfile session={session} />
              </>
            ) : (
              <Link
                href="/signin"
                className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Log in
              </Link>
            )}
            <BurgerMenu />
          </div>
        </div>
      </nav>
    </header>
  );
}
