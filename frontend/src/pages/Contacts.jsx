import { useEffect, useState } from "react";
import "./Contacts.css";
import { apiFetch } from "../api";

function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingContactId, setEditingContactId] = useState(null);

    const [formData, setFormData] = useState({
        contact_name: "",
        account_id: "",
        designation: "",
        mobile_number: "",
        email_address: "",
        department: "",
        address: "",
        status: "Active",
        remarks: ""
    });

    const fetchContacts = async () => {
        try {
            const response = await apiFetch("/contacts/");

            if (!response.ok) {
                throw new Error("Failed to fetch contacts");
            }

            const data = await response.json();
            setContacts(data);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await apiFetch("/accounts/");

            if (!response.ok) {
                throw new Error("Failed to fetch accounts");
            }

            const data = await response.json();
            setAccounts(data);
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    };

    useEffect(() => {
        fetchContacts();
        fetchAccounts();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setFormData({
            contact_name: "",
            account_id: "",
            designation: "",
            mobile_number: "",
            email_address: "",
            department: "",
            address: "",
            status: "Active",
            remarks: ""
        });

        setEditingContactId(null);
    };

    const handleEdit = (contact) => {
        setEditingContactId(contact.contact_id);

        setFormData({
            contact_name: contact.contact_name || "",
            account_id: contact.account_id || "",
            designation: contact.designation || "",
            mobile_number: contact.mobile_number || "",
            email_address: contact.email_address || "",
            department: contact.department || "",
            address: contact.address || "",
            status: contact.status || "Active",
            remarks: contact.remarks || ""
        });

        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (!formData.account_id) {
                alert("Please select an account.");
                return;
            }

            const requestData = {
                contact_name: formData.contact_name,
                account_id: Number(formData.account_id),
                designation: formData.designation,
                mobile_number: formData.mobile_number,
                email_address: formData.email_address,
                department: formData.department,
                address: formData.address,
                status: formData.status,
                remarks: formData.remarks
            };

            let response;

            if (editingContactId) {
                response = await apiFetch(
                    `/contacts/${editingContactId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(requestData)
                    }
                );
            } else {
                response = await apiFetch(
                    "/contacts/",
                    {
                        method: "POST",
                        body: JSON.stringify(requestData)
                    }
                );
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);

                throw new Error(
                    errorData?.detail || "Failed to save contact"
                );
            }

            alert(
                editingContactId
                    ? "Contact updated successfully."
                    : "Contact added successfully."
            );

            resetForm();
            setShowForm(false);

            await fetchContacts();

        } catch (error) {
            console.error("Error saving contact:", error);

            alert(
                error.message ||
                "Failed to save contact. Check the backend."
            );
        }
    };

    const handleDelete = async (contactId) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this contact?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await apiFetch(
                `/contacts/${contactId}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);

                throw new Error(
                    errorData?.detail || "Failed to delete contact"
                );
            }

            alert("Contact deleted successfully.");

            await fetchContacts();

        } catch (error) {
            console.error("Error deleting contact:", error);

            alert(
                error.message ||
                "Failed to delete contact."
            );
        }
    };

    const filteredContacts = contacts.filter((contact) => {
        const searchText = search.toLowerCase();

        return (
            contact.contact_name
                ?.toLowerCase()
                .includes(searchText) ||

            contact.email_address
                ?.toLowerCase()
                .includes(searchText) ||

            contact.mobile_number
                ?.toLowerCase()
                .includes(searchText)
        );
    });

    const getAccountName = (accountId) => {
        const account = accounts.find(
            (item) =>
                Number(item.account_id) === Number(accountId)
        );

        return account
            ? account.account_name
            : "-";
    };

    return (
        <div className="contacts-page">

            <div className="contacts-header">

                <div>
                    <h1>Contacts</h1>

                    <p>
                        Manage and track your customer contacts
                    </p>
                </div>

                <button
                    className="add-contact-btn"
                    onClick={() => {
                        if (showForm) {
                            setShowForm(false);
                            resetForm();
                        } else {
                            resetForm();
                            setShowForm(true);
                        }
                    }}
                >
                    + Add Contact
                </button>

            </div>

            {showForm && (
                <div className="contact-form">

                    <h2>
                        {editingContactId
                            ? "Edit Contact"
                            : "Add New Contact"}
                    </h2>

                    <form onSubmit={handleSubmit}>

                        <input
                            type="text"
                            name="contact_name"
                            placeholder="Contact Name *"
                            value={formData.contact_name}
                            onChange={handleChange}
                            required
                        />

                        <select
                            name="account_id"
                            value={formData.account_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select Account *
                            </option>

                            {accounts.map((account) => (
                                <option
                                    key={account.account_id}
                                    value={account.account_id}
                                >
                                    {account.account_name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            name="designation"
                            placeholder="Designation"
                            value={formData.designation}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="mobile_number"
                            placeholder="Mobile Number *"
                            value={formData.mobile_number}
                            onChange={handleChange}
                            required
                        />

                        <input
                            type="email"
                            name="email_address"
                            placeholder="Email Address"
                            value={formData.email_address}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="department"
                            placeholder="Department"
                            value={formData.department}
                            onChange={handleChange}
                        />

                        <input
                            type="text"
                            name="address"
                            placeholder="Address"
                            value={formData.address}
                            onChange={handleChange}
                        />

                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="Active">
                                Active
                            </option>

                            <option value="Inactive">
                                Inactive
                            </option>
                        </select>

                        <textarea
                            name="remarks"
                            placeholder="Remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                        />

                        <div className="contact-form-buttons">

                            <button type="submit">
                                {editingContactId
                                    ? "Update Contact"
                                    : "Save Contact"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>
            )}

            <div className="contact-search">

                <input
                    type="text"
                    placeholder="Search contacts..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                />

            </div>

            <div className="contacts-table">

                <table>

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Contact Name</th>
                            <th>Account</th>
                            <th>Designation</th>
                            <th>Email</th>
                            <th>Mobile</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        {filteredContacts.length > 0 ? (

                            filteredContacts.map((contact) => (
                                <tr key={contact.contact_id}>

                                    <td>
                                        {contact.contact_id}
                                    </td>

                                    <td>
                                        {contact.contact_name}
                                    </td>

                                    <td>
                                        {getAccountName(
                                            contact.account_id
                                        )}
                                    </td>

                                    <td>
                                        {contact.designation || "-"}
                                    </td>

                                    <td>
                                        {contact.email_address || "-"}
                                    </td>

                                    <td>
                                        {contact.mobile_number || "-"}
                                    </td>

                                    <td>
                                        <span className="contact-status">
                                            {contact.status}
                                        </span>
                                    </td>

                                    <td>

                                        <button
                                            className="contact-edit"
                                            onClick={() =>
                                                handleEdit(contact)
                                            }
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="contact-delete"
                                            onClick={() =>
                                                handleDelete(
                                                    contact.contact_id
                                                )
                                            }
                                        >
                                            Delete
                                        </button>

                                    </td>

                                </tr>
                            ))

                        ) : (

                            <tr>
                                <td colSpan="8">
                                    No contacts found
                                </td>
                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default Contacts;