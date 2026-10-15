import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

function Settings() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("CRM 360");
    const [role, setRole] = useState("Employee");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const savedUser = localStorage.getItem("crm360_user");
        const savedSettings = localStorage.getItem("crm360_settings");

        try {
            if (savedUser) {
                const user = JSON.parse(savedUser);

                setName(user.full_name || "");
                setEmail(user.email || "");
                setRole(user.role || "Employee");
            }

            if (savedSettings) {
                const settings = JSON.parse(savedSettings);

                setName(
                    settings.name ||
                    (savedUser
                        ? JSON.parse(savedUser).full_name
                        : "")
                );

                setEmail(
                    settings.email ||
                    (savedUser
                        ? JSON.parse(savedUser).email
                        : "")
                );

                setCompany(
                    settings.company || "CRM 360"
                );
            }
        } catch (err) {
            console.error(
                "Unable to load user settings:",
                err
            );
        }
    }, []);

    const handleSave = (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!name.trim()) {
            setError("Administrator name is required.");
            return;
        }

        if (!email.trim()) {
            setError("Email address is required.");
            return;
        }

        if (!company.trim()) {
            setError("Company name is required.");
            return;
        }

        const settings = {
            name: name.trim(),
            email: email.trim(),
            company: company.trim()
        };

        localStorage.setItem(
            "crm360_settings",
            JSON.stringify(settings)
        );

        setMessage("Settings saved successfully!");

        setTimeout(() => {
            setMessage("");
        }, 3000);
    };

    const handleReset = () => {
        const savedUser = localStorage.getItem("crm360_user");

        let user = {};

        try {
            user = savedUser
                ? JSON.parse(savedUser)
                : {};
        } catch (err) {
            console.error(
                "Unable to read user information:",
                err
            );
        }

        setName(user.full_name || "");
        setEmail(user.email || "");
        setCompany("CRM 360");
        setRole(user.role || "Employee");

        localStorage.removeItem("crm360_settings");

        setMessage("Settings restored.");
        setError("");

        setTimeout(() => {
            setMessage("");
        }, 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("crm360_user");
        localStorage.removeItem("crm360_role");
        localStorage.removeItem("crm360_settings");

        navigate("/login");
    };

    return (
        <div className="settings-page">

            <div className="settings-header">

                <div>
                    <h1>Settings</h1>

                    <p>
                        Manage your CRM account and system settings
                    </p>
                </div>

            </div>

            {message && (
                <div className="settings-success">
                    ✓ {message}
                </div>
            )}

            {error && (
                <div className="settings-error">
                    ⚠ {error}
                </div>
            )}

            <div className="settings-container">

                <div className="settings-card">

                    <div className="settings-title">

                        <span>👤</span>

                        <div>
                            <h2>Profile Settings</h2>

                            <p>
                                Update your account information
                            </p>
                        </div>

                    </div>

                    <form onSubmit={handleSave}>

                        <div className="settings-form-group">

                            <label>
                                Administrator Name
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                placeholder="Enter your name"
                            />

                        </div>

                        <div className="settings-form-group">

                            <label>
                                Email Address
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="Enter your email"
                            />

                        </div>

                        <div className="settings-form-group">

                            <label>
                                Company Name
                            </label>

                            <input
                                type="text"
                                value={company}
                                onChange={(e) =>
                                    setCompany(e.target.value)
                                }
                                placeholder="Enter company name"
                            />

                        </div>

                        <div className="settings-form-group">

                            <label>
                                Role
                            </label>

                            <input
                                type="text"
                                value={role}
                                readOnly
                                className="role-readonly"
                            />

                            <small>
                                Role is managed by the system administrator.
                            </small>

                        </div>

                        <div className="settings-actions">

                            <button
                                type="submit"
                                className="save-settings-btn"
                            >
                                💾 Save Changes
                            </button>

                            <button
                                type="button"
                                className="reset-settings-btn"
                                onClick={handleReset}
                            >
                                ↺ Reset
                            </button>

                        </div>

                    </form>

                </div>

                <div className="settings-card">

                    <div className="settings-title">

                        <span>⚙️</span>

                        <div>

                            <h2>System Information</h2>

                            <p>
                                CRM 360 application details
                            </p>

                        </div>

                    </div>

                    <div className="system-info">

                        <div>
                            <span>Application</span>
                            <strong>CRM 360</strong>
                        </div>

                        <div>
                            <span>Version</span>
                            <strong>1.0.0</strong>
                        </div>

                        <div>
                            <span>Backend</span>
                            <strong>FastAPI</strong>
                        </div>

                        <div>
                            <span>Database</span>
                            <strong>SQL Server</strong>
                        </div>

                        <div>
                            <span>Frontend</span>
                            <strong>React + Vite</strong>
                        </div>

                        <div>
                            <span>Authentication</span>
                            <strong>JWT</strong>
                        </div>

                    </div>

                </div>

                <div className="settings-card">

                    <div className="settings-title">

                        <span>🔐</span>

                        <div>

                            <h2>Account Security</h2>

                            <p>
                                Manage your CRM account session
                            </p>

                        </div>

                    </div>

                    <div className="security-info">

                        <div>
                            <span>Current Role</span>

                            <strong>
                                {role}
                            </strong>
                        </div>

                        <div>
                            <span>Session</span>

                            <strong className="active-session">
                                ● Active
                            </strong>
                        </div>

                    </div>

                    <button
                        type="button"
                        className="logout-settings-btn"
                        onClick={handleLogout}
                    >
                        🚪 Logout
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Settings;