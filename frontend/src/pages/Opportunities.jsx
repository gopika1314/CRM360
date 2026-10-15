import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./Opportunities.css";

function Opportunities() {
    const [opportunities, setOpportunities] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [showForm, setShowForm] = useState(false);
    const [editingOpportunityId, setEditingOpportunityId] = useState(null);
    const [search, setSearch] = useState("");
    const [stageFilter, setStageFilter] = useState("All");
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        opportunity_name: "",
        account_id: "",
        contact_id: "",
        assigned_employee_id: "",
        opportunity_type: "",
        stage: "New",
        expected_revenue: "",
        probability: "",
        expected_close_date: "",
        description: "",
        status: "Open"
    });

    const resetForm = () => {
        setFormData({
            opportunity_name: "",
            account_id: "",
            contact_id: "",
            assigned_employee_id: "",
            opportunity_type: "",
            stage: "New",
            expected_revenue: "",
            probability: "",
            expected_close_date: "",
            description: "",
            status: "Open"
        });

        setEditingOpportunityId(null);
    };

    const fetchOpportunities = async () => {
        try {
            setLoading(true);

            const response = await apiFetch("/opportunities/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch opportunities");
            }

            const data = await response.json();

            setOpportunities(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching opportunities:", error);
            setOpportunities([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await apiFetch("/accounts/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch accounts");
            }

            const data = await response.json();

            setAccounts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching accounts:", error);
            setAccounts([]);
        }
    };

    const fetchContacts = async () => {
        try {
            const response = await apiFetch("/contacts/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch contacts");
            }

            const data = await response.json();

            setContacts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching contacts:", error);
            setContacts([]);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await apiFetch("/employees/");

            if (!response || !response.ok) {
                throw new Error("Failed to fetch employees");
            }

            const data = await response.json();

            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching employees:", error);
            setEmployees([]);
        }
    };

    useEffect(() => {
        fetchOpportunities();
        fetchAccounts();
        fetchContacts();
        fetchEmployees();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "account_id") {
            setFormData({
                ...formData,
                account_id: value,
                contact_id: ""
            });

            return;
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleEdit = (opportunity) => {
        setEditingOpportunityId(opportunity.opportunity_id);

        setFormData({
            opportunity_name: opportunity.opportunity_name || "",
            account_id: opportunity.account_id || "",
            contact_id: opportunity.contact_id || "",
            assigned_employee_id:
                opportunity.assigned_employee_id || "",
            opportunity_type:
                opportunity.opportunity_type || "",
            stage: opportunity.stage || "New",
            expected_revenue:
                opportunity.expected_revenue ?? "",
            probability:
                opportunity.probability ?? "",
            expected_close_date:
                opportunity.expected_close_date || "",
            description:
                opportunity.description || "",
            status: opportunity.status || "Open"
        });

        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const requestData = {
                ...formData,

                account_id: Number(formData.account_id),

                contact_id: formData.contact_id
                    ? Number(formData.contact_id)
                    : null,

                assigned_employee_id:
                    formData.assigned_employee_id
                        ? Number(formData.assigned_employee_id)
                        : null,

                expected_revenue:
                    formData.expected_revenue !== ""
                        ? Number(formData.expected_revenue)
                        : null,

                probability:
                    formData.probability !== ""
                        ? Number(formData.probability)
                        : null
            };

            let response;

            if (editingOpportunityId) {
                response = await apiFetch(
                    `/opportunities/${editingOpportunityId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(requestData)
                    }
                );
            } else {
                response = await apiFetch(
                    "/opportunities/",
                    {
                        method: "POST",
                        body: JSON.stringify(requestData)
                    }
                );
            }

            if (!response || !response.ok) {
                const errorData = response
                    ? await response.json().catch(() => null)
                    : null;

                console.error("Backend error:", errorData);

                alert("Failed to save opportunity.");
                return;
            }

            resetForm();
            setShowForm(false);

            await fetchOpportunities();
        } catch (error) {
            console.error("Error saving opportunity:", error);
            alert("Backend connection error.");
        }
    };

    const handleDelete = async (opportunityId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this opportunity?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await apiFetch(
                `/opportunities/${opportunityId}`,
                {
                    method: "DELETE"
                }
            );

            if (!response || !response.ok) {
                throw new Error("Delete failed");
            }

            await fetchOpportunities();
        } catch (error) {
            console.error("Error deleting opportunity:", error);
            alert("Failed to delete opportunity.");
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        resetForm();
    };

    const getAccountName = (accountId) => {
        const account = accounts.find(
            (item) => Number(item.account_id) === Number(accountId)
        );

        return account ? account.account_name : "-";
    };

    const getContactName = (contactId) => {
        const contact = contacts.find(
            (item) => Number(item.contact_id) === Number(contactId)
        );

        return contact ? contact.contact_name : "-";
    };

    const getEmployeeName = (employeeId) => {
        const employee = employees.find(
            (item) =>
                Number(item.employee_id) === Number(employeeId)
        );

        return employee ? employee.employee_name : "-";
    };

    const getStageClass = (stage) => {
        switch (stage) {
            case "New":
                return "new";

            case "Qualified":
                return "qualified";

            case "Proposal Sent":
                return "proposal";

            case "Negotiation":
                return "negotiation";

            case "Won":
                return "won";

            case "Lost":
                return "lost";

            default:
                return "new";
        }
    };

    const filteredContacts = contacts.filter(
        (contact) =>
            Number(contact.account_id) ===
            Number(formData.account_id)
    );

    const filteredOpportunities = opportunities.filter(
        (opportunity) => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                opportunity.opportunity_name
                    ?.toLowerCase()
                    .includes(searchText) ||
                opportunity.stage
                    ?.toLowerCase()
                    .includes(searchText) ||
                opportunity.status
                    ?.toLowerCase()
                    .includes(searchText) ||
                getAccountName(opportunity.account_id)
                    .toLowerCase()
                    .includes(searchText) ||
                getContactName(opportunity.contact_id)
                    .toLowerCase()
                    .includes(searchText) ||
                getEmployeeName(opportunity.assigned_employee_id)
                    .toLowerCase()
                    .includes(searchText);

            const matchesStage =
                stageFilter === "All" ||
                opportunity.stage === stageFilter;

            return matchesSearch && matchesStage;
        }
    );

    const totalOpportunities = opportunities.length;

    const openOpportunities = opportunities.filter(
        (item) => item.status === "Open"
    ).length;

    const wonOpportunities = opportunities.filter(
        (item) => item.stage === "Won"
    ).length;

    const totalRevenue = opportunities.reduce(
        (total, item) =>
            total + Number(item.expected_revenue || 0),
        0
    );

    return (
        <div className="opportunities-page">

            <div className="opportunities-header">

                <div>
                    <div className="opportunities-label">
                        SALES PIPELINE
                    </div>

                    <h1>Opportunities</h1>

                    <p>
                        Track potential deals from qualification to closing
                    </p>
                </div>

                <button
                    className="add-opportunity-btn"
                    onClick={() => {
                        if (showForm) {
                            handleCancel();
                        } else {
                            resetForm();
                            setShowForm(true);
                        }
                    }}
                >
                    {showForm
                        ? "Close Form"
                        : "+ Add Opportunity"}
                </button>

            </div>

            <div className="opportunity-summary">

                <div className="opportunity-summary-card">

                    <div className="opportunity-summary-icon total">
                        📊
                    </div>

                    <div>
                        <span>Total Opportunities</span>
                        <strong>{totalOpportunities}</strong>
                    </div>

                </div>

                <div className="opportunity-summary-card">

                    <div className="opportunity-summary-icon open">
                        ◉
                    </div>

                    <div>
                        <span>Open Deals</span>
                        <strong>{openOpportunities}</strong>
                    </div>

                </div>

                <div className="opportunity-summary-card">

                    <div className="opportunity-summary-icon won">
                        ✓
                    </div>

                    <div>
                        <span>Won Deals</span>
                        <strong>{wonOpportunities}</strong>
                    </div>

                </div>

                <div className="opportunity-summary-card">

                    <div className="opportunity-summary-icon revenue">
                        ₹
                    </div>

                    <div>
                        <span>Pipeline Revenue</span>
                        <strong>
                            ₹
                            {totalRevenue.toLocaleString("en-IN")}
                        </strong>
                    </div>

                </div>

            </div>

            {showForm && (
                <div className="opportunity-form-card">

                    <div className="opportunity-form-heading">

                        <div>
                            <span>
                                {editingOpportunityId
                                    ? "UPDATE RECORD"
                                    : "NEW RECORD"}
                            </span>

                            <h2>
                                {editingOpportunityId
                                    ? "Edit Opportunity"
                                    : "Add New Opportunity"}
                            </h2>
                        </div>

                        <button
                            type="button"
                            className="opportunity-close-btn"
                            onClick={handleCancel}
                        >
                            ×
                        </button>

                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="opportunity-form-grid">

                            <div className="opportunity-form-group">

                                <label>
                                    Opportunity Name *
                                </label>

                                <input
                                    type="text"
                                    name="opportunity_name"
                                    placeholder="Enter opportunity name"
                                    value={
                                        formData.opportunity_name
                                    }
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="opportunity-form-group">

                                <label>
                                    Account *
                                </label>

                                <select
                                    name="account_id"
                                    value={formData.account_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Select Account
                                    </option>

                                    {accounts.map((account) => (
                                        <option
                                            key={account.account_id}
                                            value={account.account_id}
                                        >
                                            {account.account_name}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            <div className="opportunity-form-group">

                                <label>
                                    Contact
                                </label>

                                <select
                                    name="contact_id"
                                    value={formData.contact_id}
                                    onChange={handleChange}
                                    disabled={!formData.account_id}
                                >

                                    <option value="">
                                        {formData.account_id
                                            ? filteredContacts.length > 0
                                                ? "Select Contact"
                                                : "No contacts for this account"
                                            : "Select Account First"}
                                    </option>

                                    {filteredContacts.map((contact) => (
                                        <option
                                            key={contact.contact_id}
                                            value={contact.contact_id}
                                        >
                                            {contact.contact_name}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            <div className="opportunity-form-group">

                                <label>
                                    Assigned Employee
                                </label>

                                <select
                                    name="assigned_employee_id"
                                    value={
                                        formData.assigned_employee_id
                                    }
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

                            </div>

                            <div className="opportunity-form-group">

                                <label>
                                    Opportunity Type
                                </label>

                                <input
                                    type="text"
                                    name="opportunity_type"
                                    placeholder="New Business, Renewal..."
                                    value={
                                        formData.opportunity_type
                                    }
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="opportunity-form-group">

                                <label>
                                    Stage
                                </label>

                                <select
                                    name="stage"
                                    value={formData.stage}
                                    onChange={handleChange}
                                >
                                    <option value="New">
                                        New
                                    </option>

                                    <option value="Qualified">
                                        Qualified
                                    </option>

                                    <option value="Proposal Sent">
                                        Proposal Sent
                                    </option>

                                    <option value="Negotiation">
                                        Negotiation
                                    </option>

                                    <option value="Won">
                                        Won
                                    </option>

                                    <option value="Lost">
                                        Lost
                                    </option>

                                </select>

                            </div>

                            <div className="opportunity-form-group">

                                <label>
                                    Expected Revenue
                                </label>

                                <input
                                    type="number"
                                    name="expected_revenue"
                                    placeholder="Enter revenue"
                                    value={
                                        formData.expected_revenue
                                    }
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="opportunity-form-group">

                                <label>
                                    Probability (%)
                                </label>

                                <input
                                    type="number"
                                    name="probability"
                                    placeholder="0 - 100"
                                    min="0"
                                    max="100"
                                    value={formData.probability}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="opportunity-form-group">

                                <label>
                                    Expected Close Date
                                </label>

                                <input
                                    type="date"
                                    name="expected_close_date"
                                    value={
                                        formData.expected_close_date
                                    }
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="opportunity-form-group">

                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="Open">
                                        Open
                                    </option>

                                    <option value="Closed">
                                        Closed
                                    </option>

                                    <option value="Inactive">
                                        Inactive
                                    </option>
                                </select>

                            </div>

                            <div className="opportunity-form-group opportunity-full-width">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    placeholder="Add opportunity details..."
                                    value={
                                        formData.description
                                    }
                                    onChange={handleChange}
                                />

                            </div>

                        </div>

                        <div className="opportunity-form-actions">

                            <button
                                type="button"
                                className="opportunity-cancel-btn"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="opportunity-save-btn"
                            >
                                {editingOpportunityId
                                    ? "Update Opportunity"
                                    : "Save Opportunity"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

            <div className="opportunity-list-card">

                <div className="opportunity-list-header">

                    <div>
                        <span>
                            OPPORTUNITY PIPELINE
                        </span>

                        <h2>
                            All Opportunities

                            <small>
                                {filteredOpportunities.length} records
                            </small>
                        </h2>
                    </div>

                    <div className="opportunity-list-tools">

                        <div className="opportunity-search-box">

                            <span>⌕</span>

                            <input
                                type="text"
                                placeholder="Search opportunities..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                >
                                    ×
                                </button>
                            )}

                        </div>

                        <select
                            className="opportunity-filter"
                            value={stageFilter}
                            onChange={(e) =>
                                setStageFilter(e.target.value)
                            }
                        >
                            <option value="All">
                                All Stages
                            </option>

                            <option value="New">
                                New
                            </option>

                            <option value="Qualified">
                                Qualified
                            </option>

                            <option value="Proposal Sent">
                                Proposal Sent
                            </option>

                            <option value="Negotiation">
                                Negotiation
                            </option>

                            <option value="Won">
                                Won
                            </option>

                            <option value="Lost">
                                Lost
                            </option>

                        </select>

                    </div>

                </div>

                <div className="opportunities-table-container">

                    <table className="opportunities-table">

                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Opportunity</th>
                                <th>Account</th>
                                <th>Contact</th>
                                <th>Employee</th>
                                <th>Stage</th>
                                <th>Revenue</th>
                                <th>Probability</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="opportunity-table-message"
                                    >
                                        Loading opportunities...
                                    </td>
                                </tr>
                            ) : filteredOpportunities.length > 0 ? (
                                filteredOpportunities.map(
                                    (opportunity) => (
                                        <tr
                                            key={
                                                opportunity.opportunity_id
                                            }
                                        >

                                            <td>
                                                <span className="opportunity-id">
                                                    #
                                                    {
                                                        opportunity.opportunity_id
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="opportunity-name-cell">

                                                    <div className="opportunity-avatar">
                                                        {opportunity
                                                            .opportunity_name
                                                            ?.charAt(0)
                                                            .toUpperCase() ||
                                                            "O"}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                opportunity.opportunity_name
                                                            }
                                                        </strong>

                                                        <small>
                                                            {
                                                                opportunity.opportunity_type ||
                                                                "Sales Opportunity"
                                                            }
                                                        </small>
                                                    </div>

                                                </div>
                                            </td>

                                            <td>
                                                <span className="opportunity-account">
                                                    {getAccountName(
                                                        opportunity.account_id
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="opportunity-contact">
                                                    {getContactName(
                                                        opportunity.contact_id
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="opportunity-employee">
                                                    {getEmployeeName(
                                                        opportunity.assigned_employee_id
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`opportunity-stage ${getStageClass(
                                                        opportunity.stage
                                                    )}`}
                                                >
                                                    <span className="stage-dot"></span>

                                                    {
                                                        opportunity.stage
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="opportunity-revenue">
                                                    ₹
                                                    {Number(
                                                        opportunity.expected_revenue ||
                                                        0
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="opportunity-probability">
                                                    {
                                                        opportunity.probability ||
                                                        0
                                                    }
                                                    %
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`opportunity-status ${
                                                        opportunity.status
                                                            ?.toLowerCase()
                                                            .replace(
                                                                " ",
                                                                "-"
                                                            ) || "open"
                                                    }`}
                                                >
                                                    {
                                                        opportunity.status
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="opportunity-actions">

                                                    <button
                                                        className="opportunity-edit"
                                                        onClick={() =>
                                                            handleEdit(
                                                                opportunity
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="opportunity-delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                opportunity.opportunity_id
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
                                        colSpan="10"
                                        className="opportunity-table-message"
                                    >
                                        No opportunities found
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

export default Opportunities;   