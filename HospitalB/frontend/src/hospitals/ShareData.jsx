import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';

const ShareData = () => {
  const [patients, setPatients] = useState([]);
  const [pendingUnsyncIds, setPendingUnsyncIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareLoading, setShareLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchNationalId, setSearchNationalId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    Promise.all([
      fetch('/api/patients').then(res => res.json()),
      fetch('/api/removal-requests').then(res => res.json())
    ])
      .then(([patientsData, requestsData]) => {
        setPatients(patientsData);
        const pendingIds = requestsData
          .filter(req => ['Pending Hospital Approval', 'Pending MediConnect Approval'].includes(req.status))
          .map(req => req.patientId);
        setPendingUnsyncIds(pendingIds);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleTogglePatient = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Derived state for filtered patients
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesNationalId = p.national_id
      ? p.national_id.toLowerCase().includes(searchNationalId.toLowerCase())
      : searchNationalId === '';

    if (!matchesSearch || !matchesNationalId) return false;

    if (filterStatus === 'shared') return p.shared;
    if (filterStatus === 'unshared') return !p.shared;
    return true;
  });

  const handleSelectAll = () => {
    // Select/deselect ALL visible filtered patients (shared and unshared)
    const visibleIds = filteredPatients.map(p => p.id);

    // Check if all visible patients are already selected
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));

    if (allVisibleSelected) {
      // Deselect all visible
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible (merge with any selections outside current filter)
      const newSelections = new Set([...selectedIds, ...visibleIds]);
      setSelectedIds(Array.from(newSelections));
    }
  };

  const shareSelectedData = async () => {
    // Filter to only include patients that are NOT currently shared
    const unsharedSelectedIds = selectedIds.filter(id => {
      const p = patients.find(patient => patient.id === id);
      return p && !p.shared;
    });

    if (unsharedSelectedIds.length === 0) {
      alert("Please select at least one unshared patient to sync.");
      return;
    }

    setShareLoading(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientIds: unsharedSelectedIds })
      });
      const data = await response.json();
      alert(data.message || 'Data shared successfully');

      // Refresh the list to show updated shared status
      const [resPatients, resRequests] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/removal-requests')
      ]);
      const updatedPatients = await resPatients.json();
      const updatedRequests = await resRequests.json();
      setPatients(updatedPatients);
      const pendingIds = updatedRequests
        .filter(req => ['Pending Hospital Approval', 'Pending MediConnect Approval'].includes(req.status))
        .map(req => req.patientId);
      setPendingUnsyncIds(pendingIds);

      // Clear selection after sync
      setSelectedIds([]);

    } catch (err) {
      console.error(err);
      alert('Failed to share data');
    } finally {
      setShareLoading(false);
    }
  };

  const requestUnsync = async () => {
    // Filter to only include patients that are currently shared AND NOT pending unsync
    const sharedSelectedIds = selectedIds.filter(id => {
      const p = patients.find(patient => patient.id === id);
      return p && p.shared && !pendingUnsyncIds.includes(id);
    });

    if (sharedSelectedIds.length === 0) {
      alert("Please select at least one shared patient to unsync.");
      return;
    }

    setShareLoading(true);
    try {
      const response = await fetch('/api/removal-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientIds: sharedSelectedIds })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to request unsync');
      alert(data.message || 'Unsync requested successfully');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to request unsync');
    } finally {
      // Refresh the list to show updated pending status
      fetch('/api/removal-requests').then(res => res.json()).then(requestsData => {
        const pendingIds = requestsData
          .filter(req => ['Pending Hospital Approval', 'Pending MediConnect Approval'].includes(req.status))
          .map(req => req.patientId);
        setPendingUnsyncIds(pendingIds);
      }).catch(console.error);

      setShareLoading(false);
      setSelectedIds([]);
    }
  };

  const goToMediConnectAI = () => {
    window.location.href = "http://localhost:3000/mediconnectai/Landing";
  };

  if (loading) return (
    <div className="dashboard">
      <div className="stat-card" style={{ padding: '40px' }}>
        <p>Scanning local clinical directory...</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1>Data Governance & Sync</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Select specific clinical records to synchronize with the MediConnectAI ecosystem. Records are transmitted via secure FHIR-mapped channels.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>

        {/* Patient Selection List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Local Patient Directory</h2>
            <button className="btn-outline" style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={handleSelectAll}>
              {filteredPatients.length > 0 && filteredPatients.every(p => selectedIds.includes(p.id)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.9rem', color: '#000', backgroundColor: '#fff' }}
              />
              <input
                type="text"
                placeholder="Search by National ID..."
                value={searchNationalId}
                onChange={(e) => setSearchNationalId(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.9rem', color: '#000', backgroundColor: '#fff' }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.9rem', backgroundColor: 'white' }}
            >
              <option value="all">All Patients</option>
              <option value="shared">Shared Only</option>
              <option value="unshared">Unshared Only</option>
            </select>
          </div>

          {/* Table Container Box */}
          <div className="stat-card" style={{ padding: '0', overflow: 'hidden', alignItems: 'stretch' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Patient Records</h3>
            </div>
            <div className="table-container" style={{ margin: 0, border: 'none', borderRadius: '0', boxShadow: 'none', maxHeight: '500px', overflowY: 'auto' }}>
              <table className="patient-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Sync</th>
                    <th>Patient Identity</th>
                    <th>National ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(p => (
                    <tr key={p.id} style={{ cursor: 'pointer', opacity: p.shared ? 0.7 : 1 }} onClick={() => handleTogglePatient(p.id)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleTogglePatient(p.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {p.name}
                          {p.shared && !pendingUnsyncIds.includes(p.id) && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              backgroundColor: 'rgba(40, 167, 69, 0.1)',
                              color: '#28a745',
                              border: '1px solid rgba(40, 167, 69, 0.2)'
                            }}>
                              ✓ Shared
                            </span>
                          )}
                          {pendingUnsyncIds.includes(p.id) && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              backgroundColor: 'rgba(255, 193, 7, 0.1)',
                              color: '#d39e00',
                              border: '1px solid rgba(255, 193, 7, 0.2)'
                            }}>
                              ⏳ Pending Unsync
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {p.id}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {p.national_id || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sync Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="stat-card" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Sync Summary</h3>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pending Sync:</span>
                <span style={{ fontWeight: '700' }}>{selectedIds.length} Records</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Sharing clinical data allows MediConnectAI to perform predictive analysis and population health reporting.
              </p>

              <button
                onClick={shareSelectedData}
                disabled={shareLoading || selectedIds.filter(id => patients.find(p => p.id === id && !p.shared)).length === 0}
                className="btn-primary"
                style={{ width: '100%', marginTop: '12px' }}
              >
                {shareLoading ? 'Processing...' : '📡 Synchronize Selected'}
              </button>

              <button
                onClick={requestUnsync}
                disabled={shareLoading || selectedIds.filter(id => patients.find(p => p.id === id && p.shared && !pendingUnsyncIds.includes(id))).length === 0}
                className="btn-outline"
                style={{ width: '100%', marginTop: '8px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                {shareLoading ? 'Processing...' : '🗑️ Request Unsync'}
              </button>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Ecosystem Status</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Connection to Mediconnect-AI cluster is healthy.</p>
            <button onClick={goToMediConnectAI} className="btn-outline" style={{ width: '100%' }}>
              <span>🚀</span> Launch AI Portal
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShareData;
