import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface UserCardProps {
  user: any;
  onDeleteLocal: (id: number) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onDeleteLocal }) => {
  const navigate = useNavigate();

  // Delete user from backend and update local storage
  const handleDelete = async (id: number) => {
    try {
      const res = await axios.delete(`https://reqres.in/api/users/${id}`);
      if (res.status === 204) {
        onDeleteLocal(id);

        const deletedUsers = JSON.parse(
          localStorage.getItem("deletedUsers") || "[]"
        );
        localStorage.setItem(
          "deletedUsers",
          JSON.stringify([...deletedUsers, id])
        );
      }
    } catch (error) {
      console.error("Error deleting user.");
    }
  };

  return (
    <div className="user-card">
      <img src={user.avatar} alt={`${user.first_name} ${user.last_name}`} />
      <h3>
        {user.first_name} {user.last_name}
      </h3>
      <p>{user.email}</p>
      <button onClick={() => navigate(`/edit/${user.id}`)}>Edit</button>
      <button onClick={() => handleDelete(user.id)}>Delete</button>
    </div>
  );
};

export default UserCard;
