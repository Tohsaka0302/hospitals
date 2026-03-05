// src/routes.jsx
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './hospitals/Dashboard';
import PatientList from './hospitals/PatientList';
import ShareData from './hospitals/ShareData';
import PatientDetail from './hospitals/PatientDetail';
import EditPatient from './hospitals/EditPatient';
import AddPatient from './hospitals/AddPatient';
import HospitalRemovalRequests from './hospitals/HospitalRemovalRequests';

const RoutesComponent = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/hospitals/dashboard" replace />} />
        <Route path="/hospitals/dashboard" element={<Dashboard />} />
        <Route path="/hospitals/patient-list" element={<PatientList />} />
        <Route path="/hospitals/add-patient" element={<AddPatient />} />
        <Route path="/hospitals/share-data" element={<ShareData />} />
        <Route path="/hospitals/removal-requests" element={<HospitalRemovalRequests />} />
        <Route path="/hospitals/patient/:id" element={<PatientDetail />} />
        <Route path="/hospitals/edit-patient/:id" element={<EditPatient />} />
      </Routes>
    </>
  );
};

export default RoutesComponent;
