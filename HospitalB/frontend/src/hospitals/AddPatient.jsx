import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

const AddPatient = () => {
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch(`/api/patients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to create patient');
                return res.json();
            })
            .then((newPatient) => {
                alert('Patient record created successfully!');
                navigate(`/hospitals/patient/${newPatient.id}`);
            })
            .catch(err => {
                console.error(err);
                alert(err.message);
            });
    };

    return (
        <div className="dashboard">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Add New Patient Record</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Enter the demographic and clinical details for the new patient.</p>
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
                            💾 Create Patient
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

export default AddPatient;
