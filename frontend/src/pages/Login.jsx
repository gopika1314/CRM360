import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        if (!username || !password) {
            setError("Please enter username and password");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/users/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.detail || "Invalid username or password"
                );
                setLoading(false);
                return;
            }

            // Store JWT token
            localStorage.setItem(
                "access_token",
                data.access_token
            );

            localStorage.setItem(
                "token",
                data.access_token
            );

            // Store complete user information
            localStorage.setItem(
                "crm360_user",
                JSON.stringify({
                    user_id: data.user_id,
                    full_name: data.full_name,
                    username: data.username,
                    email: data.email,
                    role: data.role
                })
            );

            // Store real backend role
            localStorage.setItem(
                "crm360_role",
                data.role
            );

            // Go to Dashboard
            navigate("/");

        } catch (error) {
            console.error("Login error:", error);
            setError("Unable to connect to the backend");
        }

        setLoading(false);
    };

    return (
        <div className="login-page">

            <div className="login-card">

                <div className="login-brand">
                    <div className="login-brand-icon">
                        C
                    </div>

                    <span>CRM 360</span>
                </div>

                <h1>Welcome Back</h1>

                <p className="login-subtitle">
                    Login to your CRM 360 account
                </p>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>

                    <div className="login-input-group">

                        <label>Username</label>

                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                        />

                    </div>

                    <div className="login-input-group">

                        <label>Password</label>

                        <div className="login-password">

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>

                        </div>

                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}

                        {!loading && (
                            <span>→</span>
                        )}
                    </button>

                </form>

                <div className="signup-text">

                    Don't have an account?

                    <Link to="/signup">
                        Sign Up
                    </Link>

                </div>

            </div>

        </div>
    );
}

export default Login;