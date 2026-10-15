import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { apiFetch } from "../api";
import "./Dashboard.css";

function Dashboard() {
    const [customers, setCustomers] = useState([]);
    const [leads, setLeads] = useState([]);
    const [opportunities, setOpportunities] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [activities, setActivities] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [employees, setEmployees] = useState([]);

    const savedUser = localStorage.getItem("crm360_user");

    let user = {
        full_name: "User",
        role: "Employee"
    };

    try {
        if (savedUser) {
            user = JSON.parse(savedUser);
        }
    } catch {
        user = {
            full_name: "User",
            role: "Employee"
        };
    }

    const managementRoles = [
        "Super Admin",
        "Company Admin",
        "Manager"
    ];

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [
                customersRes,
                leadsRes,
                opportunitiesRes,
                tasksRes,
                meetingsRes,
                activitiesRes,
                companiesRes,
                employeesRes
            ] = await Promise.all([
                apiFetch("/customers/"),
                apiFetch("/leads/"),
                apiFetch("/opportunities/"),
                apiFetch("/tasks/"),
                apiFetch("/meetings/"),
                apiFetch("/activities/"),
                apiFetch("/companies/"),
                apiFetch("/employees/")
            ]);

            if (customersRes.ok) {
                setCustomers(await customersRes.json());
            }

            if (leadsRes.ok) {
                setLeads(await leadsRes.json());
            }

            if (opportunitiesRes.ok) {
                setOpportunities(await opportunitiesRes.json());
            }

            if (tasksRes.ok) {
                setTasks(await tasksRes.json());
            }

            if (meetingsRes.ok) {
                setMeetings(await meetingsRes.json());
            }

            if (activitiesRes.ok) {
                setActivities(await activitiesRes.json());
            }

            if (companiesRes.ok) {
                setCompanies(await companiesRes.json());
            }

            if (employeesRes.ok) {
                setEmployees(await employeesRes.json());
            }
        } catch (error) {
            console.error("Dashboard loading error:", error);
        }
    };

    const activeLeads = leads.filter(
        (lead) =>
            lead.status === "New" ||
            lead.status === "Open" ||
            lead.status === "Active"
    ).length;

    const activeOpportunities = opportunities.filter(
        (opportunity) =>
            opportunity.status === "Open" ||
            opportunity.status === "Active"
    ).length;

    const openTasks = tasks.filter(
        (task) =>
            task.status !== "Completed" &&
            task.status !== "Closed"
    ).length;

    return (
        <div className="dashboard-page">

            <section className="dashboard-header">

                <div className="dashboard-heading">

                    <div className="dashboard-breadcrumb">
                        CRM 360
                        <span>/</span>
                        Dashboard
                    </div>

                    <h1>
                        Welcome back, {user.full_name}
                    </h1>

                    <p>
                        Here's your business overview for today.
                        Manage customers, sales and team activity from one place.
                    </p>

                </div>

                <div className="dashboard-header-actions">

                    <NavLink
                        to="/add-customer"
                        className="add-customer-button"
                    >
                        <span>+</span>
                        Add Customer
                    </NavLink>

                    {managementRoles.includes(user.role) && (
                        <NavLink
                            to="/reports"
                            className="reports-button"
                        >
                            View Reports
                            <span>→</span>
                        </NavLink>
                    )}

                </div>

            </section>

            <section className="performance-section">

                <div className="section-heading">

                    <div>
                        <span>BUSINESS OVERVIEW</span>
                        <h2>CRM Performance</h2>
                    </div>

                    <div className="performance-total">
                        <strong>
                            {customers.length +
                                leads.length +
                                opportunities.length +
                                activities.length +
                                tasks.length +
                                meetings.length +
                                companies.length +
                                employees.length}
                        </strong>
                        <span>total records</span>
                    </div>

                </div>

                <div className="performance-grid">

                    <NavLink
                        to="/customers"
                        className="performance-card purple-card"
                    >
                        <div className="performance-icon">
                            👥
                        </div>

                        <div className="performance-content">
                            <span>CUSTOMERS</span>
                            <strong>{customers.length}</strong>
                            <small>Customer records</small>
                        </div>

                       
                    </NavLink>

                    {managementRoles.includes(user.role) && (
                        <NavLink
                            to="/employees"
                            className="performance-card blue-card"
                        >
                            <div className="performance-icon">
                                👨‍💼
                            </div>

                            <div className="performance-content">
                                <span>TEAM MEMBERS</span>
                                <strong>{employees.length}</strong>
                                <small>Team members</small>
                            </div>

                            
                        </NavLink>
                    )}

                    {managementRoles.includes(user.role) && (
                        <NavLink
                            to="/companies"
                            className="performance-card green-card"
                        >
                            <div className="performance-icon">
                                🏢
                            </div>

                            <div className="performance-content">
                                <span>COMPANIES</span>
                                <strong>{companies.length}</strong>
                                <small>Company records</small>
                            </div>

                           
                        </NavLink>
                    )}

                    <NavLink
                        to="/leads"
                        className="performance-card orange-card"
                    >
                        <div className="performance-icon">
                            🎯
                        </div>

                        <div className="performance-content">
                            <span>ACTIVE LEADS</span>
                            <strong>{activeLeads}</strong>
                            <small>Potential customers</small>
                        </div>

                     
                    </NavLink>

                    <NavLink
                        to="/opportunities"
                        className="performance-card pink-card"
                    >
                        <div className="performance-icon">
                            💼
                        </div>

                        <div className="performance-content">
                            <span>OPPORTUNITIES</span>
                            <strong>{activeOpportunities}</strong>
                            <small>Sales opportunities</small>
                        </div>

                      
                    </NavLink>

                    <NavLink
                        to="/activities"
                        className="performance-card cyan-card"
                    >
                        <div className="performance-icon">
                            📋
                        </div>

                        <div className="performance-content">
                            <span>ACTIVITIES</span>
                            <strong>{activities.length}</strong>
                            <small>CRM activities</small>
                        </div>

                    
                    </NavLink>

                    <NavLink
                        to="/tasks"
                        className="performance-card violet-card"
                    >
                        <div className="performance-icon">
                            ✓
                        </div>

                        <div className="performance-content">
                            <span>TASKS</span>
                            <strong>{openTasks}</strong>
                            <small>Assigned tasks</small>
                        </div>

                    </NavLink>

                    <NavLink
                        to="/meetings"
                        className="performance-card teal-card"
                    >
                        <div className="performance-icon">
                            📅
                        </div>

                        <div className="performance-content">
                            <span>MEETINGS</span>
                            <strong>{meetings.length}</strong>
                            <small>Scheduled meetings</small>
                        </div>

                  
                    </NavLink>

                </div>

            </section>

            <section className="quick-section">

                <div className="section-heading">

                    <div>
                        <span>SHORTCUTS</span>
                        <h2>Quick Access</h2>
                    </div>

                </div>

                <div className="quick-grid">

                    <NavLink
                        to="/add-customer"
                        className="quick-card"
                    >
                        <div className="quick-icon purple-icon">
                            +
                        </div>

                        <div className="quick-content">
                            <strong>Add Customer</strong>
                            <span>Create a new customer</span>
                        </div>

                        <b>→</b>
                    </NavLink>

                    <NavLink
                        to="/tasks"
                        className="quick-card"
                    >
                        <div className="quick-icon blue-icon">
                            ✓
                        </div>

                        <div className="quick-content">
                            <strong>Manage Tasks</strong>
                            <span>View and update tasks</span>
                        </div>

                        <b>→</b>
                    </NavLink>

                    {managementRoles.includes(user.role) && (
                        <NavLink
                            to="/reports"
                            className="quick-card"
                        >
                            <div className="quick-icon green-icon">
                                ▥
                            </div>

                            <div className="quick-content">
                                <strong>View Reports</strong>
                                <span>Analyze CRM performance</span>
                            </div>

                            <b>→</b>
                        </NavLink>
                    )}

                    {managementRoles.includes(user.role) && (
                        <NavLink
                            to="/audit-logs"
                            className="quick-card"
                        >
                            <div className="quick-icon orange-icon">
                                ≡
                            </div>

                            <div className="quick-content">
                                <strong>Audit Trail</strong>
                                <span>Review system activities</span>
                            </div>

                            <b>→</b>
                        </NavLink>
                    )}

                </div>

            </section>

        </div>
    );
}

export default Dashboard;