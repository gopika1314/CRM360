
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";

function Signup() {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !fullName ||
            !username ||
            !email ||
            !password ||
            !confirmPassword
        ) {
            setError("Please fill all fields");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const response = await fetch(
                "http://127.0.0.1:8000/users/signup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        full_name: fullName,
                        username: username,
                        email: email,
                        password: password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Signup failed");
                return;
            }

            setSuccess("Account created successfully!");

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {
            setError("Unable to connect to the backend");
        }
    };

    return (
        <div className="signup-page">
            <div className="signup-card">

                <div className="signup-brand">
                    <div className="signup-brand-icon">C</div>
                    <span>CRM 360</span>
                </div>

                <h1>Create Account</h1>

                <p className="signup-subtitle">
                    Create your account to get started
                </p>

                {error && (
                    <div className="signup-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="signup-success">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSignup}>

                    <div className="signup-input-group">
                        <label>Full Name</label>

                        <input
                            type="text"
                            placeholder="Enter your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div className="signup-input-group">
                        <label>Username</label>

                        <input
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="signup-input-group">
                        <label>Email</label>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="signup-input-group">
                        <label>Password</label>

                        <div className="signup-password">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Create password"
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

                    <div className="signup-input-group">
                        <label>Confirm Password</label>

                        <input
                            type="password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                        />
                    </div>

                    <button
                        type="submit"
                        className="create-account-button"
                    >
                        Create Account
                        <span>→</span>
                    </button>

                </form>

                <div className="login-text">
                    Already have an account?
                    <Link to="/login">
                        Login
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default Signup;
