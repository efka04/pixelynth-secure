"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { FaPlus, FaInstagram, FaPinterest } from "react-icons/fa";
import { IoSearchOutline } from "react-icons/io5";
import { AiOutlineClose } from "react-icons/ai";
import { useRouter } from "next/navigation";
import UserProfile from "./header/UserProfile";
import BurgerMenu from "./header/BurgerMenu";
import Link from "next/link";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const menuRef = useRef(null);

  // Simulate result count for display purposes
  useEffect(() => {
    setIsMounted(true);
    
    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    // Check if we're on a search page to set hasSearched
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/search/photos/')) {
      setHasSearched(true);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogoClick = () => {
    router.push("/");
  };

  const onCreateClick = () => {
    if (session?.user) {
      router.push(`/account/${session.user.username}/upload`);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    setMenuOpen(false);
  };

  // Extremely simplified search input handling
  function handleInputChange(e) {
    setSearchTerm(e.target.value);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {   
      e.preventDefault();
      if (searchTerm.trim()) {
        setHasSearched(true);
        router.push(`/search/photos/${searchTerm.trim()}`);
      }
    }
  }

  function clearSearch() {
    setSearchTerm('');
    setHasSearched(false);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/search/photos/')) {
      router.push('/');
    }
  }

  return (
    <header className="fixed top-2 w-full z-50 px-2 md:px-4">
      <nav className="max-w-7xl mx-auto md:px-4">
        <div className="flex items-center justify-between gap-2 h-12">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button 
              onClick={handleLogoClick} 
              className="bg-white rounded-full h-12 px-4 flex items-center gap-2 hover:bg-gray-100 transition-colors border border-black"
            >
              <span className="font-bold text-black text-lg whitespace-nowrap" style={{ fontFamily: 'Kdam Thmor Pro, sans-serif', fontWeight: 800 }}>
                Pixelynth
              </span>
              <span className="hidden md:block bg-white rounded-full p-1 border border-black">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
          </div>

          {/* Desktop Search bar */}
          <div className="hidden md:block flex-1 mx-2">
            <form onSubmit={(e) => e.preventDefault()} className="relative w-full h-12">
              <div className="bg-white border border-black rounded-full flex items-center w-full h-full overflow-hidden">
                <div className="flex-shrink-0 pl-4">
                  <IoSearchOutline className="text-xl text-gray-700" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className="bg-transparent outline-none w-full h-full px-3 text-sm"
                  aria-label="Search"
                />
                <div className="flex items-center mr-2 h-full">
               
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="bg-white rounded-full p-2 border border-black hover:bg-gray-100 transition-colors"
                      aria-label="Clear search"
                    >
                      <AiOutlineClose className="text-xl" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Mobile Search bar */}
          <div className="flex-1 md:hidden">
            <form onSubmit={(e) => e.preventDefault()} className="relative w-full h-12">
              <div className="bg-white border border-black rounded-full flex items-center w-full h-full overflow-hidden">
                <div className="flex-shrink-0 pl-4">
                  <IoSearchOutline className="text-xl text-gray-700" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className="bg-transparent outline-none w-full h-full px-3 text-sm"
                  aria-label="Search"
                />
                {searchTerm && (
                  <div className="flex items-center mr-2">
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="bg-white rounded-full p-2 border border-black hover:bg-gray-100 transition-colors"
                      aria-label="Clear search"
                    >
                      <AiOutlineClose className="text-xl" />
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
          
          {/* Right section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {session?.user ? (
              <>
                <button
                  onClick={onCreateClick}
                  className="bg-black text-white rounded-full h-12 w-12 flex items-center justify-center hover:bg-gray-800 transition-colors"
                  aria-label="Create new"
                >
                  <FaPlus size={20} />
                </button>
                <div className="h-12 flex items-center">
                  <UserProfile session={session} />
                </div>
              </>
            ) : (
              <Link
                href="/signin"
                className="h-12 px-4 flex items-center text-sm bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Log in
              </Link>
            )}
            
            <div className="h-12 flex items-center">
              <div className="bg-white rounded-full h-12 px-2 md:px-4 border border-black hover:bg-gray-100 transition-colors flex items-center">
                <BurgerMenu />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
