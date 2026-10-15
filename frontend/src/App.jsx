import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./components/MainLayout";

import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserManagement from "./pages/UserManagement";
import Accounts from "./pages/Accounts";
import Contacts from "./pages/Contacts";

import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Leads from "./pages/Leads";
import Opportunities from "./pages/Opportunities";
import Activities from "./pages/Activities";
import Tasks from "./pages/Tasks";
import Meetings from "./pages/Meetings";
import Companies from "./pages/Companies";
import AddCustomer from "./pages/AddCustomer";
import LocationTracking from "./pages/LocationTracking";
import AuditLogs from "./pages/AuditLogs";

function ProtectedRoute({ children, roles = [] }) {
    const token = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("crm360_user");

    if (!token || !savedUser) {
        return <Navigate to="/login" replace />;
    }

    let user;

    try {
        user = JSON.parse(savedUser);
    } catch (error) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("crm360_user");
        localStorage.removeItem("crm360_role");

        return <Navigate to="/login" replace />;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
}

const allRoles = [
    "Super Admin",
    "Company Admin",
    "Manager",
    "Employee"
];

const managementRoles = [
    "Super Admin",
    "Company Admin",
    "Manager"
];

const adminRoles = [
    "Super Admin",
    "Company Admin"
];

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/signup"
                    element={<Signup />}
                />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute roles={allRoles}>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute roles={allRoles}>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/customers"
                    element={
                        <ProtectedRoute roles={allRoles}>
                            <Customers />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/add-customer"
                    element={
                        <ProtectedRoute roles={allRoles}>
                            <AddCustomer />
                        </ProtectedRoute>
                    }
                />
                <Route
    path="/accounts"
    element={
        <ProtectedRoute roles={allRoles}>
            <Accounts />
        </ProtectedRoute>
    }
/>

<Route
    path="/contacts"
    element={
        <ProtectedRoute roles={allRoles}>
            <Contacts />
        </ProtectedRoute>
    }
/>

                <Route
                    path="/companies"
                    element={
                        <ProtectedRoute roles={managementRoles}>
                            <Companies />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employees"
                    element={
                        <ProtectedRoute roles={managementRoles}>
                            <Employees />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/user-management"
                    element={
                        <ProtectedRoute roles={adminRoles}>
                            <UserManagement />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/leads"
                    element={
                        <ProtectedRoute roles={allRoles}>
                            <Leads />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/opportunities"
                    element={
                        <ProtectedRoute roles={allRoles}>
                            <Opportunities />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/activities"
                    element={
                        <ProtectedRoute roles={allRoles}>
                            <Activities />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/tasks"
                    element={
                        <ProtectedRoute roles={allRoles}>
                            <Tasks />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/meetings"
                    element={
                        <ProtectedRoute roles={allRoles}>
                            <Meetings />
                        </ProtectedRoute>
                    }
                />

                <Route
    path="/location-tracking"
    element={
        <ProtectedRoute roles={allRoles}>
            <LocationTracking />
        </ProtectedRoute>
    }
/>

<Route
    path="/LocationTracking"
    element={
        <ProtectedRoute roles={allRoles}>
            <LocationTracking />
        </ProtectedRoute>
    }
/>  

                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute roles={managementRoles}>
                            <Reports />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/audit-logs"
                    element={
                        <ProtectedRoute roles={managementRoles}>
                            <AuditLogs />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute roles={allRoles}>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/dashboard"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;