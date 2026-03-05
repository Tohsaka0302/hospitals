/**
 * seed_same_patients.js — Hospital B
 *
 * Simulates the SAME patients from Hospital A visiting Hospital B.
 * Reads patients from the hospitalA database (matching by national_id / name / birth_date),
 * then inserts them into the hospitalB database with DIFFERENT visit data
 * (different doctors, conditions, notes) to mimic a second-opinion / follow-up scenario.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ── Schemas ─────────────────────────────────────────────────────────────────

const visitSchema = new mongoose.Schema({
    date: String,
    doctor: String,
    notes: String,
    treatments: [String]
});

const patientSchemaA = new mongoose.Schema({
    id: String,
    name: String,
    age: Number,
    condition: String,
    hospital: String,
    birth_date: String,
    gender: String,
    national_id: String,
    shared: Boolean,
    visits: [visitSchema]
});

const patientSchemaB = new mongoose.Schema({
    id: String,
    name: String,
    age: Number,
    condition: String,
    hospital: { type: String, default: 'Hospital B' },
    birth_date: String,
    gender: String,
    national_id: String,
    shared: { type: Boolean, default: false },
    visits: [visitSchema]
});

// Auto-increment Hospital B ID
patientSchemaB.pre('save', async function () {
    if (!this.id) {
        const count = await PatientB.countDocuments();
        this.id = `${count + 1}_B_Shared`;
    }
});

// ── Different visit data for Hospital B ─────────────────────────────────────

/**
 * Maps a condition seen at Hospital A to a Hospital B follow-up scenario.
 * If the condition is not in the map, a generic follow-up entry is returned.
 */
const conditionFollowUp = {
    // Internal Medicine
    'Hypertension': {
        dept: 'Cardiology',
        doctor: 'Dr. Yang Cristina',
        followCondition: 'Hypertensive Heart Disease',
        notes: 'Patient referred for cardiac evaluation following hypertension diagnosis at Hospital A. Echo-cardiogram ordered.',
        treatments: ['ACE Inhibitor adjusted', 'Echocardiogram', 'Lifestyle counseling']
    },
    'Type 2 Diabetes': {
        dept: 'Endocrinology',
        doctor: 'Dr. Temperance Brennan',
        followCondition: 'Type 2 Diabetes with Neuropathy',
        notes: 'Follow-up for diabetes management. Peripheral neuropathy signs detected. HbA1c panel ordered.',
        treatments: ['HbA1c monitoring', 'Insulin adjustment', 'Neuropathy screening']
    },
    'High Cholesterol': {
        dept: 'Cardiology',
        doctor: 'Dr. Yang Cristina',
        followCondition: 'Dyslipidemia',
        notes: 'Patient arrives with prior high cholesterol diagnosis. Lipid panel and cardiac risk assessment conducted.',
        treatments: ['Lipid panel', 'Atorvastatin', 'Dietary plan review']
    },
    // Pediatrics
    'Asthma': {
        dept: 'Pulmonology',
        doctor: 'Dr. Lawrence Kutner',
        followCondition: 'Moderate Persistent Asthma',
        notes: 'Referred from prior hospital. Spirometry and allergy tests conducted to confirm asthma severity.',
        treatments: ['Spirometry', 'Inhaled corticosteroids', 'Allergy testing']
    },
    'Ear Infection': {
        dept: 'ENT',
        doctor: 'Dr. Chris Taub',
        followCondition: 'Recurrent Otitis Media',
        notes: 'Patient with recurring ear infections seen previously. Audiometry and tympanometry performed.',
        treatments: ['Audiometry', 'Ciprofloxacin ear drops', 'ENT follow-up scheduled']
    },
    'Chickenpox': {
        dept: 'Infectious Disease',
        doctor: 'Dr. Eric Foreman',
        followCondition: 'Varicella Complications',
        notes: 'Post-chickenpox follow-up. Secondary bacterial infection assessment and skin review.',
        treatments: ['Antiviral continued', 'Topical antibiotic', 'Isolation guidance']
    },
    // Family Medicine
    'Flu': {
        dept: 'Internal Medicine',
        doctor: 'Dr. Rebecca Lewis',
        followCondition: 'Post-Influenza Fatigue Syndrome',
        notes: 'Patient recovering from flu. Follow-up for persistent fatigue and secondary infection screening.',
        treatments: ['Rest protocol', 'Vitamin C supplementation', 'Chest X-Ray']
    },
    'General Checkup': {
        dept: 'Preventive Medicine',
        doctor: 'Dr. Marcus Andrews',
        followCondition: 'Routine Health Screening',
        notes: 'Annual checkup at Hospital B. Comprehensive metabolic panel and BMI assessment done.',
        treatments: ['Metabolic panel', 'Blood pressure monitoring', 'Vaccination update']
    },
    'Migraine': {
        dept: 'Neurology',
        doctor: 'Dr. Amelia Shepherd',
        followCondition: 'Chronic Migraine',
        notes: 'Patient with prior migraine history. MRI ordered to rule out secondary causes. Prophylactic therapy reviewed.',
        treatments: ['MRI Brain', 'Topiramate prescribed', 'Trigger diary recommended']
    },
    // Surgery
    'Appendicitis': {
        dept: 'Post-Surgical Monitoring',
        doctor: 'Dr. Preston Burke',
        followCondition: 'Post-Appendectomy Recovery',
        notes: 'Post-appendectomy follow-up. Wound healing assessed. No signs of infection.',
        treatments: ['Wound inspection', 'Antibiotic review', 'Activity restriction guidance']
    },
    'Hernia': {
        dept: 'Surgery',
        doctor: 'Dr. Preston Burke',
        followCondition: 'Recurrent Inguinal Hernia',
        notes: 'Patient reports discomfort at previous hernia repair site. Ultrasound and surgical reassessment.',
        treatments: ['Ultrasound', 'Mesh repair evaluation', 'Pain management']
    },
    'Gallstones': {
        dept: 'Gastroenterology',
        doctor: 'Dr. Aaron Glassman',
        followCondition: 'Cholelithiasis Follow-up',
        notes: 'Gallstone management review. ERCP discussed. Abdominal ultrasound repeated.',
        treatments: ['ERCP consultation', 'Ursodiol', 'Dietary fat restriction']
    },
    // Psychiatry
    'Anxiety Disorder': {
        dept: 'Psychiatry',
        doctor: 'Dr. Elena Michaels',
        followCondition: 'Generalized Anxiety Disorder — Confirmed',
        notes: 'Second evaluation at Hospital B confirms GAD. Structured therapy plan initiated along with pharmacological review.',
        treatments: ['CBT session scheduled', 'Buspirone added', 'Sleep hygiene program']
    },
    'Major Depression': {
        dept: 'Psychiatry',
        doctor: 'Dr. Elena Michaels',
        followCondition: 'Recurrent Major Depressive Disorder',
        notes: 'Patient seeking second opinion. Depression severity assessed via PHQ-9. Treatment-resistant depression protocol initiated.',
        treatments: ['PHQ-9 assessment', 'Antidepressant switch to Venlafaxine', 'Psychotherapy referral']
    },
    'Insomnia': {
        dept: 'Sleep Medicine',
        doctor: 'Dr. Marcus Andrews',
        followCondition: 'Chronic Insomnia — Secondary Assessment',
        notes: 'Sleep study scheduled to assess insomnia etiology. Sleep apnea ruled out.',
        treatments: ['Polysomnography', 'Cognitive Behavioral Therapy for Insomnia', 'Sleep restriction therapy']
    },
    // Radiology
    'Bone Fracture': {
        dept: 'Orthopedics',
        doctor: 'Dr. Reed Adamson',
        followCondition: 'Fracture Healing Assessment',
        notes: 'Follow-up X-Ray shows satisfactory bone healing. Physical therapy commenced.',
        treatments: ['Follow-up X-Ray', 'Physiotherapy referral', 'Calcium supplementation']
    },
    'Joint Pain': {
        dept: 'Rheumatology',
        doctor: 'Dr. Paula Reyes',
        followCondition: 'Early-Stage Osteoarthritis',
        notes: 'Arthritis panel and joint fluid analysis performed. Early OA confirmed in knee joints.',
        treatments: ['NSAIDs', 'Joint fluid aspiration', 'Glucosamine supplement']
    },
    'Chest Pain': {
        dept: 'Cardiology',
        doctor: 'Dr. Yang Cristina',
        followCondition: 'Non-Cardiac Chest Pain — Ruled Out ACS',
        notes: 'Cardiac workup completed. ACS ruled out. Musculoskeletal origin suspected. ECG and troponin normal.',
        treatments: ['ECG', 'Troponin test', 'NSAIDs for musculoskeletal relief']
    },
    // Anesthesiology
    'Pre-op Assessment': {
        dept: 'Pre-Anesthesia Clinic',
        doctor: 'Dr. Nadia Victor',
        followCondition: 'Pre-Surgical Anesthetic Risk Review',
        notes: 'Second pre-op assessment at Hospital B. Patient history reviewed for anesthetic risk factors.',
        treatments: ['Anesthetic risk grading', 'Cardiac clearance', 'NPO instructions']
    },
    'Chronic Pain': {
        dept: 'Pain Management',
        doctor: 'Dr. Nadia Victor',
        followCondition: 'Chronic Pain Syndrome — Multi-modal Treatment',
        notes: 'Patient seeking pain management plan. Multi-disciplinary approach planned including physiotherapy and medication.',
        treatments: ['Gabapentin started', 'Physiotherapy referral', 'TENS therapy']
    },
    'Surgical Prep': {
        dept: 'Pre-Anesthesia Clinic',
        doctor: 'Dr. Nadia Victor',
        followCondition: 'Surgical Preparation Verification',
        notes: 'Surgical preparation confirmed at Hospital B. Consent forms reviewed and allergies verified.',
        treatments: ['Allergy documentation', 'Blood group verification', 'Prophylactic antibiotic plan']
    }
};

function getFollowUp(condition) {
    return conditionFollowUp[condition] || {
        dept: 'General Medicine',
        doctor: 'Dr. Marcus Andrews',
        followCondition: `${condition} — Follow-up`,
        notes: `Patient previously diagnosed with ${condition} at another hospital. Seeking second evaluation at Hospital B.`,
        treatments: ['Physical examination', 'Relevant diagnostic tests', 'Treatment review']
    };
}

// ── Main ─────────────────────────────────────────────────────────────────────

let PatientA, PatientB;

async function seed() {
    // Connect to Hospital A to read existing patients
    const connA = await mongoose.createConnection(
        'mongodb://127.0.0.1:27017/hospitalA'
    ).asPromise();
    PatientA = connA.model('Patient', patientSchemaA);

    // Connect to Hospital B to write
    const connB = await mongoose.createConnection(
        process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospitalB'
    ).asPromise();
    PatientB = connB.model('Patient', patientSchemaB);

    try {
        console.log('Fetching patients from Hospital A...');
        const hospitalAPatients = await PatientA.find({}).lean();

        if (hospitalAPatients.length === 0) {
            console.error('No patients found in Hospital A. Run Hospital A seed first.');
            process.exit(1);
        }

        console.log(`Found ${hospitalAPatients.length} patients in Hospital A.`);

        // Clear any previously seeded shared patients in Hospital B
        const deleteResult = await PatientB.deleteMany({ id: /B_Shared/ });
        console.log(`Cleared ${deleteResult.deletedCount} previously shared patients from Hospital B.`);

        let count = 0;
        for (const p of hospitalAPatients) {
            const followUp = getFollowUp(p.condition || '');

            // Compute a visit date ~1-3 months after the Hospital A visit date
            let visitDate = '2025-08-15';
            if (p.visits && p.visits.length > 0) {
                const lastVisit = new Date(p.visits[p.visits.length - 1].date);
                if (!isNaN(lastVisit)) {
                    // Add 1–3 months
                    const offset = Math.floor(Math.random() * 3) + 1;
                    lastVisit.setMonth(lastVisit.getMonth() + offset);
                    visitDate = lastVisit.toISOString().slice(0, 10);
                }
            }

            const newPatient = new PatientB({
                // Keep identity the same — this is what links them across hospitals
                name: p.name,
                age: p.age,
                birth_date: p.birth_date,
                gender: p.gender,
                national_id: p.national_id,   // ← same national_id as Hospital A

                // Hospital B specific data
                hospital: 'Hospital B',
                shared: false,
                condition: followUp.followCondition,
                visits: [{
                    date: visitDate,
                    doctor: `${followUp.doctor} (${followUp.dept})`,
                    notes: followUp.notes,
                    treatments: followUp.treatments
                }]
            });

            await newPatient.save();
            count++;
            console.log(`  [${count}/${hospitalAPatients.length}] Seeded: ${p.name} | ${p.condition} → ${followUp.followCondition}`);
        }

        console.log(`\n✅ Done! Seeded ${count} shared patients into Hospital B with different visit data.`);
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        await connA.close();
        await connB.close();
    }
}

seed();
