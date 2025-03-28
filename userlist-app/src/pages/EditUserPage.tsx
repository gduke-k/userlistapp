import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const EditUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState({ first_name: "", last_name: "", email: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`https://reqres.in/api/users/${id}`);
        if (res.status === 200) {
          setUser({
            first_name: res.data.data.first_name,
            last_name: res.data.data.last_name,
            email: res.data.data.email,
          });
        } else {
          console.error("Failed to fetch user details.");
        }
      } catch (error) {
        console.error("Error loading user details.");
      }
    };

    fetchUser();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.put(`https://reqres.in/api/users/${id}`, user);
      if (res.status === 200) {
        const updatedUser = {
          id: Number(id),
          ...user,
          avatar: `https://reqres.in/img/faces/${id}-image.jpg`, // Fake avatar
        };

        // Save updated user locally
        const editedUsers = JSON.parse(
          localStorage.getItem("editedUsers") || "{}"
        );
        if (id) {
          editedUsers[id] = updatedUser;
        } else {
          console.error("Invalid user ID.");
          return;
        }
        localStorage.setItem("editedUsers", JSON.stringify(editedUsers));

        navigate("/dashboard");
        console.log("User updated successfully!");
      }
    } catch (error) {
      console.error("Error updating user.");
    }
  };

  return (
    <div className="form-container">
      <h2>Edit User</h2>
      <form onSubmit={handleUpdate}>
        <input
          type="text"
          value={user.first_name}
          onChange={(e) => setUser({ ...user, first_name: e.target.value })}
          placeholder="First Name"
          required
        />
        <input
          type="text"
          value={user.last_name}
          onChange={(e) => setUser({ ...user, last_name: e.target.value })}
          placeholder="Last Name"
          required
        />
        <input
          type="email"
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          placeholder="Email"
          required
        />
        <div className="button-group">
          <button
            type="submit"
            style={{ width: "100%" }}
            className="full-width-button"
          >
            Update
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{ width: "100%" }}
            className="cancel-button full-width-button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUserPage;
