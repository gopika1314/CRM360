import { useEffect, useState } from "react";
import "./Accounts.css";
import { apiFetch } from "../api";

function Accounts() {
    const [accounts, setAccounts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingAccountId, setEditingAccountId] = useState(null);

    const [formData, setFormData] = useState({
        account_name: "",
        company_id: "",
        account_type: "",
        industry: "",
        phone: "",
        email: "",
        address: "",
        website: "",
        annual_revenue: "",
        description: "",
        status: "Active"
    });

    const handleUnauthorized = (response) => {
        if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("crm360_user");
            localStorage.removeItem("crm360_role");
            window.location.href = "/login";
            return true;
        }

        return false;
    };

    const fetchAccounts = async () => {
        try {
            const response = await apiFetch("/accounts/");

            if (handleUnauthorized(response)) {
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch accounts");
            }

            const data = await response.json();
            setAccounts(data);
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await apiFetch("/companies/");

            if (handleUnauthorized(response)) {
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch companies");
            }

            const data = await response.json();
            setCompanies(data);
        } catch (error) {
            console.error("Error fetching companies:", error);
        }
    };

    useEffect(() => {
        fetchAccounts();
        fetchCompanies();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setFormData({
            account_name: "",
            company_id: "",
            account_type: "",
            industry: "",
            phone: "",
            email: "",
            address: "",
            website: "",
            annual_revenue: "",
            description: "",
            status: "Active"
        });

        setEditingAccountId(null);
    };

    const handleEdit = (account) => {
        setEditingAccountId(account.account_id);

        setFormData({
            account_name: account.account_name || "",
            company_id: account.company_id || "",
            account_type: account.account_type || "",
            industry: account.industry || "",
            phone: account.phone || "",
            email: account.email || "",
            address: account.address || "",
            website: account.website || "",
            annual_revenue: account.annual_revenue || "",
            description: account.description || "",
            status: account.status || "Active"
        });

        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const requestData = {
                ...formData,
                company_id: Number(formData.company_id),
                annual_revenue: formData.annual_revenue
                    ? Number(formData.annual_revenue)
                    : null
            };

            let response;

            if (editingAccountId) {
                response = await apiFetch(
                    `/accounts/${editingAccountId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(requestData)
                    }
                );
            } else {
                response = await apiFetch(
                    "/accounts/",
                    {
                        method: "POST",
                        body: JSON.stringify(requestData)
                    }
                );
            }

            if (handleUnauthorized(response)) {
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(
                    errorData?.detail || "Failed to save account"
                );
            }

            resetForm();
            setShowForm(false);

            await fetchAccounts();

        } catch (error) {
            console.error("Error saving account:", error);
            alert("Failed to save account. Check the backend.");
        }
    };

    const handleDelete = async (accountId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this account?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await apiFetch(
                `/accounts/${accountId}`,
                {
                    method: "DELETE"
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to delete account");
            }

            await fetchAccounts();

        } catch (error) {
            console.error("Error deleting account:", error);
            alert("Failed to delete account.");
        }
    };

    const filteredAccounts = accounts.filter((account) =>
        account.account_name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
        account.email
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
        account.industry
            ?.toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="accounts-page">

            <div className="accounts-header">

                <div>
                    <h1>Accounts</h1>
                    <p>
                        Manage and track your customer accounts
                    </p>
                </div>

                <button
                    className="add-account-btn"
                    onClick={() => {
                        if (showForm) {
                            setShowForm(false);
                            resetForm();
                        } else {
                            resetForm();
                            setShowForm(true);
                        }
                    }}
                >
                    + Add Account
                </button>

            </div>

            {showForm && (
                <div className="account-form">

                    <h2>
                        {editingAccountId
                            ? "Edit Account"
                            : "Add New Account"}
                    </h2>

                    <form onSubmit={handleSubmit}>

                        <input
                            type="text"
                            name="account_name"
                            placeholder="Account Name *"
                            value={formData.account_name}
                            onChange={handleChange}
                            required
                        />

                        <select
                            name="company_id"
                            value={formData.company_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select Company *
                            </option>

                            {companies.map((company) => (
                                <option
                                    key={company.company_id}
                                    value={company.company_id}
                                >
                                    {company.company_name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            name="account_type"
                            placeholder="Account Type"
                            value={formData.account_type}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="industry"
                            placeholder="Industry"
                            value={formData.industry}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="phone"
                            placeholder="Phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />

                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="address"
                            placeholder="Address"
                            value={formData.address}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="website"
                            placeholder="Website"
                            value={formData.website}
                            onChange={handleChange}
                        />

                        <input
                            type="number"
                            name="annual_revenue"
                            placeholder="Annual Revenue"
                            value={formData.annual_revenue}
                            onChange={handleChange}
                        />

                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>

                        <textarea
                            name="description"
                            placeholder="Description"
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>

                        <div className="account-form-buttons">

                            <button type="submit">
                                {editingAccountId
                                    ? "Update Account"
                                    : "Save Account"}
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

            <div className="account-search">

                <input
                    type="text"
                    placeholder="Search accounts..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                />

            </div>

            <div className="accounts-table">

                <table>

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Account Name</th>
                            <th>Email</th>
                            <th>Industry</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        {filteredAccounts.length > 0 ? (

                            filteredAccounts.map((account) => (

                                <tr key={account.account_id}>

                                    <td>
                                        {account.account_id}
                                    </td>

                                    <td>
                                        {account.account_name}
                                    </td>

                                    <td>
                                        {account.email || "-"}
                                    </td>

                                    <td>
                                        {account.industry || "-"}
                                    </td>

                                    <td>
                                        {account.phone || "-"}
                                    </td>

                                    <td>
                                        <span
    className={`account-status ${
        account.status === "Inactive" ? "inactive" : "active"
    }`}
>
    {account.status}
</span>
                                    </td>

                                    <td>

                                        <button
                                            className="account-edit"
                                            onClick={() =>
                                                handleEdit(account)
                                            }
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="account-delete"
                                            onClick={() =>
                                                handleDelete(
                                                    account.account_id
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
                                <td colSpan="7">
                                    No accounts found
                                </td>
                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default Accounts;