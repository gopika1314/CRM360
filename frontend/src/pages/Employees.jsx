import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./Employees.css";

function Employees() {

    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        company_id: 1,
        employee_name: "",
        employee_code: "",
        email_address: "",
        phone_number: "",
        designation: "",
        department: "",
        status: "Active"
    });

    const fetchEmployees = async () => {
        try {
            setLoading(true);

            const response = await apiFetch("/employees/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch employees");
            }

            const data = await response.json();

            setEmployees(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (error) {
            console.error(
                "Error fetching employees:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setFormData({
            company_id: 1,
            employee_name: "",
            employee_code: "",
            email_address: "",
            phone_number: "",
            designation: "",
            department: "",
            status: "Active"
        });
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();

        try {
            const response = await apiFetch(
                "/employees/",
                {
                    method: "POST",
                    body: JSON.stringify({
                        ...formData,
                        company_id: Number(
                            formData.company_id
                        )
                    })
                }
            );

            if (!response || !response.ok) {
                throw new Error(
                    "Failed to add employee"
                );
            }

            alert(
                "Employee added successfully!"
            );

            resetForm();
            setShowAddForm(false);

            fetchEmployees();

        } catch (error) {
            console.error(
                "Error adding employee:",
                error
            );

            alert(
                "Failed to add employee"
            );
        }
    };

    const handleEdit = (employee) => {

        setEditingEmployee(employee);

        setFormData({
            company_id: employee.company_id,
            employee_name:
                employee.employee_name || "",
            employee_code:
                employee.employee_code || "",
            email_address:
                employee.email_address || "",
            phone_number:
                employee.phone_number || "",
            designation:
                employee.designation || "",
            department:
                employee.department || "",
            status:
                employee.status || "Active"
        });

        setShowAddForm(false);
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();

        try {
            const response = await apiFetch(
                `/employees/${editingEmployee.employee_id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        ...formData,
                        company_id: Number(
                            formData.company_id
                        )
                    })
                }
            );

            if (!response || !response.ok) {
                throw new Error(
                    "Failed to update employee"
                );
            }

            alert(
                "Employee updated successfully!"
            );

            setEditingEmployee(null);
            resetForm();

            fetchEmployees();

        } catch (error) {
            console.error(
                "Error updating employee:",
                error
            );

            alert(
                "Failed to update employee"
            );
        }
    };

    const handleDelete = async (employeeId) => {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this employee?"
            );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await apiFetch(
                `/employees/${employeeId}`,
                {
                    method: "DELETE"
                }
            );

            if (!response || !response.ok) {
                throw new Error(
                    "Failed to delete employee"
                );
            }

            alert(
                "Employee deleted successfully!"
            );

            fetchEmployees();

        } catch (error) {
            console.error(
                "Error deleting employee:",
                error
            );

            alert(
                "Failed to delete employee"
            );
        }
    };

    const handleCancel = () => {
        setEditingEmployee(null);
        setShowAddForm(false);
        resetForm();
    };

    const filteredEmployees =
        employees.filter((employee) => {

            const searchText =
                search.toLowerCase();

            return (
                employee.employee_name
                    ?.toLowerCase()
                    .includes(searchText) ||

                employee.employee_code
                    ?.toLowerCase()
                    .includes(searchText) ||

                employee.email_address
                    ?.toLowerCase()
                    .includes(searchText) ||

                employee.department
                    ?.toLowerCase()
                    .includes(searchText) ||

                employee.designation
                    ?.toLowerCase()
                    .includes(searchText)
            );
        });

    const activeEmployees =
        employees.filter(
            (employee) =>
                employee.status === "Active"
        ).length;

    const inactiveEmployees =
        employees.filter(
            (employee) =>
                employee.status === "Inactive"
        ).length;

    return (
        <div className="employees-page">

            <div className="employees-header">

                <div>
                    <span className="employees-label">
                        TEAM MANAGEMENT
                    </span>

                    <h1>
                        Employees
                    </h1>

                    <p>
                        Manage your team members and employee records.
                    </p>
                </div>

                <button
                    className="add-employee-btn"
                    onClick={() => {
                        setEditingEmployee(null);
                        resetForm();
                        setShowAddForm(true);
                    }}
                >
                    <span>+</span>
                    Add Employee
                </button>

            </div>

            <div className="employee-summary">

                <div className="employee-summary-card">
                    <div className="summary-icon total">
                        👥
                    </div>

                    <div>
                        <span>
                            Total Employees
                        </span>

                        <strong>
                            {employees.length}
                        </strong>
                    </div>
                </div>

                <div className="employee-summary-card">
                    <div className="summary-icon active-icon">
                        ✓
                    </div>

                    <div>
                        <span>
                            Active
                        </span>

                        <strong>
                            {activeEmployees}
                        </strong>
                    </div>
                </div>

                <div className="employee-summary-card">
                    <div className="summary-icon inactive-icon">
                        ⏸
                    </div>

                    <div>
                        <span>
                            Inactive
                        </span>

                        <strong>
                            {inactiveEmployees}
                        </strong>
                    </div>
                </div>

            </div>

            {(showAddForm || editingEmployee) && (

                <div className="employee-form-card">

                    <div className="form-card-heading">

                        <div>
                            <span>
                                {editingEmployee
                                    ? "EDIT EMPLOYEE"
                                    : "NEW EMPLOYEE"}
                            </span>

                            <h2>
                                {editingEmployee
                                    ? "Edit Employee"
                                    : "Add Employee"}
                            </h2>

                            <p>
                                {editingEmployee
                                    ? "Update employee information"
                                    : "Create a new employee record"}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="form-close-btn"
                            onClick={handleCancel}
                        >
                            ×
                        </button>

                    </div>

                    <form
                        onSubmit={
                            editingEmployee
                                ? handleUpdateEmployee
                                : handleAddEmployee
                        }
                    >

                        <div className="employee-form-grid">

                            <div className="employee-form-group">
                                <label>
                                    Company ID
                                </label>

                                <input
                                    type="number"
                                    name="company_id"
                                    value={formData.company_id}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>
                                    Employee Name
                                </label>

                                <input
                                    type="text"
                                    name="employee_name"
                                    placeholder="Enter employee name"
                                    value={formData.employee_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>
                                    Employee Code
                                </label>

                                <input
                                    type="text"
                                    name="employee_code"
                                    placeholder="EMP001"
                                    value={formData.employee_code}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    name="email_address"
                                    placeholder="employee@example.com"
                                    value={formData.email_address}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>
                                    Phone Number
                                </label>

                                <input
                                    type="text"
                                    name="phone_number"
                                    placeholder="Enter phone number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>
                                    Designation
                                </label>

                                <input
                                    type="text"
                                    name="designation"
                                    placeholder="Manager, Developer..."
                                    value={formData.designation}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>
                                    Department
                                </label>

                                <input
                                    type="text"
                                    name="department"
                                    placeholder="Sales, IT, HR..."
                                    value={formData.department}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="employee-form-group">
                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="Active">
                                        Active
                                    </option>

                                    <option value="Inactive">
                                        Inactive
                                    </option>
                                </select>
                            </div>

                        </div>

                        <div className="employee-form-actions">

                            <button
                                type="button"
                                className="employee-cancel-btn"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="employee-save-btn"
                            >
                                {editingEmployee
                                    ? "Update Employee"
                                    : "Add Employee"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

            <div className="employee-list-card">

                <div className="employee-list-header">

                    <div>
                        <h2>
                            Employee Directory
                        </h2>

                        <span>
                            {filteredEmployees.length} employee
                            {filteredEmployees.length !== 1
                                ? "s"
                                : ""}
                        </span>
                    </div>

                    <div className="employee-search">

                        <span>
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                        {search && (
                            <button
                                onClick={() =>
                                    setSearch("")
                                }
                                className="clear-search"
                            >
                                ×
                            </button>
                        )}

                    </div>

                </div>

                <div className="employees-table-container">

                    <table className="employees-table">

                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Employee</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Department</th>
                                <th>Designation</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td
                                        colSpan="8"
                                        className="table-message"
                                    >
                                        Loading employees...
                                    </td>
                                </tr>

                            ) : filteredEmployees.length > 0 ? (

                                filteredEmployees.map(
                                    (employee) => (

                                        <tr
                                            key={
                                                employee.employee_id
                                            }
                                        >

                                            <td>
                                                <span className="employee-id">
                                                    #
                                                    {
                                                        employee.employee_id
                                                    }
                                                </span>
                                            </td>

                                            <td>

                                                <div className="employee-name-cell">

                                                    <div className="employee-avatar">
                                                        {employee.employee_name
                                                            ?.charAt(
                                                                0
                                                            )
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                employee.employee_name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                employee.employee_code
                                                            }
                                                        </span>
                                                    </div>

                                                </div>

                                            </td>

                                            <td>
                                                {employee.email_address ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {employee.phone_number ||
                                                    "-"}
                                            </td>

                                            <td>
                                                <span className="department-badge">
                                                    {employee.department ||
                                                        "-"}
                                                </span>
                                            </td>

                                            <td>
                                                {employee.designation ||
                                                    "-"}
                                            </td>

                                            <td>

                                                <span
                                                    className={`employee-status ${
                                                        employee.status ===
                                                        "Active"
                                                            ? "active"
                                                            : "inactive"
                                                    }`}
                                                >
                                                    <span></span>
                                                    {
                                                        employee.status
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <div className="employee-actions">

                                                    <button
                                                        className="employee-edit"
                                                        onClick={() =>
                                                            handleEdit(
                                                                employee
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="employee-delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                employee.employee_id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <tr>
                                    <td
                                        colSpan="8"
                                        className="table-message"
                                    >
                                        No employees found
                                    </td>
                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default Employees;