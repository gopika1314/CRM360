import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import "./AddCustomer.css";

function AddCustomer() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        customer_name: "",
        customer_code: "",
        email_address: "",
        phone_number: "",
        address: "",
        city: "",
        state: "",
        status: "Active",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        try {
            const response = await apiFetch("/customers/", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            if (!response || !response.ok) {
                const errorData = response
                    ? await response.json().catch(() => null)
                    : null;

                throw new Error(
                    errorData?.detail || "Failed to add customer"
                );
            }

            const data = await response.json();

            console.log("Customer created:", data);

            setMessage("Customer added successfully!");

            setFormData({
                customer_name: "",
                customer_code: "",
                email_address: "",
                phone_number: "",
                address: "",
                city: "",
                state: "",
                status: "Active",
            });

        } catch (error) {
            console.error("Error:", error);
            setError(
                error.message || "Failed to add customer. Please try again."
            );
        }
    };

    return (
        <div className="add-customer-page">

            <div className="add-customer-header">
                <h1>Add Customer</h1>
                <p>Create a new customer record</p>
            </div>

            <div className="add-customer-card">

                <form
                    className="customer-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-row">

                        <div className="form-group">
                            <label>Customer Name</label>

                            <input
                                type="text"
                                name="customer_name"
                                value={formData.customer_name}
                                onChange={handleChange}
                                placeholder="Enter customer name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Customer Code</label>

                            <input
                                type="text"
                                name="customer_code"
                                value={formData.customer_code}
                                onChange={handleChange}
                                placeholder="Enter customer code"
                                required
                            />
                        </div>

                    </div>

                    <div className="form-row">

                        <div className="form-group">
                            <label>Email Address</label>

                            <input
                                type="email"
                                name="email_address"
                                value={formData.email_address}
                                onChange={handleChange}
                                placeholder="Enter email address"
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>

                            <input
                                type="text"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                            />
                        </div>

                    </div>

                    <div className="form-group">
                        <label>Address</label>

                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter address"
                        />
                    </div>

                    <div className="form-row">

                        <div className="form-group">
                            <label>City</label>

                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Enter city"
                            />
                        </div>

                        <div className="form-group">
                            <label>State</label>

                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="Enter state"
                            />
                        </div>

                    </div>

                    <div className="form-group">
                        <label>Status</label>

                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="form-buttons">

                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate("/customers")}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="submit-customer-btn"
                        >
                            Add Customer
                        </button>

                    </div>

                </form>

                {message && (
                    <div className="success-message">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

            </div>

        </div>
    );
}

export default AddCustomer;