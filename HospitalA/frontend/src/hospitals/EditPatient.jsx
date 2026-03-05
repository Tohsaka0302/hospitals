import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const EditPatient = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        age: '',
        condition: '',
        hospital: 'Hospital A',
        birth_date: '',
        gender: '',
        national_id: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch current patient data
        fetch(`/api/patients/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch patient data');
                return res.json();
            })
            .then(data => {
                setFormData({
                    name: data.name || '',
                    age: data.age || '',
                    condition: data.condition || '',
                    hospital: data.hospital || 'Hospital A',
                    birth_date: data.birth_date || '',
                    gender: data.gender || '',
                    national_id: data.national_id || ''
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch(`/api/patients/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to update patient');
                return res.json();
            })
            .then(() => {
                alert('Patient record updated successfully!');
                navigate(`/hospitals/patient/${id}`);
            })
            .catch(err => {
                console.error(err);
                alert(err.message);
            });
    };

    if (loading) return (
        <div className="dashboard">
            <div className="stat-card" style={{ padding: '40px' }}>
                <p>Retrieving patient clinical record...</p>
            </div>
        </div>
    );
    if (error) return (
        <div className="dashboard">
            <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                <h2>Error</h2>
                <p>{error}</p>
                <button className="btn-outline" style={{ marginTop: '20px' }} onClick={() => navigate('/hospitals/patient-list')}>
                    Back to Directory
                </button>
            </div>
        </div>
    );

    return (
        <div className="dashboard">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Patient Record Update</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Modify patient details for ID: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{id}</span></p>
            </div>

            <div className="edit-form-card">
                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label>Patient Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label>Age</label>
                            <input
                                type="number"
                                name="age"
                                placeholder="Years"
                                value={formData.age}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input
                                type="date"
                                name="birth_date"
                                value={formData.birth_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>National ID</label>
                            <input
                                type="text"
                                name="national_id"
                                placeholder="ID Number"
                                value={formData.national_id}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Facility</label>
                        <input
                            type="text"
                            name="hospital"
                            value={formData.hospital}
                            readOnly
                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Medical Condition</label>
                        <textarea
                            name="condition"
                            placeholder="Primary diagnosis or symptoms..."
                            value={formData.condition}
                            onChange={handleChange}
                            required
                            rows="3"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                            💾 Save Changes
                        </button>
                        <button type="button" onClick={() => navigate('/hospitals/patient-list')} className="btn-outline" style={{ flex: 1 }}>
                            Cancel
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EditPatient;
