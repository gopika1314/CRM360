import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../api";
import "./LocationTracking.css";

function LocationTracking() {
    const [employees, setEmployees] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [contacts, setContacts] = useState([]);

    const [employeeId, setEmployeeId] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [accountId, setAccountId] = useState("");
    const [contactId, setContactId] = useState("");

    const [location, setLocation] = useState(null);
    const [history, setHistory] = useState([]);
    const [visits, setVisits] = useState([]);

    const [visitOutcome, setVisitOutcome] = useState("");
    const [visitRemarks, setVisitRemarks] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [tracking, setTracking] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingVisits, setLoadingVisits] = useState(false);

    const [activeVisit, setActiveVisit] = useState(null);

    const watchIdRef = useRef(null);

    const savedUser = localStorage.getItem("crm360_user");

    let currentUser = null;

    try {
        currentUser = savedUser
            ? JSON.parse(savedUser)
            : null;
    } catch {
        currentUser = null;
    }

    const isEmployee =
        currentUser?.role === "Employee";

    useEffect(() => {
        initializePage();

        return () => {
            stopLocationTracking();
        };
    }, []);

    useEffect(() => {
        if (employeeId) {
            fetchLocationHistory(employeeId);
            fetchVisits(employeeId);
        }
    }, [employeeId]);

    const initializePage = async () => {
        await fetchCustomers();
        await fetchAccounts();
        await fetchContacts();

        if (isEmployee) {
            await fetchMyEmployee();
        } else {
            await fetchEmployees();
        }
    };

    const fetchMyEmployee = async () => {
        try {
            setError("");

            const response = await apiFetch(
                "/employees/me"
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Failed to fetch your employee record."
                );
            }

            setEmployees([data]);

            setEmployeeId(
                String(data.employee_id)
            );

            setMessage(
                `Employee selected automatically: ${getEmployeeDisplayName(data)}`
            );

        } catch (err) {
            console.error(
                "Error fetching my employee:",
                err
            );

            setError(
                err.message ||
                "Failed to fetch your employee record."
            );
        }
    };

    const fetchEmployees = async () => {
        try {
            setError("");

            const response = await apiFetch(
                "/employees/"
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Failed to fetch employees."
                );
            }

            setEmployees(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {
            console.error(
                "Error fetching employees:",
                err
            );

            setError(
                err.message ||
                "Failed to fetch employees."
            );
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await apiFetch(
                "/customers/"
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Failed to fetch customers."
                );
            }

            setCustomers(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {
            console.error(
                "Error fetching customers:",
                err
            );
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await apiFetch(
                "/accounts/"
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Failed to fetch accounts."
                );
            }

            setAccounts(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {
            console.error(
                "Error fetching accounts:",
                err
            );
        }
    };

    const fetchContacts = async () => {
        try {
            const response = await apiFetch(
                "/contacts/"
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Failed to fetch contacts."
                );
            }

            setContacts(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {
            console.error(
                "Error fetching contacts:",
                err
            );
        }
    };

    const fetchLocationHistory = async (
        id = employeeId
    ) => {
        if (!id) {
            setHistory([]);
            return;
        }

        try {
            setLoadingHistory(true);
            setError("");

            const response = await apiFetch(
                `/location/employee/${id}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Failed to load location history."
                );
            }

            setHistory(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {
            setError(
                err.message ||
                "Failed to load location history."
            );
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchVisits = async (
        id = employeeId
    ) => {
        try {
            setLoadingVisits(true);

            const response = await apiFetch(
                "/visits/"
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Failed to load visits."
                );
            }

            let visitData =
                Array.isArray(data)
                    ? data
                    : [];

            if (id) {
                visitData = visitData.filter(
                    (visit) =>
                        Number(visit.employee_id) ===
                        Number(id)
                );
            }

            setVisits(visitData);

            const startedVisit =
                visitData.find(
                    (visit) =>
                        visit.visit_status ===
                        "Started"
                );

            if (startedVisit) {
                setActiveVisit(
                    startedVisit
                );
            } else {
                setActiveVisit(null);
            }

        } catch (err) {
            setError(
                err.message ||
                "Failed to load visits."
            );
        } finally {
            setLoadingVisits(false);
        }
    };

    const sendLiveLocation = async (gps) => {
        if (!employeeId) {
            return;
        }

        try {
            const response = await apiFetch(
                "/location/live",
                {
                    method: "POST",
                    body: JSON.stringify({
                        employee_id:
                            Number(employeeId),

                        latitude:
                            gps.latitude,

                        longitude:
                            gps.longitude,

                        location_address:
                            "Current GPS Location"
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Live location update failed."
                );
            }

            setLocation(gps);

            setMessage(
                "Live location updated successfully."
            );

            setError("");

            await fetchLocationHistory(
                employeeId
            );

        } catch (err) {
            setError(
                err.message ||
                "Live location update failed."
            );
        }
    };

    const startLocationTracking = () => {
        if (!navigator.geolocation) {
            setError(
                "Geolocation is not supported by this browser."
            );
            return;
        }

        if (
            watchIdRef.current !== null
        ) {
            return;
        }

        watchIdRef.current =
            navigator.geolocation.watchPosition(
                async (position) => {
                    const gps = {
                        latitude:
                            position.coords
                                .latitude,

                        longitude:
                            position.coords
                                .longitude
                    };

                    setLocation(gps);

                    await sendLiveLocation(
                        gps
                    );
                },
                () => {
                    setError(
                        "Unable to get your location. Please allow location access."
                    );
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000
                }
            );

        setTracking(true);
    };

    const stopLocationTracking = () => {
        if (
            watchIdRef.current !== null
        ) {
            navigator.geolocation.clearWatch(
                watchIdRef.current
            );

            watchIdRef.current = null;
        }

        setTracking(false);
    };

    const getCurrentLocation = () => {
        return new Promise(
            (resolve, reject) => {
                if (
                    !navigator.geolocation
                ) {
                    reject(
                        new Error(
                            "Geolocation is not supported by this browser."
                        )
                    );

                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude:
                                position.coords
                                    .latitude,

                            longitude:
                                position.coords
                                    .longitude
                        });
                    },
                    () => {
                        reject(
                            new Error(
                                "Unable to get your location. Please allow location access."
                            )
                        );
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            }
        );
    };

    const handleCheckIn = async () => {
        if (!employeeId) {
            setError(
                isEmployee
                    ? "Your employee record could not be found."
                    : "Please select an employee."
            );

            return;
        }

        try {
            setError("");
            setMessage("");

            const gps =
                await getCurrentLocation();

            setLocation(gps);

            const response =
                await apiFetch(
                    "/location/check-in",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            employee_id:
                                Number(
                                    employeeId
                                ),

                            latitude:
                                gps.latitude,

                            longitude:
                                gps.longitude,

                            location_address:
                                "Current GPS Location"
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Check-In failed."
                );
            }

            setMessage(
                "Check-In successful."
            );

            await fetchLocationHistory(
                employeeId
            );

            startLocationTracking();

        } catch (err) {
            setError(
                err.message ||
                "Check-In failed."
            );
        }
    };

    const handleCheckOut = async () => {
        if (!employeeId) {
            setError(
                isEmployee
                    ? "Your employee record could not be found."
                    : "Please select an employee."
            );

            return;
        }

        try {
            setError("");
            setMessage("");

            const gps =
                await getCurrentLocation();

            setLocation(gps);

            const response =
                await apiFetch(
                    "/location/check-out",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            employee_id:
                                Number(
                                    employeeId
                                ),

                            latitude:
                                gps.latitude,

                            longitude:
                                gps.longitude,

                            location_address:
                                "Current GPS Location"
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Check-Out failed."
                );
            }

            stopLocationTracking();

            setMessage(
                "Check-Out successful."
            );

            await fetchLocationHistory(
                employeeId
            );

        } catch (err) {
            setError(
                err.message ||
                "Check-Out failed."
            );
        }
    };

    const handleLiveTracking = async () => {
        if (!employeeId) {
            setError(
                isEmployee
                    ? "Your employee record could not be found."
                    : "Please select an employee."
            );

            return;
        }

        try {
            setError("");
            setMessage("");

            const gps =
                await getCurrentLocation();

            setLocation(gps);

            await sendLiveLocation(
                gps
            );

            startLocationTracking();

        } catch (err) {
            setError(
                err.message ||
                "Live tracking failed."
            );
        }
    };

    const handleStartVisit = async () => {
        if (!employeeId) {
            setError(
                isEmployee
                    ? "Your employee record could not be found."
                    : "Please select an employee."
            );

            return;
        }

        if (!customerId) {
            setError(
                "Please select a customer."
            );

            return;
        }

        try {
            setError("");
            setMessage("");

            const gps =
                await getCurrentLocation();

            setLocation(gps);

            const response =
                await apiFetch(
                    "/visits/start",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            employee_id:
                                Number(
                                    employeeId
                                ),

                            customer_id:
                                Number(
                                    customerId
                                ),

                            account_id:
                                accountId
                                    ? Number(
                                          accountId
                                      )
                                    : null,

                            contact_id:
                                contactId
                                    ? Number(
                                          contactId
                                      )
                                    : null,

                            latitude:
                                gps.latitude,

                            longitude:
                                gps.longitude,

                            remarks:
                                visitRemarks ||
                                null
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    "Failed to start visit."
                );
            }

            setActiveVisit(data);

            setMessage(
                `Visit #${data.visit_id} started successfully.`
            );

            setVisitRemarks("");

            await fetchVisits(
                employeeId
            );

        } catch (err) {
            setError(
                err.message ||
                "Failed to start visit."
            );
        }
    };

    const handleCompleteVisit =
        async () => {
            if (!activeVisit) {
                setError(
                    "No active visit found."
                );

                return;
            }

            if (!visitOutcome.trim()) {
                setError(
                    "Please select a visit outcome."
                );

                return;
            }

            try {
                setError("");
                setMessage("");

                const response =
                    await apiFetch(
                        `/visits/${activeVisit.visit_id}/complete`,
                        {
                            method: "PUT",

                            body:
                                JSON.stringify({
                                    visit_outcome:
                                        visitOutcome,

                                    remarks:
                                        visitRemarks ||
                                        null
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.detail ||
                        "Failed to complete visit."
                    );
                }

                setActiveVisit(null);
                setVisitOutcome("");
                setVisitRemarks("");

                setMessage(
                    `Visit #${data.visit_id} completed successfully.`
                );

                await fetchVisits(
                    employeeId
                );

            } catch (err) {
                setError(
                    err.message ||
                    "Failed to complete visit."
                );
            }
        };

    const handleEmployeeChange = (
        event
    ) => {
        if (isEmployee) {
            return;
        }

        if (tracking) {
            stopLocationTracking();
        }

        const id =
            event.target.value;

        setEmployeeId(id);
        setLocation(null);
        setHistory([]);
        setMessage("");
        setError("");
        setActiveVisit(null);

        if (id) {
            fetchLocationHistory(id);
            fetchVisits(id);
        }
    };

    const getEmployeeDisplayName = (
        employee
    ) => {
        if (!employee) {
            return "Employee";
        }

        if (employee.first_name) {
            return `${employee.first_name} ${
                employee.last_name || ""
            }`.trim();
        }

        return (
            employee.employee_name ||
            employee.name ||
            `Employee ${employee.employee_id}`
        );
    };

    const getSelectedEmployeeName = () => {
        const selectedEmployee =
            employees.find(
                (employee) =>
                    Number(
                        employee.employee_id
                    ) ===
                    Number(employeeId)
            );

        return getEmployeeDisplayName(
            selectedEmployee
        );
    };

    const getTypeClass = (type) => {
        if (type === "CHECK_IN") {
            return "history-check-in";
        }

        if (type === "CHECK_OUT") {
            return "history-check-out";
        }

        return "history-live";
    };

    const getTypeLabel = (type) => {
        if (type === "CHECK_IN") {
            return "Check In";
        }

        if (type === "CHECK_OUT") {
            return "Check Out";
        }

        return "Live";
    };

    const getCustomerName = (id) => {
        const customer =
            customers.find(
                (item) =>
                    Number(
                        item.customer_id
                    ) === Number(id)
            );

        if (!customer) {
            return `Customer ${id}`;
        }

        return (
            customer.customer_name ||
            customer.name ||
            `Customer ${id}`
        );
    };

    const getAccountName = (id) => {
        if (!id) {
            return "-";
        }

        const account =
            accounts.find(
                (item) =>
                    Number(
                        item.account_id
                    ) === Number(id)
            );

        return account
            ? account.account_name
            : `Account ${id}`;
    };

    const getContactName = (id) => {
        if (!id) {
            return "-";
        }

        const contact =
            contacts.find(
                (item) =>
                    Number(
                        item.contact_id
                    ) === Number(id)
            );

        return contact
            ? contact.contact_name
            : `Contact ${id}`;
    };

    return (
        <div className="location-page">

            <div className="location-header">

                <div>
                    <h1>
                        Location & Visit Tracking
                    </h1>

                    <p>
                        Manage employee GPS
                        tracking, check-in,
                        check-out and
                        customer visits.
                    </p>
                </div>

                <div
                    className={`tracking-status ${
                        tracking
                            ? "active"
                            : ""
                    }`}
                >
                    <span></span>

                    {tracking
                        ? "Live Tracking Active"
                        : "Not Tracking"}
                </div>

            </div>

            <div className="location-card">

                <div className="card-title">
                    <h2>
                        Employee Location
                    </h2>

                    <p>
                        {isEmployee
                            ? "Your employee record is selected automatically."
                            : "Select an employee to manage location tracking."}
                    </p>
                </div>

                <div className="location-form">

                    <label>
                        {isEmployee
                            ? "Your Employee"
                            : "Select Employee"}
                    </label>

                    <select
                        value={employeeId}
                        onChange={
                            handleEmployeeChange
                        }
                        disabled={
                            isEmployee ||
                            tracking
                        }
                    >
                        <option value="">
                            {isEmployee
                                ? "Loading your employee record..."
                                : "Select Employee"}
                        </option>

                        {employees.map(
                            (employee) => (
                                <option
                                    key={
                                        employee.employee_id
                                    }
                                    value={
                                        employee.employee_id
                                    }
                                >
                                    {getEmployeeDisplayName(
                                        employee
                                    )}
                                </option>
                            )
                        )}
                    </select>

                </div>

                <div className="location-actions">

                    <button
                        className="check-in-btn"
                        onClick={
                            handleCheckIn
                        }
                        disabled={
                            !employeeId ||
                            tracking
                        }
                    >
                        Check In
                    </button>

                    <button
                        className="check-out-btn"
                        onClick={
                            handleCheckOut
                        }
                        disabled={
                            !employeeId
                        }
                    >
                        Check Out
                    </button>

                    <button
                        className="live-btn"
                        onClick={
                            handleLiveTracking
                        }
                        disabled={
                            !employeeId
                        }
                    >
                        {tracking
                            ? "Tracking Live"
                            : "Start Live Tracking"}
                    </button>

                    <button
                        className="history-btn"
                        onClick={() =>
                            fetchLocationHistory(
                                employeeId
                            )
                        }
                        disabled={
                            !employeeId
                        }
                    >
                        View History
                    </button>

                </div>

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

            <div className="location-card visit-card">

                <div className="card-title">
                    <h2>
                        Customer Visit Tracking
                    </h2>

                    <p>
                        Start and complete
                        customer visits
                        using GPS location.
                    </p>
                </div>

                <div className="visit-form-grid">

                    <div className="location-form">

                        <label>
                            Employee
                        </label>

                        <select
                            value={employeeId}
                            onChange={
                                handleEmployeeChange
                            }
                            disabled={
                                isEmployee ||
                                !!activeVisit
                            }
                        >
                            <option value="">
                                {isEmployee
                                    ? "Loading..."
                                    : "Select Employee"}
                            </option>

                            {employees.map(
                                (employee) => (
                                    <option
                                        key={
                                            employee.employee_id
                                        }
                                        value={
                                            employee.employee_id
                                        }
                                    >
                                        {getEmployeeDisplayName(
                                            employee
                                        )}
                                    </option>
                                )
                            )}
                        </select>

                    </div>

                    <div className="location-form">

                        <label>
                            Customer *
                        </label>

                        <select
                            value={customerId}
                            onChange={(
                                event
                            ) =>
                                setCustomerId(
                                    event.target
                                        .value
                                )
                            }
                            disabled={
                                !!activeVisit
                            }
                        >
                            <option value="">
                                Select Customer
                            </option>

                            {customers.map(
                                (customer) => (
                                    <option
                                        key={
                                            customer.customer_id
                                        }
                                        value={
                                            customer.customer_id
                                        }
                                    >
                                        {customer.customer_name ||
                                            customer.name ||
                                            `Customer ${customer.customer_id}`}
                                    </option>
                                )
                            )}
                        </select>

                    </div>

                    <div className="location-form">

                        <label>
                            Account
                        </label>

                        <select
                            value={accountId}
                            onChange={(
                                event
                            ) =>
                                setAccountId(
                                    event.target
                                        .value
                                )
                            }
                            disabled={
                                !!activeVisit
                            }
                        >
                            <option value="">
                                Select Account
                            </option>

                            {accounts.map(
                                (account) => (
                                    <option
                                        key={
                                            account.account_id
                                        }
                                        value={
                                            account.account_id
                                        }
                                    >
                                        {
                                            account.account_name
                                        }
                                    </option>
                                )
                            )}
                        </select>

                    </div>

                    <div className="location-form">

                        <label>
                            Contact
                        </label>

                        <select
                            value={contactId}
                            onChange={(
                                event
                            ) =>
                                setContactId(
                                    event.target
                                        .value
                                )
                            }
                            disabled={
                                !!activeVisit
                            }
                        >
                            <option value="">
                                Select Contact
                            </option>

                            {contacts.map(
                                (contact) => (
                                    <option
                                        key={
                                            contact.contact_id
                                        }
                                        value={
                                            contact.contact_id
                                        }
                                    >
                                        {
                                            contact.contact_name
                                        }
                                    </option>
                                )
                            )}
                        </select>

                    </div>

                </div>

                <div className="location-form visit-remarks">

                    <label>
                        Visit Remarks
                    </label>

                    <textarea
                        value={visitRemarks}
                        onChange={(
                            event
                        ) =>
                            setVisitRemarks(
                                event.target
                                    .value
                            )
                        }
                        placeholder="Enter visit remarks..."
                        rows="3"
                    />

                </div>

                {!activeVisit ? (
                    <button
                        className="start-visit-btn"
                        onClick={
                            handleStartVisit
                        }
                        disabled={
                            !employeeId
                        }
                    >
                        📍 Start Visit
                    </button>
                ) : (
                    <div className="active-visit-box">

                        <div>
                            <span className="active-visit-label">
                                ACTIVE VISIT
                            </span>

                            <h3>
                                Visit #
                                {
                                    activeVisit.visit_id
                                }
                            </h3>

                            <p>
                                {
                                    getCustomerName(
                                        activeVisit.customer_id
                                    )
                                }
                            </p>
                        </div>

                        <div className="location-form">

                            <label>
                                Visit Outcome *
                            </label>

                            <select
                                value={
                                    visitOutcome
                                }
                                onChange={(
                                    event
                                ) =>
                                    setVisitOutcome(
                                        event.target
                                            .value
                                    )
                                }
                            >
                                <option value="">
                                    Select Outcome
                                </option>

                                <option value="Meeting Conducted">
                                    Meeting Conducted
                                </option>

                                <option value="Follow-Up Required">
                                    Follow-Up Required
                                </option>

                                <option value="Opportunity Created">
                                    Opportunity Created
                                </option>

                                <option value="Opportunity Updated">
                                    Opportunity Updated
                                </option>

                                <option value="Customer Not Available">
                                    Customer Not Available
                                </option>

                                <option value="Visit Cancelled">
                                    Visit Cancelled
                                </option>
                            </select>

                        </div>

                        <button
                            className="complete-visit-btn"
                            onClick={
                                handleCompleteVisit
                            }
                        >
                            ✓ Complete Visit
                        </button>

                    </div>
                )}

            </div>

            <div className="location-card">

                <div className="history-header">

                    <div>
                        <h2>
                            Visit History
                        </h2>

                        <p>
                            Customer visits and
                            their outcomes.
                        </p>
                    </div>

                    <button
                        className="refresh-history-btn"
                        onClick={() =>
                            fetchVisits(
                                employeeId
                            )
                        }
                    >
                        ↻ Refresh
                    </button>

                </div>

                {loadingVisits ? (
                    <div className="empty-history">
                        <p>
                            Loading visits...
                        </p>
                    </div>
                ) : visits.length === 0 ? (
                    <div className="empty-history">
                        <div>
                            📭
                        </div>

                        <p>
                            No visits found.
                        </p>
                    </div>
                ) : (
                    <div className="history-table-wrapper">

                        <table className="location-history-table">

                            <thead>
                                <tr>
                                    <th>Visit ID</th>
                                    <th>Employee</th>
                                    <th>Customer</th>
                                    <th>Account</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                    <th>Outcome</th>
                                    <th>GPS</th>
                                    <th>Start Time</th>
                                    <th>End Time</th>
                                </tr>
                            </thead>

                            <tbody>

                                {visits.map(
                                    (visit) => (
                                        <tr
                                            key={
                                                visit.visit_id
                                            }
                                        >
                                            <td>
                                                #
                                                {
                                                    visit.visit_id
                                                }
                                            </td>

                                            <td>
                                                {
                                                    getSelectedEmployeeName()
                                                }
                                            </td>

                                            <td>
                                                {
                                                    getCustomerName(
                                                        visit.customer_id
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {
                                                    getAccountName(
                                                        visit.account_id
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {
                                                    getContactName(
                                                        visit.contact_id
                                                    )
                                                }
                                            </td>

                                            <td>
                                                <span
                                                    className={`history-badge ${
                                                        visit.visit_status ===
                                                        "Completed"
                                                            ? "history-check-in"
                                                            : "history-live"
                                                    }`}
                                                >
                                                    {
                                                        visit.visit_status
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    visit.visit_outcome ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    visit.latitude
                                                }
                                                ,
                                                <br />
                                                {
                                                    visit.longitude
                                                }
                                            </td>

                                            <td>
                                                {visit.start_time
                                                    ? new Date(
                                                          visit.start_time
                                                      ).toLocaleString()
                                                    : "-"}
                                            </td>

                                            <td>
                                                {visit.end_time
                                                    ? new Date(
                                                          visit.end_time
                                                      ).toLocaleString()
                                                    : "-"}
                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {location && (
                <div className="coordinates-card">

                    <div className="coordinates-icon">
                        📍
                    </div>

                    <div>

                        <h2>
                            Current GPS Coordinates
                        </h2>

                        <div className="coordinate-row">

                            <span>
                                Latitude
                            </span>

                            <strong>
                                {
                                    location.latitude
                                }
                            </strong>

                        </div>

                        <div className="coordinate-row">

                            <span>
                                Longitude
                            </span>

                            <strong>
                                {
                                    location.longitude
                                }
                            </strong>

                        </div>

                    </div>

                </div>
            )}

            {tracking && (
                <div className="live-tracking-card">

                    <div className="live-indicator">
                        <span></span>
                    </div>

                    <div>

                        <h3>
                            Live Tracking Enabled
                        </h3>

                        <p>
                            Your GPS location is
                            being updated
                            automatically while
                            tracking is active.
                        </p>

                    </div>

                </div>
            )}

            <div className="location-history-card">

                <div className="history-header">

                    <div>
                        <h2>
                            Location History
                        </h2>

                        <p>
                            Check-In, Live Tracking
                            and Check-Out records.
                        </p>
                    </div>

                    {employeeId && (
                        <button
                            className="refresh-history-btn"
                            onClick={() =>
                                fetchLocationHistory(
                                    employeeId
                                )
                            }
                        >
                            ↻ Refresh
                        </button>
                    )}

                </div>

                {!employeeId ? (
                    <div className="empty-history">
                        <div>
                            📍
                        </div>

                        <p>
                            {isEmployee
                                ? "Loading your employee record..."
                                : "Select an employee to view location history."}
                        </p>
                    </div>
                ) : loadingHistory ? (
                    <div className="empty-history">
                        <p>
                            Loading location history...
                        </p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="empty-history">
                        <div>
                            📭
                        </div>

                        <p>
                            No location records
                            found for this
                            employee.
                        </p>
                    </div>
                ) : (
                    <div className="history-table-wrapper">

                        <table className="location-history-table">

                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Latitude</th>
                                    <th>Longitude</th>
                                    <th>Status</th>
                                    <th>Address</th>
                                    <th>Time</th>
                                </tr>
                            </thead>

                            <tbody>

                                {history.map(
                                    (record) => (
                                        <tr
                                            key={
                                                record.location_id
                                            }
                                        >
                                            <td>
                                                {
                                                    getSelectedEmployeeName()
                                                }
                                            </td>

                                            <td>
                                                <span
                                                    className={`history-badge ${getTypeClass(
                                                        record.tracking_type
                                                    )}`}
                                                >
                                                    {getTypeLabel(
                                                        record.tracking_type
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    record.latitude
                                                }
                                            </td>

                                            <td>
                                                {
                                                    record.longitude
                                                }
                                            </td>

                                            <td>
                                                {
                                                    record.visit_status ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    record.location_address ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {record.tracking_time
                                                    ? new Date(
                                                          record.tracking_time
                                                      ).toLocaleString()
                                                    : "-"}
                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

        </div>
    );
}

export default LocationTracking;