import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import "./Customers.css";

function Customers() {
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [editingCustomer, setEditingCustomer] = useState(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Fetch Customers
    const fetchCustomers = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await apiFetch("/customers/");

            if (!response || !response.ok) {
                throw new Error("Failed to load customers");
            }

            const data = await response.json();

            setCustomers(data);
        } catch (error) {
            console.error("Error fetching customers:", error);
            setError("Failed to load customers.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // View customer
    const handleView = (customer) => {
        setSelectedCustomer(customer);
        setEditingCustomer(null);
        setMessage("");
        setError("");
    };

    // Edit customer
    const handleEdit = (customer) => {
        setEditingCustomer({ ...customer });
        setSelectedCustomer(null);
        setMessage("");
        setError("");
    };

    // Handle edit form changes
    const handleChange = (e) => {
        setEditingCustomer({
            ...editingCustomer,
            [e.target.name]: e.target.value,
        });
    };

    // Update customer
    const handleUpdate = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        try {
            const response = await apiFetch(
                `/customers/${editingCustomer.customer_id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        customer_name: editingCustomer.customer_name,
                        customer_code: editingCustomer.customer_code,
                        email_address: editingCustomer.email_address,
                        phone_number: editingCustomer.phone_number,
                        address: editingCustomer.address,
                        city: editingCustomer.city,
                        state: editingCustomer.state,
                        status: editingCustomer.status,
                    }),
                }
            );

            if (!response || !response.ok) {
                throw new Error("Failed to update customer");
            }

            setMessage("Customer updated successfully!");

            setEditingCustomer(null);

            fetchCustomers();

        } catch (error) {
            console.error("Update error:", error);
            setError("Failed to update customer.");
        }
    };

    // Delete customer
    const handleDelete = async (customer_id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this customer?"
        );

        if (!confirmDelete) {
            return;
        }

        setMessage("");
        setError("");

        try {
            const response = await apiFetch(
                `/customers/${customer_id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response || !response.ok) {
                throw new Error("Failed to delete customer");
            }

            setMessage("Customer deleted successfully!");

            fetchCustomers();

        } catch (error) {
            console.error("Delete error:", error);
            setError("Failed to delete customer.");
        }
    };

    // Close View
    const closeView = () => {
        setSelectedCustomer(null);
    };

    // Close Edit
    const closeEdit = () => {
        setEditingCustomer(null);
    };

    return (
        <div className="customers-page">

            {/* HEADER */}
            <div className="customers-header">

                <div>
                    <h1>Customers</h1>
                    <p>Manage your customers and their information</p>
                </div>

                <button
                    className="add-customer-btn"
                    onClick={() => navigate("/add-customer")}
                >
                    + Add Customer
                </button>

            </div>

            {/* SUCCESS MESSAGE */}
            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* CUSTOMER TABLE */}
            <div className="customers-card">

                {loading ? (
                    <p className="loading">
                        Loading customers...
                    </p>
                ) : customers.length === 0 ? (
                    <p className="empty">
                        No customers found.
                    </p>
                ) : (
                    <table className="customers-table">

                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>City</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            {customers.map((customer) => (

                                <tr key={customer.customer_id}>

                                    <td>
                                        {customer.customer_id}
                                    </td>

                                    <td className="customer-name">
                                        {customer.customer_name}
                                    </td>

                                    <td>
                                        {customer.customer_code}
                                    </td>

                                    <td>
                                        {customer.email_address}
                                    </td>

                                    <td>
                                        {customer.phone_number}
                                    </td>

                                    <td>
                                        {customer.city}
                                    </td>

                                    <td>
                                        <span
                                            className={
                                                customer.status === "Active"
                                                    ? "status active"
                                                    : "status inactive"
                                            }
                                        >
                                            {customer.status}
                                        </span>
                                    </td>

                                    <td className="action-buttons">

                                        <button
                                            className="view-btn"
                                            onClick={() =>
                                                handleView(customer)
                                            }
                                        >
                                            View
                                        </button>

                                        <button
                                            className="edit-btn"
                                            onClick={() =>
                                                handleEdit(customer)
                                            }
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="delete-btn"
                                            onClick={() =>
                                                handleDelete(
                                                    customer.customer_id
                                                )
                                            }
                                        >
                                            Delete
                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>
                )}

            </div>

            {/* VIEW CUSTOMER MODAL */}
            {selectedCustomer && (

                <div className="customer-modal">

                    <div className="customer-modal-content">

                        <div className="modal-header">

                            <h2>
                                Customer Details
                            </h2>

                            <button
                                className="close-btn"
                                onClick={closeView}
                            >
                                ×
                            </button>

                        </div>

                        <div className="customer-details">

                            <p>
                                <strong>Customer ID:</strong>{" "}
                                {selectedCustomer.customer_id}
                            </p>

                            <p>
                                <strong>Customer Name:</strong>{" "}
                                {selectedCustomer.customer_name}
                            </p>

                            <p>
                                <strong>Customer Code:</strong>{" "}
                                {selectedCustomer.customer_code}
                            </p>

                            <p>
                                <strong>Email:</strong>{" "}
                                {selectedCustomer.email_address}
                            </p>

                            <p>
                                <strong>Phone:</strong>{" "}
                                {selectedCustomer.phone_number}
                            </p>

                            <p>
                                <strong>Address:</strong>{" "}
                                {selectedCustomer.address}
                            </p>

                            <p>
                                <strong>City:</strong>{" "}
                                {selectedCustomer.city}
                            </p>

                            <p>
                                <strong>State:</strong>{" "}
                                {selectedCustomer.state}
                            </p>

                            <p>
                                <strong>Status:</strong>{" "}
                                {selectedCustomer.status}
                            </p>

                        </div>

                        <div className="modal-buttons">

                            <button
                                className="edit-btn"
                                onClick={() =>
                                    handleEdit(selectedCustomer)
                                }
                            >
                                Edit Customer
                            </button>

                            <button
                                className="cancel-btn"
                                onClick={closeView}
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* EDIT CUSTOMER MODAL */}
            {editingCustomer && (

                <div className="customer-modal">

                    <div className="customer-modal-content edit-modal">

                        <div className="modal-header">

                            <h2>
                                Edit Customer
                            </h2>

                            <button
                                className="close-btn"
                                onClick={closeEdit}
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={handleUpdate}>

                            <div className="form-row">

                                <div className="form-group">

                                    <label>
                                        Customer Name
                                    </label>

                                    <input
                                        type="text"
                                        name="customer_name"
                                        value={
                                            editingCustomer.customer_name || ""
                                        }
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Customer Code
                                    </label>

                                    <input
                                        type="text"
                                        name="customer_code"
                                        value={
                                            editingCustomer.customer_code || ""
                                        }
                                        onChange={handleChange}
                                        required
                                    />

                                </div>

                            </div>

                            <div className="form-row">

                                <div className="form-group">

                                    <label>
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        name="email_address"
                                        value={
                                            editingCustomer.email_address || ""
                                        }
                                        onChange={handleChange}
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        Phone Number
                                    </label>

                                    <input
                                        type="text"
                                        name="phone_number"
                                        value={
                                            editingCustomer.phone_number || ""
                                        }
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>

                            <div className="form-group">

                                <label>
                                    Address
                                </label>

                                <input
                                    type="text"
                                    name="address"
                                    value={
                                        editingCustomer.address || ""
                                    }
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="form-row">

                                <div className="form-group">

                                    <label>
                                        City
                                    </label>

                                    <input
                                        type="text"
                                        name="city"
                                        value={
                                            editingCustomer.city || ""
                                        }
                                        onChange={handleChange}
                                    />

                                </div>

                                <div className="form-group">

                                    <label>
                                        State
                                    </label>

                                    <input
                                        type="text"
                                        name="state"
                                        value={
                                            editingCustomer.state || ""
                                        }
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>

                            <div className="form-group">

                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={
                                        editingCustomer.status || "Active"
                                    }
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

                            <div className="modal-buttons">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={closeEdit}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="update-btn"
                                >
                                    Update Customer
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Customers;