import mongoose from "mongoose";
import dbConnect from "../lib/mongodb";
import { Clinic, User, Template } from "../models";

/**
 * Database Seeding Utilities
 * Provides functions to initialize database with default data
 * Use this for development and initial production setup
 */

/**
 * Create a default clinic for initial setup
 */
export async function seedDefaultClinic() {
  await dbConnect();

  const existingClinic = await Clinic.findOne({ code: "MAIN" });

  if (existingClinic) {
    console.log("✅ Default clinic already exists");
    return existingClinic;
  }

  const defaultClinic = await Clinic.create({
    clinicId: "CLINIC-001",
    name: "Main Clinic",
    code: "MAIN",
    contactInfo: {
      email: "info@mainclinic.com",
      phone: "+1-555-0100",
      website: "https://mainclinic.com",
    },
    address: {
      street: "123 Healthcare Ave",
      city: "Medical City",
      state: "MC",
      country: "Country",
      postalCode: "12345",
      timezone: "UTC",
    },
    operationalSettings: {
      operatingHours: {
        monday: { isOpen: true, open: "09:00", close: "17:00" },
        tuesday: { isOpen: true, open: "09:00", close: "17:00" },
        wednesday: { isOpen: true, open: "09:00", close: "17:00" },
        thursday: { isOpen: true, open: "09:00", close: "17:00" },
        friday: { isOpen: true, open: "09:00", close: "17:00" },
        saturday: { isOpen: false, open: undefined, close: undefined },
        sunday: { isOpen: false, open: undefined, close: undefined },
      },
      appointmentSlotDuration: 30,
      autoLogoutDuration: 15,
      defaultLanguage: "en",
    },
    financialSettings: {
      primaryCurrency: "USD",
      acceptedCurrencies: ["USD", "EUR"],
      exchangeRates: new Map([
        ["USD", 1.0],
        ["EUR", 0.85],
      ]),
      invoicePrefix: "MAIN-INV-",
    },
    templates: {
      consultationNotes: [],
      prescriptionForms: [],
      labOrderForms: [],
      radiologyOrderForms: [],
      consentForms: [],
    },
    pricingConfig: {
      usesCustomPricelists: false,
      customPricelists: [],
    },
    acceptedInsuranceProviders: [],
    isActive: true,
  });

  console.log("✅ Default clinic created:", defaultClinic.code);
  return defaultClinic;
}

/**
 * Create a default admin user
 */
export async function seedDefaultAdmin(clinicId: mongoose.Types.ObjectId) {
  await dbConnect();

  const existingAdmin = await User.findOne({ email: "admin@clinic.com" });

  if (existingAdmin) {
    console.log("✅ Default admin already exists");
    return existingAdmin;
  }

  // Note: In production, hash the password using bcrypt
  const defaultAdmin = await User.create({
    email: "admin@clinic.com",
    password: "admin123", // Change this in production!
    role: "Admin",
    firstName: "System",
    lastName: "Administrator",
    assignedClinics: [clinicId],
    primaryClinic: clinicId,
    isActive: true,
    preferences: {
      language: "en",
      theme: "light",
      defaultClinic: clinicId,
    },
  });

  console.log("✅ Default admin created:", defaultAdmin.email);
  console.log("⚠️  WARNING: Change default admin password immediately!");
  return defaultAdmin;
}

/**
 * Create default SOAP consultation note template
 */
export async function seedDefaultConsultationTemplate(
  clinicId: mongoose.Types.ObjectId,
  createdBy: mongoose.Types.ObjectId
) {
  await dbConnect();

  const existingTemplate = await Template.findOne({
    assignedClinics: clinicId,
    type: "ConsultationNote",
    isDefault: true,
  });

  if (existingTemplate) {
    console.log("✅ Default consultation template already exists");
    return existingTemplate;
  }

  const soapTemplate = await Template.create({
    templateId: "TMPL-SOAP-001",
    name: "SOAP Consultation Note",
    type: "ConsultationNote",
    assignedClinics: [clinicId],
    sections: [
      {
        sectionId: "subjective",
        title: "Subjective (Chief Complaint)",
        order: 1,
        isRequired: true,
        type: "Text",
        fields: [
          {
            fieldId: "chief_complaint",
            label: "Chief Complaint",
            type: "Textarea",
            placeholder: "Patient's main concern...",
            isRequired: true,
          },
          {
            fieldId: "history_present_illness",
            label: "History of Present Illness",
            type: "Textarea",
            placeholder: "Onset, location, duration, characteristics...",
            isRequired: true,
          },
        ],
      },
      {
        sectionId: "objective",
        title: "Objective (Examination)",
        order: 2,
        isRequired: true,
        type: "Text",
        fields: [
          {
            fieldId: "vitals",
            label: "Vital Signs",
            type: "Text",
            placeholder: "BP, HR, Temp, RR, SpO2",
            isRequired: true,
          },
          {
            fieldId: "physical_exam",
            label: "Physical Examination",
            type: "Textarea",
            placeholder: "General appearance, systems examination...",
            isRequired: true,
          },
        ],
      },
      {
        sectionId: "assessment",
        title: "Assessment (Diagnosis)",
        order: 3,
        isRequired: true,
        type: "Text",
        fields: [
          {
            fieldId: "diagnosis",
            label: "Diagnosis",
            type: "Textarea",
            placeholder: "Primary and differential diagnoses (ICD-10 codes)",
            isRequired: true,
          },
        ],
      },
      {
        sectionId: "plan",
        title: "Plan (Treatment)",
        order: 4,
        isRequired: true,
        type: "Text",
        fields: [
          {
            fieldId: "treatment_plan",
            label: "Treatment Plan",
            type: "Textarea",
            placeholder: "Medications, procedures, follow-up...",
            isRequired: true,
          },
          {
            fieldId: "follow_up",
            label: "Follow-up",
            type: "Text",
            placeholder: "Return in X days/weeks",
            isRequired: false,
          },
        ],
      },
    ],
    soapFormat: {
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
    },
    version: "1.0.0",
    isActive: true,
    isDefault: true,
    allowedRoles: ["Admin", "Director", "Doctor"],
    createdBy: createdBy,
  });

  console.log("✅ Default SOAP template created");
  return soapTemplate;
}

/**
 * Run all seed functions
 */
export async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    const clinic = await seedDefaultClinic();
    const admin = await seedDefaultAdmin(clinic._id);
    await seedDefaultConsultationTemplate(clinic._id, admin._id);

    console.log("✅ Database seeding completed successfully!");
    return { clinic, admin };
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
}

/**
 * Clear all collections (use with caution!)
 */
export async function clearDatabase() {
  await dbConnect();

  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  console.log("🗑️  Database cleared");
}
