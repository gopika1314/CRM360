import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./UserManagement.css";

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const roles = [
        "Super Admin",
        "Company Admin",
        "Manager",
        "Employee"
    ];

    let currentUser = {};

    try {
        currentUser = JSON.parse(
            localStorage.getItem("crm360_user") || "{}"
        );
    } catch {
        currentUser = {};
    }

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");
            setMessage("");

            const response = await apiFetch("/users/");
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.detail || "Failed to load users"
                );
            }

            setUsers(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleRoleChange = (userId, newRole) => {
        setUsers((currentUsers) =>
            currentUsers.map((user) =>
                user.user_id === userId
                    ? {
                        ...user,
                        role: newRole
                    }
                    : user
            )
        );
    };

    const updateRole = async (user) => {
        if (user.user_id === currentUser.user_id) {
            setError("You cannot change your own role.");
            return;
        }

        try {
            setSavingId(user.user_id);
            setMessage("");
            setError("");

            const response = await apiFetch(
                `/users/${user.user_id}/role`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        role: user.role
                    })
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.detail || "Failed to update role"
                );
            }

            setMessage(
                `${user.full_name}'s role has been changed to ${user.role}.`
            );

            await loadUsers();
        } catch (error) {
            setError(error.message);
        } finally {
            setSavingId(null);
        }
    };

    const getRoleClass = (role) => {
        if (role === "Super Admin") {
            return "super-admin";
        }

        if (role === "Company Admin") {
            return "company-admin";
        }

        if (role === "Manager") {
            return "manager";
        }

        return "employee";
    };

    return (
        <div className="user-management-page">

            <div className="user-management-header">

                <div>
                    <span className="page-label">
                        USER MANAGEMENT
                    </span>

                    <h1>Manage User Roles</h1>

                    <p>
                        View CRM users and manage their access roles.
                    </p>
                </div>

                <button
                    className="refresh-users-button"
                    onClick={loadUsers}
                >
                    ↻ Refresh
                </button>

            </div>

            {message && (
                <div className="success-message">
                    ✓ {message}
                </div>
            )}

            {error && (
                <div className="error-message">
                    ⚠ {error}
                </div>
            )}

            <div className="role-info-card">

                <div className="role-info-icon">
                    🔐
                </div>

                <div>
                    <h3>
                        Role-Based Access Control
                    </h3>

                    <p>
                        Super Admin can change user roles.
                        Users must log in again after their role changes.
                    </p>
                </div>

            </div>

            <div className="users-card">

                <div className="users-card-header">

                    <div>
                        <h2>System Users</h2>

                        <span>
                            {users.length} users
                        </span>
                    </div>

                </div>

                {loading ? (

                    <div className="users-loading">
                        <div className="loading-spinner"></div>
                        Loading users...
                    </div>

                ) : users.length === 0 ? (

                    <div className="users-empty">
                        <div className="empty-icon">
                            👤
                        </div>

                        <h3>
                            No users found
                        </h3>

                        <p>
                            There are no registered users in the system.
                        </p>
                    </div>

                ) : (

                    <div className="users-table-container">

                        <table className="users-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Current Role</th>
                                    <th>Change Role</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>

                                {users.map((user) => {

                                    const isCurrentUser =
                                        Number(user.user_id) ===
                                        Number(currentUser.user_id);

                                    return (
                                        <tr
                                            key={user.user_id}
                                        >

                                            <td>
                                                <span className="user-id">
                                                    #{user.user_id}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="user-name-cell">

                                                    <div className="user-avatar">
                                                        {user.full_name
                                                            ?.charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="user-name-info">

                                                        <strong>
                                                            {user.full_name}
                                                        </strong>

                                                        {isCurrentUser && (
                                                            <span className="current-user">
                                                                You
                                                            </span>
                                                        )}

                                                    </div>

                                                </div>
                                            </td>

                                            <td>
                                                <span className="email-text">
                                                    {user.email}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="username-text">
                                                    {user.username}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`role-badge ${getRoleClass(
                                                        user.role
                                                    )}`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>

                                            <td>
                                                <select
                                                    className="role-select"
                                                    value={
                                                        user.role ||
                                                        "Employee"
                                                    }
                                                    onChange={(event) =>
                                                        handleRoleChange(
                                                            user.user_id,
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        isCurrentUser
                                                    }
                                                >
                                                    {roles.map(
                                                        (role) => (
                                                            <option
                                                                key={role}
                                                                value={role}
                                                            >
                                                                {role}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </td>

                                            <td>
                                                <button
                                                    className="save-role-button"
                                                    onClick={() =>
                                                        updateRole(user)
                                                    }
                                                    disabled={
                                                        isCurrentUser ||
                                                        savingId ===
                                                        user.user_id
                                                    }
                                                >
                                                    {savingId ===
                                                    user.user_id
                                                        ? "Saving..."
                                                        : isCurrentUser
                                                            ? "Your Account"
                                                            : "Save Role"}
                                                </button>
                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}

export default UserManagement;