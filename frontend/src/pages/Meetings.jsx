import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./Meetings.css";

function Meetings() {
    const [meetings, setMeetings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState(null);

    const [formData, setFormData] = useState({
        meeting_title: "",
        description: "",
        meeting_date: "",
        meeting_time: "",
        location: "",
        status: "Scheduled",
        employee_id: "",
        customer_id: ""
    });

    const fetchMeetings = async () => {
        try {
            const response = await apiFetch("/meetings/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch meetings");
            }

            const data = await response.json();
            setMeetings(data);
        } catch (error) {
            console.error("Error fetching meetings:", error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await apiFetch("/employees/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch employees");
            }

            const data = await response.json();
            setEmployees(data);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await apiFetch("/customers/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch customers");
            }

            const data = await response.json();
            setCustomers(data);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    useEffect(() => {
        fetchMeetings();
        fetchEmployees();
        fetchCustomers();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.meeting_title.trim()) {
            alert("Please enter meeting title.");
            return;
        }

        if (
            formData.employee_id &&
            !employees.some(
                (employee) =>
                    Number(employee.employee_id) ===
                    Number(formData.employee_id)
            )
        ) {
            alert("Selected employee does not exist.");
            return;
        }

        if (
            formData.customer_id &&
            !customers.some(
                (customer) =>
                    Number(customer.customer_id) ===
                    Number(formData.customer_id)
            )
        ) {
            alert("Selected customer does not exist.");
            return;
        }

        const dataToSend = {
            meeting_title: formData.meeting_title.trim(),
            description: formData.description.trim() || null,
            meeting_date: formData.meeting_date || null,
            meeting_time: formData.meeting_time || null,
            location: formData.location.trim() || null,
            status: formData.status,
            employee_id: formData.employee_id
                ? Number(formData.employee_id)
                : null,
            customer_id: formData.customer_id
                ? Number(formData.customer_id)
                : null
        };

        try {
            const endpoint = editingMeeting
                ? `/meetings/${editingMeeting.meeting_id}`
                : "/meetings/";

            const method = editingMeeting
                ? "PUT"
                : "POST";

            const response = await apiFetch(
                endpoint,
                {
                    method,
                    body: JSON.stringify(dataToSend)
                }
            );

            if (!response) {
                throw new Error("No response from server.");
            }

            if (!response.ok) {
                let errorMessage =
                    "Failed to save meeting.";

                try {
                    const errorData =
                        await response.json();

                    if (errorData.detail) {
                        errorMessage =
                            typeof errorData.detail === "string"
                                ? errorData.detail
                                : JSON.stringify(
                                      errorData.detail
                                  );
                    }
                } catch {
                    errorMessage =
                        `Failed to save meeting. Status: ${response.status}`;
                }

                throw new Error(errorMessage);
            }

            alert(
                editingMeeting
                    ? "Meeting updated successfully!"
                    : "Meeting added successfully!"
            );

            resetForm();
            fetchMeetings();

        } catch (error) {
            console.error(
                "Error saving meeting:",
                error
            );

            alert(error.message);
        }
    };

    const handleEdit = (meeting) => {
        setEditingMeeting(meeting);

        setFormData({
            meeting_title:
                meeting.meeting_title || "",

            description:
                meeting.description || "",

            meeting_date:
                meeting.meeting_date
                    ? meeting.meeting_date.substring(0, 10)
                    : "",

            meeting_time:
                meeting.meeting_time
                    ? meeting.meeting_time.substring(0, 5)
                    : "",

            location:
                meeting.location || "",

            status:
                meeting.status || "Scheduled",

            employee_id:
                meeting.employee_id
                    ? String(meeting.employee_id)
                    : "",

            customer_id:
                meeting.customer_id
                    ? String(meeting.customer_id)
                    : ""
        });

        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this meeting?"
            )
        ) {
            return;
        }

        try {
            const response = await apiFetch(
                `/meetings/${id}`,
                {
                    method: "DELETE"
                }
            );

            if (!response || !response.ok) {
                let errorMessage =
                    "Failed to delete meeting.";

                try {
                    const errorData =
                        await response.json();

                    if (errorData.detail) {
                        errorMessage =
                            errorData.detail;
                    }
                } catch {}

                throw new Error(errorMessage);
            }

            alert(
                "Meeting deleted successfully!"
            );

            fetchMeetings();

        } catch (error) {
            console.error(
                "Error deleting meeting:",
                error
            );

            alert(error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            meeting_title: "",
            description: "",
            meeting_date: "",
            meeting_time: "",
            location: "",
            status: "Scheduled",
            employee_id: "",
            customer_id: ""
        });

        setEditingMeeting(null);
        setShowForm(false);
    };

    const getEmployeeName = (id) => {
        const employee = employees.find(
            (emp) =>
                Number(emp.employee_id) ===
                Number(id)
        );

        return employee
            ? employee.employee_name
            : "-";
    };

    const getCustomerName = (id) => {
        const customer = customers.find(
            (customer) =>
                Number(customer.customer_id) ===
                Number(id)
        );

        return customer
            ? customer.customer_name
            : "-";
    };

    return (
        <div className="meetings-page">

            <div className="meetings-header">

                <div>
                    <h1>Meetings</h1>

                    <p>
                        Schedule and manage customer meetings
                    </p>
                </div>

                <button
                    className="add-meeting-btn"
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                >
                    + Add Meeting
                </button>

            </div>

            {showForm && (
                <div className="meeting-form-card">

                    <h2>
                        {editingMeeting
                            ? "Edit Meeting"
                            : "Add Meeting"}
                    </h2>

                    <form onSubmit={handleSubmit}>

                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    Meeting Title
                                </label>

                                <input
                                    type="text"
                                    name="meeting_title"
                                    value={
                                        formData.meeting_title
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Location
                                </label>

                                <input
                                    type="text"
                                    name="location"
                                    value={
                                        formData.location
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>

                        </div>

                        <div className="form-group">

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
                            />

                        </div>

                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    Date
                                </label>

                                <input
                                    type="date"
                                    name="meeting_date"
                                    value={
                                        formData.meeting_date
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Time
                                </label>

                                <input
                                    type="time"
                                    name="meeting_time"
                                    value={
                                        formData.meeting_time
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>

                        </div>

                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    Employee
                                </label>

                                <select
                                    name="employee_id"
                                    value={
                                        formData.employee_id
                                    }
                                    onChange={
                                        handleChange
                                    }
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

                            <div className="form-group">

                                <label>
                                    Customer
                                </label>

                                <select
                                    name="customer_id"
                                    value={
                                        formData.customer_id
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >

                                    <option value="">
                                        Select Customer
                                    </option>

                                    {customers.map(
                                        (customer) => (
                                            <option
                                                key={
                                                    customer.customer_id
                                                }
                                                value={
                                                    customer.customer_id
                                                }
                                            >
                                                {
                                                    customer.customer_name
                                                }
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                        </div>

                        <div className="form-group">

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

                                <option value="Scheduled">
                                    Scheduled
                                </option>

                                <option value="Completed">
                                    Completed
                                </option>

                                <option value="Cancelled">
                                    Cancelled
                                </option>

                                <option value="Postponed">
                                    Postponed
                                </option>

                            </select>

                        </div>

                        <div className="form-buttons">

                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="save-btn"
                            >
                                {editingMeeting
                                    ? "Update Meeting"
                                    : "Save Meeting"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

            <div className="meetings-card">

                <table className="meetings-table">

                    <thead>

                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Employee</th>
                            <th>Customer</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>

                    </thead>

                    <tbody>

                        {meetings.length === 0 ? (

                            <tr>
                                <td colSpan="9">
                                    No meetings found.
                                </td>
                            </tr>

                        ) : (

                            meetings.map(
                                (meeting) => (
                                    <tr
                                        key={
                                            meeting.meeting_id
                                        }
                                    >

                                        <td>
                                            {
                                                meeting.meeting_id
                                            }
                                        </td>

                                        <td>
                                            {
                                                meeting.meeting_title
                                            }
                                        </td>

                                        <td>
                                            {
                                                meeting.meeting_date
                                            }
                                        </td>

                                        <td>
                                            {
                                                meeting.meeting_time
                                            }
                                        </td>

                                        <td>
                                            {
                                                getEmployeeName(
                                                    meeting.employee_id
                                                )
                                            }
                                        </td>

                                        <td>
                                            {
                                                getCustomerName(
                                                    meeting.customer_id
                                                )
                                            }
                                        </td>

                                        <td>
                                            {
                                                meeting.location
                                            }
                                        </td>

                                        <td>
                                            <span className="meeting-status">
                                                {
                                                    meeting.status
                                                }
                                            </span>
                                        </td>

                                        <td>

                                            <button
                                                className="edit-btn"
                                                onClick={() =>
                                                    handleEdit(
                                                        meeting
                                                    )
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="delete-btn"
                                                onClick={() =>
                                                    handleDelete(
                                                        meeting.meeting_id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>
                                )
                            )
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default Meetings;