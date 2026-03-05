import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';
import { useParams, useNavigate } from 'react-router-dom';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/patients/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Patient record not found');
        return res.json();
      })
      .then(data => {
        setPatient(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="dashboard">
      <div className="stat-card" style={{ padding: '40px' }}>
        <p>Retrieving patient clinical record...</p>
      </div>
    </div>
  );

  if (error || !patient) return (
    <div className="dashboard">
      <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
        <h2>Error</h2>
        <p>{error || 'Unable to load profile.'}</p>
        <button className="btn-outline" style={{ marginTop: '20px' }} onClick={() => navigate('/hospitals/patient-list')}>
          Back to Directory
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h1>👤 Comprehensive Patient Profile</h1>
        <button className="btn-outline" onClick={() => navigate('/hospitals/patient-list')}>
          ← Back to Records
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '32px' }}>

        {/* Basic Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="stat-card" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
            <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>Identity Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Full Name</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{patient.name}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Date of Birth</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{patient.birth_date || 'Not specified'}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Gender</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '500', textTransform: 'capitalize' }}>{patient.gender || 'Not specified'}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>National ID</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>{patient.national_id || 'Not specified'}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'center' }}>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate(`/hospitals/edit-patient/${id}`)}>
                  ✏️ Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Visit History */}
        <div>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>🩺</span> Clinical Engagement History
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {patient.visits && patient.visits.length > 0 ? (
              patient.visits.map((visit, index) => (
                <div key={index} className="table-container" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{visit.date}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Attending: <strong>{visit.doctor}</strong></span>
                  </div>
                  <p style={{ marginBottom: '16px', lineHeight: '1.6' }}><strong>Observation:</strong> {visit.notes}</p>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>ADMINISTERED TREATMENTS</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {visit.treatments && visit.treatments.map((treatment, i) => (
                        <span key={i} style={{
                          padding: '4px 12px',
                          background: '#f1f3f4',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}>
                          {treatment}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="stat-card" style={{ padding: '40px', background: 'transparent', borderStyle: 'dashed' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No previous visit records found for this patient.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientDetail;
