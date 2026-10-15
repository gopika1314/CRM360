import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./Activities.css";

function Activities() {
    const [activities, setActivities] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingActivityId, setEditingActivityId] = useState(null);

    const [formData, setFormData] = useState({
        activity_type: "Call",
        subject: "",
        description: "",
        activity_date: "",
        status: "Pending",
        assigned_employee_id: ""
    });

    const resetForm = () => {
        setFormData({
            activity_type: "Call",
            subject: "",
            description: "",
            activity_date: "",
            status: "Pending",
            assigned_employee_id: ""
        });

        setEditingActivityId(null);
    };

    // =========================
    // GET ACTIVITIES
    // =========================
    const fetchActivities = async () => {
        try {
            const response = await apiFetch("/activities/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch activities");
            }

            const data = await response.json();

            setActivities(
                Array.isArray(data) ? data : []
            );

        } catch (error) {
            console.error("Error fetching activities:", error);
        }
    };

    // =========================
    // GET EMPLOYEES
    // =========================
    const fetchEmployees = async () => {
        try {
            const response = await apiFetch("/employees/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch employees");
            }

            const data = await response.json();

            setEmployees(
                Array.isArray(data) ? data : []
            );

        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    // =========================
    // LOAD DATA
    // =========================
    useEffect(() => {
        fetchActivities();
        fetchEmployees();
    }, []);

    // =========================
    // HANDLE CHANGE
    // =========================
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // =========================
    // EDIT ACTIVITY
    // =========================
    const handleEdit = (activity) => {
        setEditingActivityId(activity.activity_id);

        setFormData({
            activity_type: activity.activity_type || "Call",
            subject: activity.subject || "",
            description: activity.description || "",
            activity_date: activity.activity_date
                ? activity.activity_date.substring(0, 16)
                : "",
            status: activity.status || "Pending",
            assigned_employee_id:
                activity.assigned_employee_id || ""
        });

        setShowForm(true);
    };

    // =========================
    // ADD / UPDATE
    // =========================
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const requestData = {
                ...formData,
                assigned_employee_id: Number(
                    formData.assigned_employee_id
                )
            };

            let response;

            if (editingActivityId) {
                response = await apiFetch(
                    `/activities/${editingActivityId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(requestData)
                    }
                );
            } else {
                response = await apiFetch(
                    "/activities/",
                    {
                        method: "POST",
                        body: JSON.stringify(requestData)
                    }
                );
            }

            if (!response || !response.ok) {
                const errorData =
                    await response.json().catch(() => null);

                console.error(
                    "Backend error:",
                    errorData
                );

                throw new Error(
                    editingActivityId
                        ? "Failed to update activity"
                        : "Failed to create activity"
                );
            }

            alert(
                editingActivityId
                    ? "Activity updated successfully!"
                    : "Activity added successfully!"
            );

            resetForm();
            setShowForm(false);

            await fetchActivities();

        } catch (error) {
            console.error(
                "Error saving activity:",
                error
            );

            alert(
                "Failed to save activity. Check the backend."
            );
        }
    };

    // =========================
    // DELETE
    // =========================
    const handleDelete = async (activityId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this activity?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await apiFetch(
                `/activities/${activityId}`,
                {
                    method: "DELETE"
                }
            );

            if (!response || !response.ok) {
                throw new Error(
                    "Failed to delete activity"
                );
            }

            alert("Activity deleted successfully!");

            await fetchActivities();

        } catch (error) {
            console.error(
                "Error deleting activity:",
                error
            );

            alert("Failed to delete activity.");
        }
    };

    // =========================
    // CANCEL
    // =========================
    const handleCancel = () => {
        setShowForm(false);
        resetForm();
    };

    // =========================
    // SEARCH
    // =========================
    const filteredActivities = activities.filter(
        (activity) => {
            const searchText =
                search.toLowerCase();

            return (
                activity.subject
                    ?.toLowerCase()
                    .includes(searchText) ||

                activity.activity_type
                    ?.toLowerCase()
                    .includes(searchText) ||

                activity.status
                    ?.toLowerCase()
                    .includes(searchText) ||

                activity.description
                    ?.toLowerCase()
                    .includes(searchText)
            );
        }
    );

    return (
        <div className="activities-page">

            <div className="activities-header">

                <div>
                    <h1>Activities</h1>

                    <p>
                        Manage and track your CRM activities
                    </p>
                </div>

                <button
                    className="add-activity-btn"
                    onClick={() => {
                        if (showForm) {
                            handleCancel();
                        } else {
                            resetForm();
                            setShowForm(true);
                        }
                    }}
                >
                    + Add Activity
                </button>

            </div>

            {/* FORM */}

            {showForm && (
                <div className="activity-form-card">

                    <h2>
                        {editingActivityId
                            ? "Edit Activity"
                            : "Add Activity"}
                    </h2>

                    <form onSubmit={handleSubmit}>

                        <div className="activity-form-grid">

                            <div className="activity-form-group">

                                <label>
                                    Activity Type
                                </label>

                                <select
                                    name="activity_type"
                                    value={
                                        formData.activity_type
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                >
                                    <option value="Call">
                                        Call
                                    </option>

                                    <option value="Email">
                                        Email
                                    </option>

                                    <option value="Meeting">
                                        Meeting
                                    </option>

                                    <option value="Follow-up">
                                        Follow-up
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>

                                </select>

                            </div>

                            <div className="activity-form-group">

                                <label>
                                    Subject
                                </label>

                                <input
                                    type="text"
                                    name="subject"
                                    value={
                                        formData.subject
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                            <div className="activity-form-group">

                                <label>
                                    Activity Date
                                </label>

                                <input
                                    type="datetime-local"
                                    name="activity_date"
                                    value={
                                        formData.activity_date
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                            <div className="activity-form-group">

                                <label>
                                    Assigned Employee
                                </label>

                                <select
                                    name="assigned_employee_id"
                                    value={
                                        formData.assigned_employee_id
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                >

                                    <option value="">
                                        Select Employee
                                    </option>

                                    {employees.map(
                                        (employee) => (
                                            <option
                                                key={
                                                    employee.employee_id
                                                }
                                                value={
                                                    employee.employee_id
                                                }
                                            >
                                                {
                                                    employee.employee_name
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                            <div className="activity-form-group">

                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={
                                        formData.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="Pending">
                                        Pending
                                    </option>

                                    <option value="Completed">
                                        Completed
                                    </option>

                                    <option value="Cancelled">
                                        Cancelled
                                    </option>

                                </select>

                            </div>

                        </div>

                        <div className="activity-form-group">

                            <label>
                                Description
                            </label>

                            <textarea
                                name="description"
                                value={
                                    formData.description
                                }
                                onChange={
                                    handleChange
                                }
                                rows="4"
                            />

                        </div>

                        <div className="activity-form-actions">

                            <button
                                type="button"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>

                            <button type="submit">
                                {editingActivityId
                                    ? "Update Activity"
                                    : "Add Activity"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* SEARCH */}

            <div className="activity-search">

                <input
                    type="text"
                    placeholder="Search activities..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                />

            </div>

            {/* TABLE */}

            <div className="activities-table">

                <table>

                    <thead>

                        <tr>
                            <th>ID</th>
                            <th>Type</th>
                            <th>Subject</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>

                    </thead>

                    <tbody>

                        {filteredActivities.length > 0 ? (

                            filteredActivities.map(
                                (activity) => (
                                    <tr
                                        key={
                                            activity.activity_id
                                        }
                                    >

                                        <td>
                                            {
                                                activity.activity_id
                                            }
                                        </td>

                                        <td>
                                            {
                                                activity.activity_type
                                            }
                                        </td>

                                        <td>
                                            {
                                                activity.subject
                                            }
                                        </td>

                                        <td>
                                            {
                                                activity.activity_date
                                                    ? new Date(
                                                          activity.activity_date
                                                      ).toLocaleString()
                                                    : "-"
                                            }
                                        </td>

                                        <td>
                                            <span className="activity-status">
                                                {
                                                    activity.status
                                                }
                                            </span>
                                        </td>

                                        <td>

                                            <button
                                                className="activity-edit"
                                                onClick={() =>
                                                    handleEdit(
                                                        activity
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="activity-delete"
                                                onClick={() =>
                                                    handleDelete(
                                                        activity.activity_id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>
                                )
                            )

                        ) : (

                            <tr>

                                <td colSpan="6">
                                    No activities found
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default Activities;