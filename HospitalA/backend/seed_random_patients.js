require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hospitalA')
    .then(() => console.log('Connected to MongoDB (Hospital A) for seeding...'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Define Patient Schema
const patientSchema = new mongoose.Schema({
    id: String,
    name: String,
    age: Number,
    condition: String,
    hospital: { type: String, default: 'Hospital A' },
    birth_date: String,
    gender: String,
    national_id: String,
    shared: { type: Boolean, default: false },
    visits: [{
        date: String,
        doctor: String,
        notes: String,
        treatments: [String]
    }]
});

// Auto-increment ID
patientSchema.pre('save', async function () {
    if (!this.id) {
        const count = await mongoose.model('Patient').countDocuments();
        this.id = `${count + 1}_A_Spec`;
    }
});

const Patient = mongoose.model('Patient', patientSchema);

const specialties = [
    {
        dept: 'Internal Medicine',
        doctor: 'Dr. Gregory House',
        conditions: ['Hypertension', 'Type 2 Diabetes', 'High Cholesterol'],
        treatments: ['Lisinopril', 'Metformin', 'Statins']
    },
    {
        dept: 'Pediatrics',
        doctor: 'Dr. Arizona Robbins',
        conditions: ['Asthma', 'Ear Infection', 'Chickenpox'],
        treatments: ['Albuterol', 'Amoxicillin', 'Antiviral cream']
    },
    {
        dept: 'Family Medicine',
        doctor: 'Dr. Meredith Grey',
        conditions: ['Flu', 'General Checkup', 'Migraine'],
        treatments: ['Rest and fluids', 'Vaccination', 'Sumatriptan']
    },
    {
        dept: 'Surgery',
        doctor: 'Dr. Derek Shepherd',
        conditions: ['Appendicitis', 'Hernia', 'Gallstones'],
        treatments: ['Appendectomy', 'Hernia repair', 'Cholecystectomy']
    },
    {
        dept: 'Psychiatry',
        doctor: 'Dr. Hannibal Lecter',
        conditions: ['Anxiety Disorder', 'Major Depression', 'Insomnia'],
        treatments: ['Cognitive Behavioral Therapy', 'SSRI', 'Melatonin']
    },
    {
        dept: 'Radiology',
        doctor: 'Dr. John Dorian',
        conditions: ['Bone Fracture', 'Joint Pain', 'Chest Pain'],
        treatments: ['X-Ray and Cast', 'MRI Scan', 'CT Scan']
    },
    {
        dept: 'Anesthesiology',
        doctor: 'Dr. Christopher Turk',
        conditions: ['Pre-op Assessment', 'Chronic Pain', 'Surgical Prep'],
        treatments: ['General Anesthesia', 'Epidural', 'Local Anesthetic']
    }
];

const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePatients(count) {
    const generated = [];
    for (let i = 0; i < count; i++) {
        const spec = getRandomItem(specialties);
        const condition = getRandomItem(spec.conditions);
        const treatment = getRandomItem(spec.treatments);
        const age = Math.floor(Math.random() * 80) + 1;
        const yearOffset = 2025 - age;
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');

        generated.push({
            name: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
            age: age,
            condition: condition,
            hospital: 'Hospital A',
            birth_date: `${yearOffset}-${month}-${day}`,
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            national_id: `NAT-A${Math.floor(Math.random() * 9000) + 1000}`,
            visits: [{
                date: `2025-${month}-15`,
                doctor: `${spec.doctor} (${spec.dept})`,
                notes: `Patient diagnosed with ${condition}. Admitted under ${spec.dept}.`,
                treatments: [treatment]
            }]
        });
    }
    return generated;
}

const samplePatients = generatePatients(21); // 3 for each of the 7 specialties

async function seedDB() {
    try {
        await Patient.deleteMany({}); // Clear existing records
        console.log('Cleared existing Hospital A patients.');

        for (const patientData of samplePatients) {
            const patient = new Patient(patientData);
            await patient.save();
        }

        console.log(`Successfully seeded ${samplePatients.length} patients with required specialties for Hospital A.`);
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        mongoose.connection.close();
    }
}

seedDB();
