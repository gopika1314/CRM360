import { useEffect, useState } from "react";
import "./AuditLogs.css";
import { apiFetch } from "../api";

function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("ALL");
    const [moduleFilter, setModuleFilter] = useState("ALL");

    const [currentPage, setCurrentPage] = useState(1);

    const recordsPerPage = 10;

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await apiFetch("/audit-logs/");

            if (!response.ok) {
                throw new Error("Failed to load audit logs");
            }

            const data = await response.json();
            setLogs(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getActionClass = (action) => {
        if (action === "CREATE") {
            return "audit-create";
        }

        if (
            action === "UPDATE" ||
            action === "UPDATE_ROLE"
        ) {
            return "audit-update";
        }

        if (action === "DELETE") {
            return "audit-delete";
        }

        return "audit-other";
    };

    const filteredLogs = logs.filter((log) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            !search ||
            String(log.username || "")
                .toLowerCase()
                .includes(searchText) ||
            String(log.module || "")
                .toLowerCase()
                .includes(searchText) ||
            String(log.action || "")
                .toLowerCase()
                .includes(searchText) ||
            String(log.description || "")
                .toLowerCase()
                .includes(searchText);

        const matchesAction =
            actionFilter === "ALL" ||
            log.action === actionFilter;

        const matchesModule =
            moduleFilter === "ALL" ||
            log.module === moduleFilter;

        return (
            matchesSearch &&
            matchesAction &&
            matchesModule
        );
    });

    const createCount = logs.filter(
        (log) => log.action === "CREATE"
    ).length;

    const updateCount = logs.filter(
        (log) =>
            log.action === "UPDATE" ||
            log.action === "UPDATE_ROLE"
    ).length;

    const deleteCount = logs.filter(
        (log) => log.action === "DELETE"
    ).length;

    const modules = [
        ...new Set(
            logs
                .map((log) => log.module)
                .filter(Boolean)
        )
    ];

    const actions = [
        ...new Set(
            logs
                .map((log) => log.action)
                .filter(Boolean)
        )
    ];

    const totalPages = Math.ceil(
        filteredLogs.length / recordsPerPage
    );

    const startIndex =
        (currentPage - 1) * recordsPerPage;

    const endIndex =
        startIndex + recordsPerPage;

    const currentLogs =
        filteredLogs.slice(startIndex, endIndex);

    const startRecord =
        filteredLogs.length === 0
            ? 0
            : startIndex + 1;

    const endRecord =
        Math.min(endIndex, filteredLogs.length);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleSearch = (value) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleActionFilter = (value) => {
        setActionFilter(value);
        setCurrentPage(1);
    };

    const handleModuleFilter = (value) => {
        setModuleFilter(value);
        setCurrentPage(1);
    };

    return (
        <div className="audit-page">

            <div className="audit-header">
                <div>
                    <h1>Audit Trail</h1>
                    <p>
                        Track important actions performed in CRM360
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchAuditLogs}
                >
                    ↻ Refresh
                </button>
            </div>

            {loading && (
                <div className="audit-message">
                    Loading audit logs...
                </div>
            )}

            {error && (
                <div className="audit-error">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="audit-summary">

                        <div className="audit-summary-card">
                            <div className="summary-icon">
                                📋
                            </div>

                            <div>
                                <span>Total Activities</span>
                                <strong>{logs.length}</strong>
                            </div>
                        </div>

                        <div className="audit-summary-card">
                            <div className="summary-icon create-icon">
                                ✓
                            </div>

                            <div>
                                <span>Created</span>
                                <strong>{createCount}</strong>
                            </div>
                        </div>

                        <div className="audit-summary-card">
                            <div className="summary-icon update-icon">
                                ↻
                            </div>

                            <div>
                                <span>Updated</span>
                                <strong>{updateCount}</strong>
                            </div>
                        </div>

                        <div className="audit-summary-card">
                            <div className="summary-icon delete-icon">
                                ×
                            </div>

                            <div>
                                <span>Deleted</span>
                                <strong>{deleteCount}</strong>
                            </div>
                        </div>

                    </div>

                    <div className="audit-card">

                        <div className="audit-card-header">
                            <div>
                                <h2>Activity History</h2>

                                <span>
                                    Showing {filteredLogs.length} of{" "}
                                    {logs.length} records
                                </span>
                            </div>
                        </div>

                        <div className="audit-filters">

                            <div className="audit-search">
                                <span>🔍</span>

                                <input
                                    type="text"
                                    placeholder="Search user, module or action..."
                                    value={search}
                                    onChange={(e) =>
                                        handleSearch(e.target.value)
                                    }
                                />
                            </div>

                            <select
                                value={actionFilter}
                                onChange={(e) =>
                                    handleActionFilter(e.target.value)
                                }
                            >
                                <option value="ALL">
                                    All Actions
                                </option>

                                {actions.map((action) => (
                                    <option
                                        key={action}
                                        value={action}
                                    >
                                        {action}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={moduleFilter}
                                onChange={(e) =>
                                    handleModuleFilter(e.target.value)
                                }
                            >
                                <option value="ALL">
                                    All Modules
                                </option>

                                {modules.map((module) => (
                                    <option
                                        key={module}
                                        value={module}
                                    >
                                        {module}
                                    </option>
                                ))}
                            </select>

                        </div>

                        {currentLogs.length === 0 ? (
                            <div className="audit-empty">
                                No matching audit records found.
                            </div>
                        ) : (
                            <>
                                <div className="audit-table-container">

                                    <table className="audit-table">

                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Date & Time</th>
                                                <th>User</th>
                                                <th>Module</th>
                                                <th>Action</th>
                                                <th>Record ID</th>
                                                <th>Description</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {currentLogs.map((log) => (
                                                <tr key={log.audit_id}>

                                                    <td>
                                                        <span className="audit-id">
                                                            #{log.audit_id}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {log.created_at
                                                            ? new Date(
                                                                log.created_at
                                                            ).toLocaleString()
                                                            : "-"}
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {log.username || "-"}
                                                        </strong>

                                                        <small>
                                                            User ID:{" "}
                                                            {log.user_id || "-"}
                                                        </small>
                                                    </td>

                                                    <td>
                                                        <span className="module-badge">
                                                            {log.module}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`action-badge ${getActionClass(
                                                                log.action
                                                            )}`}
                                                        >
                                                            {log.action}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {log.record_id || "-"}
                                                    </td>

                                                    <td>
                                                        {log.description || "-"}
                                                    </td>

                                                </tr>
                                            ))}
                                        </tbody>

                                    </table>

                                </div>

                                <div className="audit-pagination">

                                    <div className="pagination-info">
                                        Showing{" "}
                                        <strong>
                                            {startRecord}
                                        </strong>
                                        {" "}to{" "}
                                        <strong>
                                            {endRecord}
                                        </strong>
                                        {" "}of{" "}
                                        <strong>
                                            {filteredLogs.length}
                                        </strong>
                                        {" "}records
                                    </div>

                                    <div className="pagination-controls">

                                        <button
                                            className="pagination-arrow"
                                            disabled={currentPage === 1}
                                            onClick={() =>
                                                goToPage(
                                                    currentPage - 1
                                                )
                                            }
                                        >
                                            ‹
                                        </button>

                                        {Array.from(
                                            {
                                                length: totalPages
                                            },
                                            (_, index) => index + 1
                                        ).map((page) => (
                                            <button
                                                key={page}
                                                className={
                                                    currentPage === page
                                                        ? "pagination-number active"
                                                        : "pagination-number"
                                                }
                                                onClick={() =>
                                                    goToPage(page)
                                                }
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            className="pagination-arrow"
                                            disabled={
                                                currentPage === totalPages
                                            }
                                            onClick={() =>
                                                goToPage(
                                                    currentPage + 1
                                                )
                                            }
                                        >
                                            ›
                                        </button>

                                    </div>

                                </div>
                            </>
                        )}

                    </div>
                </>
            )}

        </div>
    );
}

export default AuditLogs;