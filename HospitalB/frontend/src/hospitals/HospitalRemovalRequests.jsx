import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';

const HospitalRemovalRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRequests = () => {
        setLoading(true);
        fetch('/api/removal-requests')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch requests');
                return res.json();
            })
            .then(data => {
                setRequests(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, action) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/removal-requests/${id}/${action}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to process request');

            alert(data.message || `Request ${action}d successfully`);
            fetchRequests(); // Refresh list
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveAll = async () => {
        const pendingIds = requests
            .filter(req => req.status === 'Pending Hospital Approval')
            .map(req => req._id);

        if (pendingIds.length === 0) {
            alert('There are no pending requests to approve.');
            return;
        }

        if (!window.confirm(`Are you sure you want to approve all ${pendingIds.length} pending requests?`)) {
            return;
        }

        setActionLoading(true);
        let successCount = 0;
        let failCount = 0;

        try {
            await Promise.all(pendingIds.map(async (id) => {
                try {
                    const res = await fetch(`/api/removal-requests/${id}/approve`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    if (res.ok) successCount++;
                    else failCount++;
                } catch (err) {
                    failCount++;
                }
            }));

            alert(`Finished processing. Successfully approved: ${successCount}, Failed: ${failCount}`);
            fetchRequests();
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending Hospital Approval':
                return { backgroundColor: 'rgba(255, 193, 7, 0.2)', color: '#d39e00' };
            case 'Pending MediConnect Approval':
                return { backgroundColor: 'rgba(23, 162, 184, 0.2)', color: '#117a8b' };
            case 'Approved':
                return { backgroundColor: 'rgba(40, 167, 69, 0.2)', color: '#28a745' };
            case 'Rejected':
                return { backgroundColor: 'rgba(220, 53, 69, 0.2)', color: '#dc3545' };
            default:
                return { backgroundColor: '#f8f9fa', color: '#6c757d' };
        }
    };

    if (loading) return (
        <div className="dashboard">
            <div className="stat-card" style={{ padding: '40px' }}>
                <p>Loading removal requests...</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Unsync Requests</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage requests to remove patient data from the MediConnectAI ecosystem.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-primary"
                        onClick={handleApproveAll}
                        disabled={actionLoading || requests.filter(r => r.status === 'Pending Hospital Approval').length === 0}
                    >
                        ✅ Approve All Pending
                    </button>
                    <button onClick={fetchRequests} className="btn-outline" disabled={actionLoading}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div className="table-container">
                <table className="patient-table">
                    <thead>
                        <tr>
                            <th>Patient Identity</th>
                            <th>Status</th>
                            <th>Requested On</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No removal requests found.</td>
                            </tr>
                        ) : (
                            requests.map(req => (
                                <tr key={req._id}>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{req.patientName}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {req.patientId}</div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: '500',
                                            ...getStatusStyle(req.status)
                                        }}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {new Date(req.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div className="actions-cell" style={{ justifyContent: 'center' }}>
                                            {req.status === 'Pending Hospital Approval' ? (
                                                <>
                                                    <button
                                                        className="btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                        onClick={() => handleAction(req._id, 'approve')}
                                                        disabled={actionLoading}
                                                    >
                                                        ✅ Approve
                                                    </button>
                                                    <button
                                                        className="btn-outline"
                                                        style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                                        onClick={() => handleAction(req._id, 'reject')}
                                                        disabled={actionLoading}
                                                    >
                                                        ❌ Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    No actions available
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HospitalRemovalRequests;
