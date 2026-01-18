import Link from "next/dist/client/link";
import React from "react";
import LogoutButton from "./LogoutButton";

const Navbar = () => {
  const session = true; // Placeholder for session management logic
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600">
          Contact Manager
        </Link>
        <div className="flex item-center space-x-4">
          {session ? (
            <>
              <Link href="/contact" className="hover:text-blue-600 mr-8">
                Contacts
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-600">
                Login
              </Link>

              <Link href="/register" className="hover:text-blue-600">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
