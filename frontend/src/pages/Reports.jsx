import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import "./Reports.css";

function Reports() {
    const [summary, setSummary] = useState({});
    const [selectedReport, setSelectedReport] = useState("summary");
    const [reportData, setReportData] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [filters, setFilters] = useState({
        status: "",
        company_id: "",
        employee_id: "",
        customer_id: "",
        lead_source: "",
        start_date: "",
        end_date: ""
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const reportCards = [
        {
            key: "customers",
            title: "Customer Reports",
            value: summary.customers || 0,
            icon: "👥"
        },
        {
            key: "employees",
            title: "Employee Reports",
            value: summary.employees || 0,
            icon: "👨‍💼"
        },
        {
            key: "companies",
            title: "Company Reports",
            value: summary.companies || 0,
            icon: "🏢"
        },
        {
            key: "leads",
            title: "Lead Reports",
            value: summary.leads || 0,
            icon: "🎯"
        },
        {
            key: "opportunities",
            title: "Opportunity Reports",
            value: summary.opportunities || 0,
            icon: "💼"
        },
        {
            key: "activities",
            title: "Activity Reports",
            value: summary.activities || 0,
            icon: "📋"
        },
        {
            key: "tasks",
            title: "Task Reports",
            value: summary.tasks || 0,
            icon: "✅"
        },
        {
            key: "meetings",
            title: "Meeting Reports",
            value: summary.meetings || 0,
            icon: "📅"
        },
        {
            key: "visits",
            title: "Visit Reports",
            value: summary.visits || 0,
            icon: "🚗"
        },
        {
            key: "attendance",
            title: "Attendance Reports",
            value: summary.check_ins || 0,
            icon: "🕘"
        },
        {
            key: "geo",
            title: "Geo Tracking Reports",
            value: summary.check_ins + summary.check_outs || 0,
            icon: "📍"
        }
    ];

    const reportTitles = {
        customers: "Customer Reports",
        employees: "Employee Reports",
        companies: "Company Reports",
        leads: "Lead Reports",
        opportunities: "Opportunity Reports",
        activities: "Activity Reports",
        tasks: "Task Reports",
        meetings: "Meeting Reports",
        visits: "Visit Reports",
        attendance: "Attendance Reports",
        geo: "Geo Tracking Reports"
    };

    const reportDescriptions = {
        customers: "Customer directory, ownership, status and industry analysis",
        employees: "Employee performance and employee records",
        companies: "Company master and company status report",
        leads: "Lead summary, source, conversion and performance",
        opportunities: "Pipeline, revenue, won, lost and aging analysis",
        activities: "Activity summary, employee activity and customer interaction",
        tasks: "Task summary, pending, overdue and completion reports",
        meetings: "Meeting summary, employee, customer and outcome reports",
        visits: "Daily, customer, employee and outcome visit reports",
        attendance: "Daily attendance and working hours",
        geo: "Employee location and GPS tracking history"
    };

    const loadSummary = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await apiFetch("/reports/summary");

            if (!response.ok) {
                throw new Error("Unable to load summary");
            }

            const data = await response.json();

            setSummary(data);
            setReportData([]);
        } catch (err) {
            console.error(err);
            setError("Unable to load report summary.");
        } finally {
            setLoading(false);
        }
    };

    const loadLookups = async () => {
        try {
            const [companyResponse, employeeResponse] = await Promise.all([
                apiFetch("/companies/"),
                apiFetch("/employees/")
            ]);

            if (companyResponse.ok) {
                setCompanies(await companyResponse.json());
            }

            if (employeeResponse.ok) {
                setEmployees(await employeeResponse.json());
            }
        } catch (err) {
            console.error("Lookup error:", err);
        }
    };

    const buildQuery = () => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== "" && value !== null && value !== undefined) {
                params.append(key, value);
            }
        });

        return params.toString();
    };

    const loadReport = async (
        type = selectedReport,
        customFilters = filters
    ) => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            Object.entries(customFilters).forEach(([key, value]) => {
                if (
                    value !== "" &&
                    value !== null &&
                    value !== undefined
                ) {
                    params.append(key, value);
                }
            });

            const query = params.toString();

            const url = query
                ? `/reports/${type}?${query}`
                : `/reports/${type}`;

            const response = await apiFetch(url);

            if (!response.ok) {
                const data = await response.json().catch(() => null);

                throw new Error(
                    data?.detail || "Failed to load report"
                );
            }

            const data = await response.json();

            setReportData(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (err) {
            console.error(err);
            setError(
                err.message ||
                "Unable to load selected report."
            );

            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSummary();
        loadLookups();
    }, []);

    const openReport = (type) => {
        setSelectedReport(type);

        const clearedFilters = {
            status: "",
            company_id: "",
            employee_id: "",
            customer_id: "",
            lead_source: "",
            start_date: "",
            end_date: ""
        };

        setFilters(clearedFilters);
        loadReport(type, clearedFilters);
    };

    const handleFilterChange = (key, value) => {
        setFilters((previous) => ({
            ...previous,
            [key]: value
        }));
    };

    const applyFilters = () => {
        loadReport(selectedReport, filters);
    };

    const clearFilters = () => {
        const clearedFilters = {
            status: "",
            company_id: "",
            employee_id: "",
            customer_id: "",
            lead_source: "",
            start_date: "",
            end_date: ""
        };

        setFilters(clearedFilters);
        loadReport(selectedReport, clearedFilters);
    };

    const downloadFile = async (format) => {
        if (selectedReport === "summary") {
            alert("Open a report first to export it.");
            return;
        }

        try {
            const query = buildQuery();

            const url =
                `/reports/export/${selectedReport}?format=${format}` +
                (query ? `&${query}` : "");

            const response = await apiFetch(url);

            if (!response.ok) {
                const data = await response.json().catch(() => null);

                alert(
                    data?.detail ||
                    `Unable to export ${format.toUpperCase()} report.`
                );

                return;
            }

            const blob = await response.blob();

            const downloadUrl =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = downloadUrl;

            link.download =
                `CRM360_${selectedReport}_Report.${format}`;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error(err);
            alert("Report download failed.");
        }
    };

    const getId = (item) => {
        return (
            item.customer_id ||
            item.employee_id ||
            item.company_id ||
            item.lead_id ||
            item.opportunity_id ||
            item.activity_id ||
            item.task_id ||
            item.meeting_id ||
            item.visit_id ||
            item.location_id ||
            "-"
        );
    };

    const getName = (item) => {
        return (
            item.customer_name ||
            item.employee_name ||
            item.company_name ||
            item.lead_name ||
            item.opportunity_name ||
            item.activity_name ||
            item.task_name ||
            item.meeting_title ||
            item.visit_outcome ||
            item.tracking_type ||
            "-"
        );
    };

    const getStatus = (item) => {
        return (
            item.status ||
            item.visit_status ||
            item.tracking_type ||
            "-"
        );
    };

    const getDate = (item) => {
        return (
            item.created_date ||
            item.activity_date ||
            item.task_date ||
            item.meeting_date ||
            item.visit_date ||
            item.tracking_time ||
            item.start_time ||
            "-"
        );
    };

    const getEmployeeName = (item) => {
        if (!item.employee_id) {
            return "-";
        }

        const employee = employees.find(
            (employeeItem) =>
                Number(employeeItem.employee_id) ===
                Number(item.employee_id)
        );

        return employee?.employee_name || item.employee_id;
    };

    const showStatus =
        !["employees", "companies", "attendance", "geo"].includes(
            selectedReport
        );

    const showCompany =
        !["companies", "attendance", "geo"].includes(
            selectedReport
        );

    const showEmployee =
        selectedReport !== "companies";

    const showLeadSource =
        selectedReport === "leads";

    if (loading && selectedReport === "summary") {
        return (
            <div className="reports-page">
                <div className="report-loading">
                    Loading CRM reports...
                </div>
            </div>
        );
    }

    return (
        <div className="reports-page">

            <div className="reports-header">

                <div>
                    <span className="reports-eyebrow">
                        CRM 360 ANALYTICS
                    </span>

                    <h1>Reports & Analytics</h1>

                    <p>
                        Monitor sales, customers, productivity,
                        field operations and attendance.
                    </p>
                </div>

                {selectedReport !== "summary" && (
                    <div className="report-export-actions">

                        <button
                            className="export-btn csv"
                            onClick={() =>
                                downloadFile("csv")
                            }
                        >
                            CSV
                        </button>

                        <button
                            className="export-btn excel"
                            onClick={() =>
                                downloadFile("xlsx")
                            }
                        >
                            Excel
                        </button>

                        <button
                            className="export-btn pdf"
                            onClick={() =>
                                downloadFile("pdf")
                            }
                        >
                            PDF
                        </button>

                    </div>
                )}

            </div>

            {error && (
                <div className="report-error">
                    {error}
                </div>
            )}

            {selectedReport === "summary" ? (

                <>
                    <div className="reports-summary-banner">

                        <div>
                            <span>Total CRM Records</span>

                            <strong>
                                {Object.values(summary).reduce(
                                    (total, value) =>
                                        total +
                                        Number(value || 0),
                                    0
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Visits</span>
                            <strong>
                                {summary.visits || 0}
                            </strong>
                        </div>

                        <div>
                            <span>Check-Ins</span>
                            <strong>
                                {summary.check_ins || 0}
                            </strong>
                        </div>

                        <div>
                            <span>Check-Outs</span>
                            <strong>
                                {summary.check_outs || 0}
                            </strong>
                        </div>

                    </div>

                    <div className="reports-grid">

                        {reportCards.map((card) => (

                            <button
                                className="report-card"
                                key={card.key}
                                onClick={() =>
                                    openReport(card.key)
                                }
                            >

                                <div className="report-icon">
                                    {card.icon}
                                </div>

                                <div className="report-card-content">

                                    <span>
                                        {card.title}
                                    </span>

                                    <strong>
                                        {card.value}
                                    </strong>

                                    <small>
                                        View detailed report →
                                    </small>

                                </div>

                            </button>

                        ))}

                    </div>

                    <div className="report-category-section">

                        <h2>
                            Reports covered by SRS
                        </h2>

                        <div className="category-list">

                            <span>Lead Reports</span>
                            <span>Customer Reports</span>
                            <span>Opportunity Reports</span>
                            <span>Activity Reports</span>
                            <span>Task Reports</span>
                            <span>Meeting Reports</span>
                            <span>Visit Reports</span>
                            <span>Attendance Reports</span>
                            <span>Geo Tracking Reports</span>

                        </div>

                    </div>
                </>

            ) : (

                <div className="report-detail">

                    <div className="report-detail-header">

                        <div>

                            <button
                                className="back-report-btn"
                                onClick={() => {
                                    setSelectedReport("summary");
                                    setReportData([]);
                                    loadSummary();
                                }}
                            >
                                ← Back to Reports
                            </button>

                            <h2>
                                {reportTitles[selectedReport]}
                            </h2>

                            <p>
                                {reportDescriptions[selectedReport]}
                            </p>

                        </div>

                        <button
                            className="refresh-report-btn"
                            onClick={() =>
                                loadReport(
                                    selectedReport,
                                    filters
                                )
                            }
                        >
                            🔄 Refresh
                        </button>

                    </div>

                    <div className="report-filters">

                        <div className="filter-title">
                            Report Filters
                        </div>

                        {showStatus && (
                            <div className="filter-group">

                                <label>Status</label>

                                <select
                                    value={filters.status}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "status",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        All Statuses
                                    </option>

                                    <option value="New">
                                        New
                                    </option>

                                    <option value="Open">
                                        Open
                                    </option>

                                    <option value="Active">
                                        Active
                                    </option>

                                    <option value="Inactive">
                                        Inactive
                                    </option>

                                    <option value="Won">
                                        Won
                                    </option>

                                    <option value="Lost">
                                        Lost
                                    </option>

                                    <option value="Pending">
                                        Pending
                                    </option>

                                    <option value="Completed">
                                        Completed
                                    </option>

                                    <option value="In Progress">
                                        In Progress
                                    </option>

                                    <option value="Cancelled">
                                        Cancelled
                                    </option>

                                </select>

                            </div>
                        )}

                        {showCompany && (
                            <div className="filter-group">

                                <label>Company</label>

                                <select
                                    value={filters.company_id}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "company_id",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        All Companies
                                    </option>

                                    {companies.map((company) => (
                                        <option
                                            key={
                                                company.company_id
                                            }
                                            value={
                                                company.company_id
                                            }
                                        >
                                            {
                                                company.company_name
                                            }
                                        </option>
                                    ))}

                                </select>

                            </div>
                        )}

                        {showEmployee && (
                            <div className="filter-group">

                                <label>Employee</label>

                                <select
                                    value={filters.employee_id}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "employee_id",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        All Employees
                                    </option>

                                    {employees.map((employee) => (
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
                                    ))}

                                </select>

                            </div>
                        )}

                        {showLeadSource && (
                            <div className="filter-group">

                                <label>Lead Source</label>

                                <select
                                    value={filters.lead_source}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "lead_source",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        All Sources
                                    </option>

                                    <option value="Website">
                                        Website
                                    </option>

                                    <option value="Referral">
                                        Referral
                                    </option>

                                    <option value="Social Media">
                                        Social Media
                                    </option>

                                    <option value="Advertisement">
                                        Advertisement
                                    </option>

                                    <option value="Cold Call">
                                        Cold Call
                                    </option>

                                    <option value="Email">
                                        Email
                                    </option>

                                </select>

                            </div>
                        )}

                        <div className="filter-group">

                            <label>From Date</label>

                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "start_date",
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="filter-group">

                            <label>To Date</label>

                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "end_date",
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="filter-actions">

                            <button
                                className="apply-filter-btn"
                                onClick={applyFilters}
                            >
                                Apply Filters
                            </button>

                            <button
                                className="clear-filter-btn"
                                onClick={clearFilters}
                            >
                                Clear
                            </button>

                        </div>

                    </div>

                    <div className="report-result-header">

                        <div>
                            <span>
                                Records Found
                            </span>

                            <strong>
                                {reportData.length}
                            </strong>
                        </div>

                        <div className="quick-export">

                            <button
                                onClick={() =>
                                    downloadFile("csv")
                                }
                            >
                                CSV
                            </button>

                            <button
                                onClick={() =>
                                    downloadFile("xlsx")
                                }
                            >
                                Excel
                            </button>

                            <button
                                onClick={() =>
                                    downloadFile("pdf")
                                }
                            >
                                PDF
                            </button>

                        </div>

                    </div>

                    {loading ? (

                        <div className="report-loading">
                            Loading report...
                        </div>

                    ) : reportData.length === 0 ? (

                        <div className="no-report-data">

                            <div className="empty-icon">
                                📊
                            </div>

                            <h3>
                                No records found
                            </h3>

                            <p>
                                Try changing the selected filters.
                            </p>

                        </div>

                    ) : (

                        <div className="report-table-wrapper">

                            <table className="report-table">

                                <thead>

                                    <tr>
                                        <th>ID</th>

                                        {selectedReport !== "attendance" &&
                                            selectedReport !== "geo" && (
                                                <th>Name / Title</th>
                                            )}

                                        {selectedReport === "attendance" ||
                                            selectedReport === "geo" ? (
                                                <>
                                                    <th>Employee</th>
                                                    <th>Tracking Type</th>
                                                    <th>Latitude</th>
                                                    <th>Longitude</th>
                                                    <th>Date / Time</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </>
                                            )}

                                    </tr>

                                </thead>

                                <tbody>

                                    {reportData.map(
                                        (item, index) => (

                                            <tr
                                                key={
                                                    getId(item) +
                                                    "-" +
                                                    index
                                                }
                                            >

                                                <td>
                                                    {getId(item)}
                                                </td>

                                                {selectedReport !== "attendance" &&
                                                    selectedReport !== "geo" && (
                                                        <td>
                                                            {getName(item)}
                                                        </td>
                                                    )}

                                                {selectedReport === "attendance" ||
                                                    selectedReport === "geo" ? (
                                                        <>
                                                            <td>
                                                                {getEmployeeName(
                                                                    item
                                                                )}
                                                            </td>

                                                            <td>
                                                                <span className="status-badge">
                                                                    {
                                                                        item.tracking_type
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.latitude
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.longitude
                                                                }
                                                            </td>

                                                            <td>
                                                                {
                                                                    item.tracking_time
                                                                }
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td>
                                                                <span className="status-badge">
                                                                    {getStatus(
                                                                        item
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                {getDate(
                                                                    item
                                                                )}
                                                            </td>
                                                        </>
                                                    )}

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>
            )}

        </div>
    );
}

export default Reports;