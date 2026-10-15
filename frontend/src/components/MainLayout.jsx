import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./MainLayout.css";

function MainLayout({ children }) {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

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

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("crm360_user");
        localStorage.removeItem("crm360_role");

        navigate("/login");
    };

    const menuSections = [
        {
            title: "MAIN",
            items: [
                {
                    name: "Dashboard",
                    path: "/dashboard",
                    icon: "▦"
                }
            ]
        },
        {
            title: "CRM",
            items: [
                {
                    name: "Companies",
                    path: "/companies",
                    icon: "▣",
                    roles: ["Super Admin", "Company Admin", "Manager"]
                },
                {
                    name: "Employees",
                    path: "/employees",
                    icon: "♙",
                    roles: ["Super Admin", "Company Admin", "Manager"]
                },
                {
                    name: "Customers",
                    path: "/customers",
                    icon: "♧"
                },
                {
                    name: "Accounts",
                    path: "/accounts",
                    icon: "▤"
                },
                {
                    name: "Contacts",
                    path: "/contacts",
                    icon: "♙"
                },
                {
                    name: "Leads",
                    path: "/leads",
                    icon: "◎"
                },
                {
                    name: "Opportunities",
                    path: "/opportunities",
                    icon: "◇"
                }
            ]
        },
        {
            title: "ACTIVITY",
            items: [
                {
                    name: "Activities",
                    path: "/activities",
                    icon: "◷"
                },
                {
                    name: "Tasks",
                    path: "/tasks",
                    icon: "✓"
                },
                {
                    name: "Meetings",
                    path: "/meetings",
                    icon: "□"
                }
            ]
        },
        {
            title: "MANAGEMENT",
            items: [
                {
                    name: "User Management",
                    path: "/user-management",
                    icon: "♚",
                    roles: ["Super Admin", "Company Admin"]
                },
                {
    name: "Location Tracking",
    path: "/location-tracking",
    icon: "⌖"
},
                {
                    name: "Reports",
                    path: "/reports",
                    icon: "▥",
                    roles: ["Super Admin", "Company Admin", "Manager"]
                },
                {
                    name: "Audit Logs",
                    path: "/audit-logs",
                    icon: "≡",
                    roles: ["Super Admin", "Company Admin", "Manager"]
                }
            ]
        }
    ];

    return (
        <div className={`crm-layout ${collapsed ? "sidebar-collapsed" : ""}`}>

            <aside className="crm-sidebar">

                <div className="sidebar-brand">
                    <div className="brand-logo">
                        C
                    </div>

                    {!collapsed && (
                        <div className="brand-text">
                            <h2>CRM<span>360</span></h2>
                            <p>Business Management</p>
                        </div>
                    )}
                </div>

                <div className="sidebar-menu">

                    {menuSections.map((section) => {
                        const visibleItems = section.items.filter(
                            (item) =>
                                !item.roles ||
                                item.roles.includes(user.role)
                        );

                        if (visibleItems.length === 0) {
                            return null;
                        }

                        return (
                            <div
                                className="menu-section"
                                key={section.title}
                            >
                                {!collapsed && (
                                    <div className="menu-section-title">
                                        {section.title}
                                    </div>
                                )}

                                {visibleItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `menu-item ${
                                                isActive
                                                    ? "active"
                                                    : ""
                                            }`
                                        }
                                        title={collapsed ? item.name : ""}
                                    >
                                        <span className="menu-icon">
                                            {item.icon}
                                        </span>

                                        {!collapsed && (
                                            <span>
                                                {item.name}
                                            </span>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        );
                    })}

                </div>

                <div className="sidebar-bottom">

                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `menu-item ${
                                isActive ? "active" : ""
                            }`
                        }
                        title={collapsed ? "Settings" : ""}
                    >
                        <span className="menu-icon">
                            ⚙
                        </span>

                        {!collapsed && (
                            <span>Settings</span>
                        )}
                    </NavLink>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                        title={collapsed ? "Logout" : ""}
                    >
                        <span className="menu-icon">
                            ↪
                        </span>

                        {!collapsed && (
                            <span>Logout</span>
                        )}
                    </button>

                </div>

            </aside>

            <div className="crm-main">

                <header className="crm-header">

                    <div className="header-left">

                        <button
                            className="sidebar-toggle"
                            onClick={() =>
                                setCollapsed(!collapsed)
                            }
                        >
                            ☰
                        </button>

                        <div className="header-title">
                            <span>CRM 360</span>
                            <small>
                                Business Management System
                            </small>
                        </div>

                    </div>

                    <div className="header-right">

                        <button className="notification-button">
                            ♢
                            <span className="notification-dot"></span>
                        </button>

                        <div className="header-user">

                            <div className="user-avatar">
                                {user.full_name
                                    ?.charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div className="user-info">
                                <strong>
                                    {user.full_name}
                                </strong>

                                <span>
                                    {user.role}
                                </span>
                            </div>

                        </div>

                    </div>

                </header>

                <main className="crm-content">
                    {children}
                </main>

            </div>

        </div>
    );
}

export default MainLayout;