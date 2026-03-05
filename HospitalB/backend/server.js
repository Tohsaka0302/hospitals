require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hospitalB')
    .then(() => console.log('Connected to MongoDB (Hospital B)'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Patient Schema & Model
const patientSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: String,
    age: Number,
    condition: String,
    hospital: { type: String, default: 'Hospital B' },
    birth_date: String,
    gender: String,
    national_id: String,
    shared: { type: Boolean, default: false },
    visits: [
        {
            date: String,
            doctor: String,
            notes: String,
            treatments: [String]
        }
    ]
});

patientSchema.pre('save', async function () {
    if (!this.id) {
        const count = await mongoose.model('Patient').countDocuments();
        this.id = `${count + 1}_B`;
    }
});

const Patient = mongoose.model('Patient', patientSchema);

// Removal Request Schema & Model
const removalRequestSchema = new mongoose.Schema({
    patientId: String,
    patientName: String,
    status: { type: String, default: 'Pending Hospital Approval' }, // Pending Hospital Approval, Pending MediConnect Approval, Approved, Rejected
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const RemovalRequest = mongoose.model('RemovalRequest', removalRequestSchema);

app.get('/api/patients', async (req, res) => {
    try {
        const patients = await Patient.find({});
        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
});

// Get basic statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const sharedPatients = await Patient.countDocuments({ shared: true });
        res.json({ totalPatients, sharedPatients });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get a single patient by ID
app.get('/api/patients/:id', async (req, res) => {
    try {
        const patient = await Patient.findOne({ id: req.params.id });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        res.json(patient);
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ error: 'Failed to fetch patient' });
    }
});

// Update a patient by ID
app.put('/api/patients/:id', async (req, res) => {
    try {
        const { name, age, condition, hospital, birth_date, gender, national_id, visits } = req.body;
        const updatedPatient = await Patient.findOneAndUpdate(
            { id: req.params.id },
            { name, age, condition, hospital, birth_date, gender, national_id, visits },
            { new: true }
        );
        if (!updatedPatient) return res.status(404).json({ error: 'Patient not found' });

        // ── Re-sync to Mediconnect if already shared ──
        if (updatedPatient.shared) {
            const mediconnectUrl = process.env.MEDICONNECT_URL || 'http://localhost:5000/api/ingest-hospital-data';
            const apiKey = process.env.MEDICONNECT_API_KEY || 'sk_test_12345hospitalB';
            axios.post(mediconnectUrl, updatedPatient.toObject(), {
                headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }
            }).then(() => {
                console.log(`Re-synced updated patient ${updatedPatient.id} to Mediconnect.`);
            }).catch(err => {
                console.error(`Failed to re-sync patient ${updatedPatient.id}:`, err.message);
            });
        }

        res.json(updatedPatient);
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ error: 'Failed to update patient' });
    }
});

// Add a new endpoint to seed/create patients easily
app.post('/api/patients', async (req, res) => {
    try {
        const newPatient = new Patient(req.body);
        await newPatient.save();
        res.status(201).json(newPatient);
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ error: 'Failed to create patient' });
    }
});

// Endpoint to share data with Mediconnect-AI AI Backend
app.post('/api/share', async (req, res) => {
    try {
        const { patientIds } = req.body;

        // Find patients to share
        let query = {};
        if (Array.isArray(patientIds) && patientIds.length > 0) {
            query = { id: { $in: patientIds } };
        }

        const patients = await Patient.find(query);

        if (patients.length === 0) {
            return res.json({ message: "No patients found matching the selection criteria." });
        }

        const mediconnectUrlBulk = (process.env.MEDICONNECT_URL || 'http://localhost:5000/api/ingest-hospital-data') + '/bulk';
        const apiKey = process.env.MEDICONNECT_API_KEY || 'mediconnect-hospital-b-key';

        console.log(`Sending ${patients.length} patients to MediConnect in bulk...`);

        // Send bulk payload to Mediconnect-AI
        const payload = patients.map(p => p.toObject());
        await axios.post(mediconnectUrlBulk, payload, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        // Mark patients as shared locally using updateMany for efficiency
        const idsToUpdate = patients.map(p => p.id);
        await Patient.updateMany(
            { id: { $in: idsToUpdate } },
            { $set: { shared: true } }
        );

        res.json({ message: `Successfully shared ${patients.length} patients with MediConnectAI in bulk.` });
    } catch (error) {
        console.error('Error sharing data in bulk:', error.message);
        res.status(500).json({ error: 'Failed to share data with MediConnectAI' });
    }
});

// --- Removal Request Endpoints ---

// Get all removal requests
app.get('/api/removal-requests', async (req, res) => {
    try {
        const requests = await RemovalRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching removal requests:', error);
        res.status(500).json({ error: 'Failed to fetch removal requests' });
    }
});

// Create a new removal request (Initiated by Hospital User)
app.post('/api/removal-requests', async (req, res) => {
    try {
        const { patientIds } = req.body;
        if (!patientIds || patientIds.length === 0) {
            return res.status(400).json({ error: 'No patient IDs provided' });
        }

        const patients = await Patient.find({ id: { $in: patientIds } });
        const createdRequests = [];

        for (const patient of patients) {
            // Check if a pending request already exists for this patient
            const existingRequest = await RemovalRequest.findOne({
                patientId: patient.id,
                status: { $in: ['Pending Hospital Approval', 'Pending MediConnect Approval'] }
            });

            if (!existingRequest) {
                const newRequest = new RemovalRequest({
                    patientId: patient.id,
                    patientName: patient.name
                });
                await newRequest.save();
                createdRequests.push(newRequest);
            }
        }

        res.status(201).json({
            message: `Created ${createdRequests.length} removal requests.`,
            requests: createdRequests
        });
    } catch (error) {
        console.error('Error creating removal request:', error);
        res.status(500).json({ error: 'Failed to create removal request: ' + error.message });
    }
});

// Approve a removal request locally and forward to MediConnectAI
app.put('/api/removal-requests/:id/approve', async (req, res) => {
    try {
        const request = await RemovalRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Removal request not found' });
        }

        if (request.status !== 'Pending Hospital Approval') {
            return res.status(400).json({ error: 'Request is not pending hospital approval' });
        }

        // Forward to MediConnectAI
        const mediconnectUrl = process.env.MEDICONNECT_URL ? process.env.MEDICONNECT_URL.replace('/api/ingest-hospital-data', '/api/removal-requests') : 'http://localhost:5000/api/removal-requests';
        const apiKey = process.env.MEDICONNECT_API_KEY || 'mediconnect-hospital-b-key'; // Define apiKey here

        try {
            // Fetch the patient to get their national_id for MediConnect lookup
            const patient = await Patient.findOne({ id: request.patientId });
            const mediconnectResponse = await axios.post(mediconnectUrl, {
                hospitalRequestId: request._id,
                patientId: request.patientId,
                patientName: request.patientName,
                hospital: 'Hospital B',
                national_id: patient ? patient.national_id : undefined
            }, {
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            // If successfully forwarded, update local status
            request.status = 'Pending MediConnect Approval';
            request.updatedAt = Date.now();
            await request.save();

            res.json({ message: 'Request approved locally and forwarded to MediConnectAI', request });
        } catch (forwardError) {
            console.error('Failed to forward removal request to MediConnect:', forwardError.response ? forwardError.response.data : forwardError.message);
            res.status(502).json({ error: 'Failed to communicate with MediConnectAI. Request remains pending.' });
        }

    } catch (error) {
        console.error('Error approving removal request:', error);
        res.status(500).json({ error: 'Failed to approve removal request' });
    }
});

// Reject a removal request locally
app.put('/api/removal-requests/:id/reject', async (req, res) => {
    try {
        const request = await RemovalRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Removal request not found' });
        }

        request.status = 'Rejected';
        request.updatedAt = Date.now();
        await request.save();

        res.json({ message: 'Removal request rejected', request });
    } catch (error) {
        console.error('Error rejecting removal request:', error);
        res.status(500).json({ error: 'Failed to reject removal request' });
    }
});

// --- Webhooks ---

// Receive unsync completion ping from MediConnect
app.post('/api/webhook/unsync', async (req, res) => {
    try {
        const { patientId } = req.body;
        if (!patientId) {
            return res.status(400).json({ error: 'patientId is required' });
        }

        const patient = await Patient.findOne({ id: patientId });
        if (patient) {
            patient.shared = false;
            await patient.save();

            // Also mark any pending removal requests as 'Approved'
            await RemovalRequest.updateMany(
                { patientId: patientId, status: { $in: ['Pending Hospital Approval', 'Pending MediConnect Approval'] } },
                { $set: { status: 'Approved', updatedAt: Date.now() } }
            );

            res.json({ message: `Patient ${patientId} successfully unsynced locally.` });
        } else {
            res.status(404).json({ error: 'Patient not found locally' });
        }
    } catch (error) {
        console.error('Error handling unsync webhook:', error);
        res.status(500).json({ error: 'Internal server error handling webhook' });
    }
});

app.listen(PORT, () => {
    console.log(`Hospital B Backend running on port ${PORT}`);
});
