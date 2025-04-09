'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import UserTag from "@/app/components/UserTag";

function ClientTopContributors({ initialContributors }) {
  const [contributors, setContributors] = useState(initialContributors || []);

  return (
    <>
      <h2 className="text-sm font-medium px-3 py-1 border-[1px] border-black rounded-2xl font-semibold inline-block ">Top Contributors</h2>
      <ul className="space-y-1">
        {contributors.length > 0 ? (
          contributors.map((user, index) => (
            <li
              key={index}
              className="hover:bg-gray-200 rounded-md transition-colors p-2"
            >
              <Link 
                href={`/account/${user.username || user.email}`}
                className="flex items-center w-full cursor-pointer"
              >
                {user.profileImage && (
                  <img 
                    src={user.profileImage} 
                    alt={user.username || 'User'} 
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}
                <span>{user.username || user.email}</span>
                <span className="text-sm text-gray-600 ml-2">- {user.photoCount} images</span>
              </Link>
            </li>
          ))
        ) : (
          <li className="text-gray-500">No contributors found</li>
        )}
      </ul>
    </>
  );
}

export default ClientTopContributors;