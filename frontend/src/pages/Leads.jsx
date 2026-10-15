import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./Leads.css";

function Leads() {
    const [leads, setLeads] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [showForm, setShowForm] = useState(false);
    const [editingLeadId, setEditingLeadId] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showConvertModal, setShowConvertModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [converting, setConverting] = useState(false);

    const [formData, setFormData] = useState({
        lead_name: "",
        company_name: "",
        contact_person: "",
        mobile_number: "",
        email_address: "",
        lead_source: "",
        industry: "",
        status: "New",
        assigned_employee_id: "",
        expected_revenue: "",
        remarks: ""
    });

    const resetForm = () => {
        setFormData({
            lead_name: "",
            company_name: "",
            contact_person: "",
            mobile_number: "",
            email_address: "",
            lead_source: "",
            industry: "",
            status: "New",
            assigned_employee_id: "",
            expected_revenue: "",
            remarks: ""
        });

        setEditingLeadId(null);
    };

    const fetchLeads = async () => {
        try {
            setLoading(true);

            const response = await apiFetch("/leads/");

            if (!response.ok) {
                console.error("Leads API error:", response.status);
                setLeads([]);
                return;
            }

            const data = await response.json();

            setLeads(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading leads:", error);
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await apiFetch("/employees/");

            if (!response.ok) {
                console.error("Employees API error:", response.status);
                return;
            }

            const data = await response.json();

            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading employees:", error);
            setEmployees([]);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await apiFetch("/companies/");

            if (!response.ok) {
                console.error("Companies API error:", response.status);
                return;
            }

            const data = await response.json();

            setCompanies(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading companies:", error);
            setCompanies([]);
        }
    };

    useEffect(() => {
        fetchLeads();
        fetchEmployees();
        fetchCompanies();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleEdit = (lead) => {
        setEditingLeadId(lead.lead_id);

        setFormData({
            lead_name: lead.lead_name || "",
            company_name: lead.company_name || "",
            contact_person: lead.contact_person || "",
            mobile_number: lead.mobile_number || "",
            email_address: lead.email_address || "",
            lead_source: lead.lead_source || "",
            industry: lead.industry || "",
            status: lead.status || "New",
            assigned_employee_id: lead.assigned_employee_id || "",
            expected_revenue: lead.expected_revenue ?? "",
            remarks: lead.remarks || ""
        });

        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const requestData = {
                ...formData,
                assigned_employee_id: Number(formData.assigned_employee_id),
                expected_revenue:
                    formData.expected_revenue !== ""
                        ? Number(formData.expected_revenue)
                        : null
            };

            let response;

            if (editingLeadId) {
                response = await apiFetch(
                    `/leads/${editingLeadId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(requestData)
                    }
                );
            } else {
                response = await apiFetch(
                    "/leads/",
                    {
                        method: "POST",
                        body: JSON.stringify(requestData)
                    }
                );
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);

                console.error("Backend error:", errorData);

                alert(
                    errorData?.detail ||
                    "Failed to save lead."
                );

                return;
            }

            resetForm();
            setShowForm(false);

            await fetchLeads();
        } catch (error) {
            console.error("Error saving lead:", error);
            alert("Failed to save lead. Check backend.");
        }
    };

    const handleDelete = async (leadId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this lead?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await apiFetch(
                `/leads/${leadId}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);

                alert(
                    errorData?.detail ||
                    "Failed to delete lead."
                );

                return;
            }

            await fetchLeads();
        } catch (error) {
            console.error("Error deleting lead:", error);
            alert("Failed to delete lead.");
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        resetForm();
    };

    const openConvertModal = (lead) => {
        if (lead.status !== "Won") {
            alert("Only Won leads can be converted.");
            return;
        }

        setSelectedLead(lead);
        setSelectedCompanyId("");
        setShowConvertModal(true);
    };

    const closeConvertModal = () => {
        if (converting) {
            return;
        }

        setShowConvertModal(false);
        setSelectedLead(null);
        setSelectedCompanyId("");
    };

    const handleConvert = async () => {
        if (!selectedLead) {
            return;
        }

        if (!selectedCompanyId) {
            alert("Please select a company.");
            return;
        }

        const selectedCompany = companies.find(
            (company) =>
                Number(company.company_id) ===
                Number(selectedCompanyId)
        );

        const confirmConversion = window.confirm(
            `Convert "${selectedLead.lead_name}" into a Customer and Account under "${selectedCompany?.company_name || "selected company"}"?`
        );

        if (!confirmConversion) {
            return;
        }

        try {
            setConverting(true);

            const response = await apiFetch(
                `/leads/${selectedLead.lead_id}/convert?company_id=${selectedCompanyId}`,
                {
                    method: "POST"
                }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                alert(
                    data?.detail ||
                    "Lead conversion failed."
                );

                return;
            }

            alert(
                `Lead converted successfully.\nCustomer ID: ${data.customer_id}\nAccount ID: ${data.account_id}`
            );

            setShowConvertModal(false);
            setSelectedLead(null);
            setSelectedCompanyId("");

            await fetchLeads();
        } catch (error) {
            console.error("Conversion error:", error);
            alert("Lead conversion failed. Check backend.");
        } finally {
            setConverting(false);
        }
    };

    const filteredLeads = leads.filter((lead) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            lead.lead_name?.toLowerCase().includes(searchText) ||
            lead.company_name?.toLowerCase().includes(searchText) ||
            lead.email_address?.toLowerCase().includes(searchText) ||
            lead.contact_person?.toLowerCase().includes(searchText) ||
            lead.lead_source?.toLowerCase().includes(searchText) ||
            lead.status?.toLowerCase().includes(searchText);

        const matchesStatus =
            statusFilter === "All" ||
            lead.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalLeads = leads.length;

    const newLeads = leads.filter(
        (lead) => lead.status === "New"
    ).length;

    const qualifiedLeads = leads.filter(
        (lead) => lead.status === "Qualified"
    ).length;

    const wonLeads = leads.filter(
        (lead) => lead.status === "Won"
    ).length;

    const convertedLeads = leads.filter(
        (lead) => lead.status === "Converted"
    ).length;

    const getStatusClass = (status) => {
        switch (status) {
            case "New":
                return "new";

            case "Contacted":
                return "contacted";

            case "Qualified":
                return "qualified";

            case "Proposal Sent":
                return "proposal";

            case "Negotiation":
                return "negotiation";

            case "Won":
                return "won";

            case "Converted":
                return "converted";

            case "Lost":
                return "lost";

            default:
                return "new";
        }
    };

    return (
        <div className="leads-page">

            <div className="leads-header">

                <div>
                    <div className="leads-label">
                        SALES MANAGEMENT
                    </div>

                    <h1>Leads</h1>

                    <p>
                        Manage, track and convert your potential customers
                    </p>
                </div>

                <button
                    className="add-lead-btn"
                    onClick={() => {
                        if (showForm) {
                            handleCancel();
                        } else {
                            resetForm();
                            setShowForm(true);
                        }
                    }}
                >
                    {showForm ? "Close Form" : "+ Add Lead"}
                </button>

            </div>

            <div className="lead-summary">

                <div className="lead-summary-card">
                    <div className="lead-summary-icon total">
                        👥
                    </div>

                    <div>
                        <span>Total Leads</span>
                        <strong>{totalLeads}</strong>
                    </div>
                </div>

                <div className="lead-summary-card">
                    <div className="lead-summary-icon new-icon">
                        ✨
                    </div>

                    <div>
                        <span>New Leads</span>
                        <strong>{newLeads}</strong>
                    </div>
                </div>

                <div className="lead-summary-card">
                    <div className="lead-summary-icon qualified-icon">
                        ✓
                    </div>

                    <div>
                        <span>Qualified</span>
                        <strong>{qualifiedLeads}</strong>
                    </div>
                </div>

                <div className="lead-summary-card">
                    <div className="lead-summary-icon won-icon">
                        ★
                    </div>

                    <div>
                        <span>Won Leads</span>
                        <strong>{wonLeads}</strong>
                    </div>
                </div>

                <div className="lead-summary-card">
                    <div className="lead-summary-icon converted-icon">
                        ✓
                    </div>

                    <div>
                        <span>Converted</span>
                        <strong>{convertedLeads}</strong>
                    </div>
                </div>

            </div>

            {showForm && (
                <div className="lead-form-card">

                    <div className="lead-form-heading">

                        <div>
                            <span>
                                {editingLeadId
                                    ? "UPDATE RECORD"
                                    : "NEW RECORD"}
                            </span>

                            <h2>
                                {editingLeadId
                                    ? "Edit Lead"
                                    : "Add New Lead"}
                            </h2>
                        </div>

                        <button
                            className="lead-close-btn"
                            onClick={handleCancel}
                            type="button"
                        >
                            ×
                        </button>

                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="lead-form-grid">

                            <div className="lead-form-group">

                                <label>Lead Name *</label>

                                <input
                                    type="text"
                                    name="lead_name"
                                    placeholder="Enter lead name"
                                    value={formData.lead_name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="lead-form-group">

                                <label>Company Name</label>

                                <input
                                    type="text"
                                    name="company_name"
                                    placeholder="Enter company name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="lead-form-group">

                                <label>Contact Person *</label>

                                <input
                                    type="text"
                                    name="contact_person"
                                    placeholder="Enter contact person"
                                    value={formData.contact_person}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="lead-form-group">

                                <label>Mobile Number *</label>

                                <input
                                    type="text"
                                    name="mobile_number"
                                    placeholder="Enter mobile number"
                                    value={formData.mobile_number}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="lead-form-group">

                                <label>Email Address</label>

                                <input
                                    type="email"
                                    name="email_address"
                                    placeholder="Enter email address"
                                    value={formData.email_address}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="lead-form-group">

                                <label>Lead Source *</label>

                                <input
                                    type="text"
                                    name="lead_source"
                                    placeholder="Website, Referral, Call..."
                                    value={formData.lead_source}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="lead-form-group">

                                <label>Industry</label>

                                <input
                                    type="text"
                                    name="industry"
                                    placeholder="Enter industry"
                                    value={formData.industry}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="lead-form-group">

                                <label>Status</label>

                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="New">
                                        New
                                    </option>

                                    <option value="Contacted">
                                        Contacted
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

                            <div className="lead-form-group">

                                <label>Assigned Employee *</label>

                                <select
                                    name="assigned_employee_id"
                                    value={formData.assigned_employee_id}
                                    onChange={handleChange}
                                    required
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

                            <div className="lead-form-group">

                                <label>Expected Revenue</label>

                                <input
                                    type="number"
                                    name="expected_revenue"
                                    placeholder="Enter expected revenue"
                                    value={formData.expected_revenue}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="lead-form-group lead-full-width">

                                <label>Remarks</label>

                                <textarea
                                    name="remarks"
                                    placeholder="Add additional information..."
                                    value={formData.remarks}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>

                        <div className="lead-form-actions">

                            <button
                                type="button"
                                className="lead-cancel-btn"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="lead-save-btn"
                            >
                                {editingLeadId
                                    ? "Update Lead"
                                    : "Save Lead"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

            <div className="lead-list-card">

                <div className="lead-list-header">

                    <div>
                        <span>LEAD DIRECTORY</span>

                        <h2>
                            All Leads
                            <small>
                                {filteredLeads.length} records
                            </small>
                        </h2>
                    </div>

                    <div className="lead-list-tools">

                        <div className="lead-search-box">

                            <span>⌕</span>

                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />

                            {search && (
                                <button
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    type="button"
                                >
                                    ×
                                </button>
                            )}

                        </div>

                        <select
                            className="lead-filter"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                        >
                            <option value="All">
                                All Status
                            </option>

                            <option value="New">
                                New
                            </option>

                            <option value="Contacted">
                                Contacted
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

                            <option value="Converted">
                                Converted
                            </option>

                            <option value="Lost">
                                Lost
                            </option>

                        </select>

                    </div>

                </div>

                <div className="leads-table-container">

                    <table className="leads-table">

                        <thead>

                            <tr>
                                <th>ID</th>
                                <th>Lead</th>
                                <th>Company</th>
                                <th>Contact</th>
                                <th>Source</th>
                                <th>Status</th>
                                <th>Revenue</th>
                                <th>Actions</th>
                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="lead-table-message"
                                    >
                                        Loading leads...
                                    </td>
                                </tr>
                            ) : filteredLeads.length > 0 ? (
                                filteredLeads.map((lead) => (
                                    <tr key={lead.lead_id}>

                                        <td>
                                            <span className="lead-id">
                                                #{lead.lead_id}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="lead-name-cell">

                                                <div className="lead-avatar">
                                                    {lead.lead_name
                                                        ?.charAt(0)
                                                        .toUpperCase() || "L"}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {lead.lead_name || "-"}
                                                    </strong>

                                                    <small>
                                                        {lead.email_address ||
                                                            "No email"}
                                                    </small>
                                                </div>

                                            </div>
                                        </td>

                                        <td>
                                            <div className="lead-company">
                                                {lead.company_name || "-"}
                                            </div>
                                        </td>

                                        <td>
                                            <div className="lead-contact">

                                                <strong>
                                                    {lead.contact_person || "-"}
                                                </strong>

                                                <small>
                                                    {lead.mobile_number || ""}
                                                </small>

                                            </div>
                                        </td>

                                        <td>
                                            <span className="lead-source">
                                                {lead.lead_source || "-"}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`lead-status ${getStatusClass(
                                                    lead.status
                                                )}`}
                                            >
                                                <span className="status-dot"></span>

                                                {lead.status || "New"}
                                            </span>
                                        </td>

                                        <td>
                                            {lead.expected_revenue !== null &&
                                            lead.expected_revenue !== undefined &&
                                            lead.expected_revenue !== "" ? (
                                                <span className="lead-revenue">
                                                    ₹
                                                    {Number(
                                                        lead.expected_revenue
                                                    ).toLocaleString("en-IN")}
                                                </span>
                                            ) : (
                                                <span className="no-revenue">
                                                    -
                                                </span>
                                            )}
                                        </td>

                                        <td>

                                            <div className="lead-actions">

                                                <button
                                                    className="lead-edit"
                                                    onClick={() =>
                                                        handleEdit(lead)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                {lead.status === "Won" && (
                                                    <button
                                                        className="lead-convert"
                                                        onClick={() =>
                                                            openConvertModal(
                                                                lead
                                                            )
                                                        }
                                                    >
                                                        Convert
                                                    </button>
                                                )}

                                                <button
                                                    className="lead-delete"
                                                    onClick={() =>
                                                        handleDelete(
                                                            lead.lead_id
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="lead-table-message"
                                    >
                                        No leads found
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {showConvertModal && selectedLead && (
                <div className="convert-modal-overlay">

                    <div className="convert-modal">

                        <div className="convert-modal-header">

                            <div>
                                <span>
                                    LEAD CONVERSION
                                </span>

                                <h2>
                                    Convert Lead
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeConvertModal}
                                disabled={converting}
                                className="convert-modal-close"
                            >
                                ×
                            </button>

                        </div>

                        <div className="convert-modal-body">

                            <div className="conversion-lead-info">

                                <strong>
                                    {selectedLead.lead_name}
                                </strong>

                                <span>
                                    {selectedLead.company_name ||
                                        "No company name"}
                                </span>

                                <span>
                                    {selectedLead.contact_person}
                                </span>

                            </div>

                            <div className="conversion-flow">

                                <div className="conversion-step">
                                    <strong>Lead</strong>
                                    <span>Won</span>
                                </div>

                                <div className="conversion-arrow">
                                    →
                                </div>

                                <div className="conversion-step">
                                    <strong>Customer</strong>
                                    <span>Created</span>
                                </div>

                                <div className="conversion-arrow">
                                    →
                                </div>

                                <div className="conversion-step">
                                    <strong>Account</strong>
                                    <span>Created</span>
                                </div>

                            </div>

                            <div className="lead-form-group">

                                <label>
                                    Select Company *
                                </label>

                                <select
                                    value={selectedCompanyId}
                                    onChange={(e) =>
                                        setSelectedCompanyId(
                                            e.target.value
                                        )
                                    }
                                    disabled={converting}
                                >

                                    <option value="">
                                        Select company
                                    </option>

                                    {companies
                                        .filter(
                                            (company) =>
                                                company.status === "Active"
                                        )
                                        .map((company) => (
                                            <option
                                                key={
                                                    company.company_id
                                                }
                                                value={
                                                    company.company_id
                                                }
                                            >
                                                {company.company_name}
                                            </option>
                                        ))}

                                </select>

                            </div>

                            <div className="conversion-warning">
                                The lead must have a valid contact person,
                                mobile number and active assigned employee.
                            </div>

                        </div>

                        <div className="convert-modal-actions">

                            <button
                                type="button"
                                className="lead-cancel-btn"
                                onClick={closeConvertModal}
                                disabled={converting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="lead-save-btn"
                                onClick={handleConvert}
                                disabled={converting}
                            >
                                {converting
                                    ? "Converting..."
                                    : "Convert Lead"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Leads;