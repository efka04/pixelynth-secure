"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import UserTag from "@/app/components/UserTag"; // Import UserTag component

function TopContributors() {
  const [topContributors, setTopContributors] = useState([]);

  useEffect(() => {
    const fetchTopContributors = async () => {
      try {
        const response = await axios.get("/api/top-contributors"); // Fetch real user data
        setTopContributors(response.data);
      } catch (error) {
        console.error("Error fetching top contributors:", error);
      }
    };

    fetchTopContributors();
  }, []);

  return (
    <div className="md:w-1/3 bg-gray-100  rounded-xl p-8 flex flex-col justify-between items-start text-black py-4 space-y-2">
      <h2 className="text-1xl font-bold">Top Contributors</h2>
      <ul className="space-y-1">
        {topContributors.length > 0 ? (
          topContributors.map((user, index) => (
            <li
              key={index}
              className="hover:bg-gray-100 rounded-md transition-colors p-2 flex items-center"
            >
              <UserTag userEmail={user.email} theme="dark" />
              <span className="text-sm text-gray-600">- {user.photoCount} images</span>
            </li>
          ))
        ) : (
          <li className="text-gray-500"></li>
        )}
      </ul>
    </div>
  );
}

export default TopContributors;
