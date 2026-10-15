import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./Tasks.css";

function Tasks() {

    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState({
        task_name: "",
        description: "",
        status: "Pending",
        priority: "Medium",
        due_date: "",
        assigned_employee_id: "",
        related_customer_id: ""
    });

    const fetchTasks = async () => {
        try {
            const response = await apiFetch("/tasks/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch tasks");
            }

            const data = await response.json();
            setTasks(data);

        } catch (error) {
            console.error("Error fetching tasks:", error);
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
        fetchTasks();
        fetchEmployees();
        fetchCustomers();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setFormData({
            task_name: "",
            description: "",
            status: "Pending",
            priority: "Medium",
            due_date: "",
            assigned_employee_id: "",
            related_customer_id: ""
        });

        setEditingTaskId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const requestData = {
            ...formData,

            assigned_employee_id:
                formData.assigned_employee_id
                    ? Number(formData.assigned_employee_id)
                    : null,

            related_customer_id:
                formData.related_customer_id
                    ? Number(formData.related_customer_id)
                    : null
        };

        try {

            const endpoint = editingTaskId
                ? `/tasks/${editingTaskId}`
                : "/tasks/";

            const method = editingTaskId
                ? "PUT"
                : "POST";

            const response = await apiFetch(endpoint, {
                method,
                body: JSON.stringify(requestData)
            });

            if (!response || !response.ok) {
                throw new Error("Failed to save task");
            }

            resetForm();
            setShowForm(false);

            fetchTasks();

        } catch (error) {
            console.error("Error saving task:", error);
            alert("Failed to save task.");
        }
    };

    const handleEdit = (task) => {

        setEditingTaskId(task.task_id);

        setFormData({
            task_name: task.task_name || "",
            description: task.description || "",
            status: task.status || "Pending",
            priority: task.priority || "Medium",
            due_date: task.due_date || "",
            assigned_employee_id:
                task.assigned_employee_id || "",
            related_customer_id:
                task.related_customer_id || ""
        });

        setShowForm(true);
    };

    const handleDelete = async (taskId) => {

        if (!window.confirm(
            "Are you sure you want to delete this task?"
        )) {
            return;
        }

        try {

            const response = await apiFetch(
                `/tasks/${taskId}`,
                {
                    method: "DELETE"
                }
            );

            if (!response || !response.ok) {
                throw new Error("Failed to delete task");
            }

            fetchTasks();

        } catch (error) {
            console.error("Error deleting task:", error);
            alert("Failed to delete task.");
        }
    };

    const getEmployeeName = (employeeId) => {

        const employee = employees.find(
            (item) => item.employee_id === employeeId
        );

        return employee
            ? employee.employee_name
            : "-";
    };

    const getCustomerName = (customerId) => {

        const customer = customers.find(
            (item) => item.customer_id === customerId
        );

        return customer
            ? customer.customer_name
            : "-";
    };

    const filteredTasks = tasks.filter(
        (task) =>
            task.task_name
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||

            task.status
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||

            task.priority
                ?.toLowerCase()
                .includes(search.toLowerCase())
    );

    return (
        <div className="tasks-page">

            <div className="tasks-header">

                <div>
                    <h1>Tasks</h1>
                    <p>Manage and track CRM tasks</p>
                </div>

                <button
                    className="add-task-btn"
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                >
                    + Add Task
                </button>

            </div>

            {showForm && (

                <div className="task-form">

                    <h2>
                        {editingTaskId
                            ? "Edit Task"
                            : "Add New Task"}
                    </h2>

                    <form onSubmit={handleSubmit}>

                        <input
                            type="text"
                            name="task_name"
                            placeholder="Task Name *"
                            value={formData.task_name}
                            onChange={handleChange}
                            required
                        />

                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="Pending">
                                Pending
                            </option>

                            <option value="In Progress">
                                In Progress
                            </option>

                            <option value="Completed">
                                Completed
                            </option>

                            <option value="Cancelled">
                                Cancelled
                            </option>
                        </select>

                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                        >
                            <option value="Low">
                                Low
                            </option>

                            <option value="Medium">
                                Medium
                            </option>

                            <option value="High">
                                High
                            </option>
                        </select>

                        <input
                            type="date"
                            name="due_date"
                            value={formData.due_date}
                            onChange={handleChange}
                        />

                        <select
                            name="assigned_employee_id"
                            value={formData.assigned_employee_id}
                            onChange={handleChange}
                        >
                            <option value="">
                                Select Employee
                            </option>

                            {employees.map((employee) => (
                                <option
                                    key={employee.employee_id}
                                    value={employee.employee_id}
                                >
                                    {employee.employee_name}
                                </option>
                            ))}
                        </select>

                        <select
                            name="related_customer_id"
                            value={formData.related_customer_id}
                            onChange={handleChange}
                        >
                            <option value="">
                                Select Customer
                            </option>

                            {customers.map((customer) => (
                                <option
                                    key={customer.customer_id}
                                    value={customer.customer_id}
                                >
                                    {customer.customer_name}
                                </option>
                            ))}
                        </select>

                        <textarea
                            name="description"
                            placeholder="Description"
                            value={formData.description}
                            onChange={handleChange}
                        />

                        <div className="task-form-buttons">

                            <button type="submit">
                                {editingTaskId
                                    ? "Update Task"
                                    : "Save Task"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>

            )}

            <div className="task-search">

                <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                />

            </div>

            <div className="tasks-table">

                <table>

                    <thead>

                        <tr>
                            <th>ID</th>
                            <th>Task</th>
                            <th>Employee</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Due Date</th>
                            <th>Actions</th>
                        </tr>

                    </thead>

                    <tbody>

                        {filteredTasks.length > 0 ? (

                            filteredTasks.map((task) => (

                                <tr key={task.task_id}>

                                    <td>
                                        {task.task_id}
                                    </td>

                                    <td>
                                        {task.task_name}
                                    </td>

                                    <td>
                                        {getEmployeeName(
                                            task.assigned_employee_id
                                        )}
                                    </td>

                                    <td>
                                        {getCustomerName(
                                            task.related_customer_id
                                        )}
                                    </td>

                                    <td>
                                        <span className="task-status">
                                            {task.status}
                                        </span>
                                    </td>

                                    <td>
                                        <span className="task-priority">
                                            {task.priority}
                                        </span>
                                    </td>

                                    <td>
                                        {task.due_date || "-"}
                                    </td>

                                    <td>

                                        <button
                                            className="task-edit"
                                            onClick={() =>
                                                handleEdit(task)
                                            }
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="task-delete"
                                            onClick={() =>
                                                handleDelete(
                                                    task.task_id
                                                )
                                            }
                                        >
                                            Delete
                                        </button>

                                    </td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td colSpan="8">
                                    No tasks found
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default Tasks;