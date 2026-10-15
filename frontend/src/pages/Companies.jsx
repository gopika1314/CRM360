import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./Companies.css";

function Companies() {
    const [companies, setCompanies] = useState([]);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingCompanyId, setEditingCompanyId] = useState(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        company_name: "",
        company_code: "",
        email_address: "",
        phone_number: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
        status: "Active"
    });

    const resetForm = () => {
        setFormData({
            company_name: "",
            company_code: "",
            email_address: "",
            phone_number: "",
            address_line_1: "",
            address_line_2: "",
            city: "",
            state: "",
            country: "",
            postal_code: "",
            status: "Active"
        });

        setEditingCompanyId(null);
    };

    const fetchCompanies = async () => {
        try {
            setLoading(true);

            const response = await apiFetch("/companies/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch companies");
            }

            const data = await response.json();

            setCompanies(
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            console.error(
                "Error fetching companies:",
                error
            );

            setCompanies([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleEdit = (company) => {
        setEditingCompanyId(company.company_id);

        setFormData({
            company_name: company.company_name || "",
            company_code: company.company_code || "",
            email_address: company.email_address || "",
            phone_number: company.phone_number || "",
            address_line_1: company.address_line_1 || "",
            address_line_2: company.address_line_2 || "",
            city: company.city || "",
            state: company.state || "",
            country: company.country || "",
            postal_code: company.postal_code || "",
            status: company.status || "Active"
        });

        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const requestData = {
                company_name: formData.company_name.trim(),
                company_code: formData.company_code.trim(),
                email_address: formData.email_address.trim() || null,
                phone_number: formData.phone_number.trim() || null,
                address_line_1: formData.address_line_1.trim() || null,
                address_line_2: formData.address_line_2.trim() || null,
                city: formData.city.trim() || null,
                state: formData.state.trim() || null,
                country: formData.country.trim() || null,
                postal_code: formData.postal_code.trim() || null,
                status: formData.status
            };

            let response;

            if (editingCompanyId) {
                response = await apiFetch(
                    `/companies/${editingCompanyId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(requestData)
                    }
                );
            } else {
                response = await apiFetch(
                    "/companies/",
                    {
                        method: "POST",
                        body: JSON.stringify(requestData)
                    }
                );
            }

            const responseData =
                await response.json().catch(() => null);

            if (!response || !response.ok) {
                console.error(
                    "Backend error:",
                    responseData
                );

                alert(
                    responseData?.detail ||
                    (
                        editingCompanyId
                            ? "Failed to update company."
                            : "Failed to add company."
                    )
                );

                return;
            }

            alert(
                editingCompanyId
                    ? "Company updated successfully!"
                    : "Company added successfully!"
            );

            resetForm();
            setShowForm(false);

            await fetchCompanies();

        } catch (error) {
            console.error(
                "Error saving company:",
                error
            );

            alert(
                "Failed to save company. Check the backend."
            );
        }
    };

    const handleDelete = async (companyId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this company?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await apiFetch(
                `/companies/${companyId}`,
                {
                    method: "DELETE"
                }
            );

            const responseData =
                await response.json().catch(() => null);

            if (!response || !response.ok) {
                console.error(
                    "Delete error:",
                    responseData
                );

                alert(
                    responseData?.detail ||
                    "Failed to delete company."
                );

                return;
            }

            alert(
                "Company deleted successfully!"
            );

            await fetchCompanies();

        } catch (error) {
            console.error(
                "Error deleting company:",
                error
            );

            alert(
                "Failed to delete company."
            );
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        resetForm();
    };

    const filteredCompanies = companies.filter(
        (company) => {
            const searchText =
                search.toLowerCase().trim();

            return (
                company.company_name
                    ?.toLowerCase()
                    .includes(searchText) ||

                company.company_code
                    ?.toLowerCase()
                    .includes(searchText) ||

                company.email_address
                    ?.toLowerCase()
                    .includes(searchText) ||

                company.phone_number
                    ?.toLowerCase()
                    .includes(searchText) ||

                company.city
                    ?.toLowerCase()
                    .includes(searchText) ||

                company.state
                    ?.toLowerCase()
                    .includes(searchText) ||

                company.country
                    ?.toLowerCase()
                    .includes(searchText) ||

                company.status
                    ?.toLowerCase()
                    .includes(searchText)
            );
        }
    );

    const activeCompanies =
        companies.filter(
            (company) =>
                company.status === "Active"
        ).length;

    const inactiveCompanies =
        companies.filter(
            (company) =>
                company.status === "Inactive"
        ).length;

    return (
        <div className="companies-page">

            <div className="companies-header">

                <div>

                    <span className="companies-label">
                        BUSINESS MANAGEMENT
                    </span>

                    <h1>
                        Companies
                    </h1>

                    <p>
                        Manage your company records and business information.
                    </p>

                </div>

                <button
                    className="add-company-btn"
                    onClick={() => {
                        if (showForm) {
                            handleCancel();
                        } else {
                            resetForm();
                            setShowForm(true);
                        }
                    }}
                >
                    <span>+</span>
                    Add Company
                </button>

            </div>

            <div className="company-summary">

                <div className="company-summary-card">

                    <div className="company-summary-icon total">
                        🏢
                    </div>

                    <div>
                        <span>Total Companies</span>
                        <strong>{companies.length}</strong>
                    </div>

                </div>

                <div className="company-summary-card">

                    <div className="company-summary-icon active-icon">
                        ✓
                    </div>

                    <div>
                        <span>Active</span>
                        <strong>{activeCompanies}</strong>
                    </div>

                </div>

                <div className="company-summary-card">

                    <div className="company-summary-icon inactive-icon">
                        ⏸
                    </div>

                    <div>
                        <span>Inactive</span>
                        <strong>{inactiveCompanies}</strong>
                    </div>

                </div>

            </div>

            {showForm && (

                <div className="company-form-card">

                    <div className="company-form-heading">

                        <div>

                            <span>
                                {editingCompanyId
                                    ? "EDIT COMPANY"
                                    : "NEW COMPANY"}
                            </span>

                            <h2>
                                {editingCompanyId
                                    ? "Edit Company"
                                    : "Add Company"}
                            </h2>

                            <p>
                                {editingCompanyId
                                    ? "Update company information"
                                    : "Create a new company record"}
                            </p>

                        </div>

                        <button
                            type="button"
                            className="company-close-btn"
                            onClick={handleCancel}
                        >
                            ×
                        </button>

                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="company-form-grid">

                            <div className="company-form-group">

                                <label>
                                    Company Name
                                </label>

                                <input
                                    type="text"
                                    name="company_name"
                                    placeholder="Enter company name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="company-form-group">

                                <label>
                                    Company Code
                                </label>

                                <input
                                    type="text"
                                    name="company_code"
                                    placeholder="Example: CMP001"
                                    value={formData.company_code}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="company-form-group">

                                <label>
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    name="email_address"
                                    placeholder="company@example.com"
                                    value={formData.email_address}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="company-form-group">

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

                            <div className="company-form-group">

                                <label>
                                    City
                                </label>

                                <input
                                    type="text"
                                    name="city"
                                    placeholder="Enter city"
                                    value={formData.city}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="company-form-group">

                                <label>
                                    State
                                </label>

                                <input
                                    type="text"
                                    name="state"
                                    placeholder="Enter state"
                                    value={formData.state}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="company-form-group">

                                <label>
                                    Country
                                </label>

                                <input
                                    type="text"
                                    name="country"
                                    placeholder="Enter country"
                                    value={formData.country}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="company-form-group">

                                <label>
                                    Postal Code
                                </label>

                                <input
                                    type="text"
                                    name="postal_code"
                                    placeholder="Enter postal code"
                                    value={formData.postal_code}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="company-form-group">

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

                            <div className="company-form-group">

                                <label>
                                    Address Line 1
                                </label>

                                <input
                                    type="text"
                                    name="address_line_1"
                                    placeholder="Enter address"
                                    value={formData.address_line_1}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="company-form-group">

                                <label>
                                    Address Line 2
                                </label>

                                <input
                                    type="text"
                                    name="address_line_2"
                                    placeholder="Apartment, building, landmark..."
                                    value={formData.address_line_2}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>

                        <div className="company-form-actions">

                            <button
                                type="button"
                                className="company-cancel-btn"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="company-save-btn"
                            >
                                {editingCompanyId
                                    ? "Update Company"
                                    : "Add Company"}
                            </button>

                        </div>

                    </form>

                </div>

            )}

            <div className="company-list-card">

                <div className="company-list-header">

                    <div>

                        <h2>
                            Company Directory
                        </h2>

                        <span>
                            {filteredCompanies.length} compan
                            {filteredCompanies.length !== 1
                                ? "ies"
                                : "y"}
                        </span>

                    </div>

                    <div className="company-search">

                        <span>🔍</span>

                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                        {search && (
                            <button
                                className="company-clear-search"
                                onClick={() =>
                                    setSearch("")
                                }
                            >
                                ×
                            </button>
                        )}

                    </div>

                </div>

                <div className="companies-table-container">

                    <table className="companies-table">

                        <thead>

                            <tr>
                                <th>ID</th>
                                <th>Company</th>
                                <th>Code</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td
                                        colSpan="8"
                                        className="company-table-message"
                                    >
                                        Loading companies...
                                    </td>
                                </tr>

                            ) : filteredCompanies.length > 0 ? (

                                filteredCompanies.map(
                                    (company) => (

                                        <tr
                                            key={
                                                company.company_id
                                            }
                                        >

                                            <td>

                                                <span className="company-id">
                                                    #
                                                    {
                                                        company.company_id
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <div className="company-name-cell">

                                                    <div className="company-avatar">

                                                        {company.company_name
                                                            ?.charAt(0)
                                                            .toUpperCase()}

                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                company.company_name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                company.company_code ||
                                                                "Company record"
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>

                                                <span className="industry-badge">
                                                    {
                                                        company.company_code ||
                                                        "-"
                                                    }
                                                </span>

                                            </td>

                                            <td>
                                                {
                                                    company.email_address ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    company.phone_number ||
                                                    "-"
                                                }
                                            </td>

                                            <td>

                                                <div className="company-location">

                                                    <strong>
                                                        {
                                                            company.city ||
                                                            "-"
                                                        }
                                                    </strong>

                                                    {company.state && (
                                                        <span>
                                                            {
                                                                company.state
                                                            }
                                                        </span>
                                                    )}

                                                </div>

                                            </td>

                                            <td>

                                                <span
                                                    className={`company-status ${
                                                        company.status ===
                                                        "Active"
                                                            ? "active"
                                                            : "inactive"
                                                    }`}
                                                >

                                                    <span></span>

                                                    {
                                                        company.status
                                                    }

                                                </span>

                                            </td>

                                            <td>

                                                <div className="company-actions">

                                                    <button
                                                        className="company-edit"
                                                        onClick={() =>
                                                            handleEdit(
                                                                company
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="company-delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                company.company_id
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
                                        className="company-table-message"
                                    >
                                        No companies found
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

export default Companies;