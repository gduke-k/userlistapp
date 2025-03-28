import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserCard from "../components/UserCard";
import axios from "axios";

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(
    window.innerWidth <= 768 ? 1 : 3
  );
  const navigate = useNavigate();

  // Update number of users per page dynamically based on screen width
  useEffect(() => {
    const updateUsersPerPage = () => {
      setUsersPerPage(window.innerWidth <= 768 ? 1 : 3);
    };
    window.addEventListener("resize", updateUsersPerPage);
    return () => window.removeEventListener("resize", updateUsersPerPage);
  }, []);

  // Check if user is logged in
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/");
    }
  }, [navigate]);

  // Fetch users with applied local edits and deletions
  const fetchUsers = async (currentPage: number) => {
    try {
      const res = await axios.get(
        `https://reqres.in/api/users?page=${currentPage}&per_page=${usersPerPage}`
      );
      if (res.status === 200) {
        let fetchedUsers = res.data.data;
        setTotalPages(res.data.total_pages);

        // Apply local edits and deletions
        const localEdits = JSON.parse(
          localStorage.getItem("editedUsers") || "{}"
        );
        const localDeletions = JSON.parse(
          localStorage.getItem("deletedUsers") || "[]"
        );
        const localUpdatedUsers = JSON.parse(
          localStorage.getItem("updatedUsers") || "[]"
        );

        // Remove locally deleted users
        fetchedUsers = fetchedUsers.filter(
          (user: any) => !localDeletions.includes(user.id)
        );

        // Apply locally edited users
        fetchedUsers = fetchedUsers.map((user: any) =>
          localEdits[user.id] ? { ...user, ...localEdits[user.id] } : user
        );

        // Merge locally updated users to persist slot-filling after deletion
        if (localUpdatedUsers.length > 0) {
          fetchedUsers = mergeUsers(fetchedUsers, localUpdatedUsers);
        }

        setUsers(fetchedUsers);
      } else {
        console.error("Failed to load users.");
      }
    } catch (error) {
      console.error("Error fetching users.");
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page, usersPerPage]);

  // Merge locally updated users into the fetched users list
  const mergeUsers = (fetchedUsers: any[], updatedUsers: any[]) => {
    const updatedUserIds = updatedUsers.map((u) => u.id);
    const mergedUsers = fetchedUsers.filter(
      (user) => !updatedUserIds.includes(user.id)
    );
    return [...mergedUsers, ...updatedUsers].slice(0, usersPerPage);
  };

  // Fetch additional users to fill empty slots
  const fetchNextUsers = async (neededUsers: number, currentPage: number) => {
    try {
      const res = await axios.get(
        `https://reqres.in/api/users?page=${currentPage + 1}&per_page=${usersPerPage}`
      );
      if (res.status === 200 && res.data.data.length > 0) {
        return res.data.data.slice(0, neededUsers);
      }
      return [];
    } catch (error) {
      console.error("Error fetching next users.");
      return [];
    }
  };

  // Handle user deletion and shift next user(s) to fill empty slots
  const handleDeleteLocal = async (id: number) => {
    let updatedUsers = users.filter((u) => u.id !== id);

    // Check if we need to fill empty slots with new users
    if (updatedUsers.length < usersPerPage && page < totalPages) {
      const neededUsers = usersPerPage - updatedUsers.length;
      const nextUsers = await fetchNextUsers(neededUsers, page);
      updatedUsers = [...updatedUsers, ...nextUsers];
    }

    // Limit the length to `usersPerPage` after filling up
    updatedUsers = updatedUsers.slice(0, usersPerPage);

    // Save updated users to localStorage to persist after page change
    localStorage.setItem("updatedUsers", JSON.stringify(updatedUsers));

    // Update the state
    setUsers(updatedUsers);

    // Save deleted user locally
    const deletedUsers = JSON.parse(
      localStorage.getItem("deletedUsers") || "[]"
    );
    localStorage.setItem(
      "deletedUsers",
      JSON.stringify([...deletedUsers, id])
    );

    // Handle edge case: Move to previous page if no users remain on current page
    if (updatedUsers.length === 0 && page > 1) {
      setPage(page - 1);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="container">
      <h2>User List</h2>
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>

      <div className="user-list">
        {users.map((user: any) => (
          <UserCard
            key={user.id}
            user={user}
            onDeleteLocal={(id: number) => handleDeleteLocal(id)}
          />
        ))}
      </div>

      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          Previous
        </button>
        <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
