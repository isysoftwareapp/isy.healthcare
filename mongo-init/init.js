// MongoDB initialization script for ISY Healthcare Clinic Management System
db = db.getSiblingDB("isy_clinic");

// Create collections with validators
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "role", "firstName", "lastName", "createdAt"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        },
        role: {
          enum: [
            "Admin",
            "Director",
            "Operational",
            "Doctor",
            "Nurse",
            "Reception",
            "Finance",
            "Laboratory",
            "Radiology",
            "Pharmacy",
          ],
        },
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" },
        assignedClinics: { bsonType: "array" },
        isActive: { bsonType: "bool" },
      },
    },
  },
});

db.createCollection("patients");
db.createCollection("appointments");
db.createCollection("ehr"); // Electronic Health Records
db.createCollection("prescriptions");
db.createCollection("invoices");
db.createCollection("clinics");
db.createCollection("pricelists");
db.createCollection("inventory");
db.createCollection("audit_logs");

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.patients.createIndex({ patientId: 1 }, { unique: true });
db.patients.createIndex({ firstName: 1, lastName: 1 });
db.patients.createIndex({ phoneNumber: 1 });
db.patients.createIndex({ email: 1 });

db.appointments.createIndex({ appointmentDate: 1 });
db.appointments.createIndex({ patientId: 1 });
db.appointments.createIndex({ doctorId: 1 });
db.appointments.createIndex({ clinicId: 1 });

db.ehr.createIndex({ patientId: 1 });
db.ehr.createIndex({ doctorId: 1 });
db.ehr.createIndex({ createdAt: -1 });

db.invoices.createIndex({ invoiceNumber: 1 }, { unique: true });
db.invoices.createIndex({ patientId: 1 });
db.invoices.createIndex({ createdAt: -1 });

db.audit_logs.createIndex({ timestamp: -1 });
db.audit_logs.createIndex({ userId: 1 });
db.audit_logs.createIndex({ action: 1 });

// Insert default admin user
db.users.insertOne({
  email: "admin@isy.software",
  password: "$2b$10$T02254hxU1lH2RMBC2/fEekFNHb1uvFKC.wE4iYsBPitBD0PTCMVW", // Password: Admin123!
  role: "Admin",
  firstName: "System",
  lastName: "Administrator",
  assignedClinics: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Insert default clinic
db.clinics.insertOne({
  clinicId: "CLINIC001",
  name: "ISY Healthcare Main Clinic",
  address: "123 Healthcare Street",
  city: "Medical City",
  country: "Indonesia",
  phone: "+62-xxx-xxxx-xxxx",
  email: "clinic@isy.software",
  operatingHours: {
    monday: "08:00-17:00",
    tuesday: "08:00-17:00",
    wednesday: "08:00-17:00",
    thursday: "08:00-17:00",
    friday: "08:00-17:00",
    saturday: "08:00-13:00",
    sunday: "Closed",
  },
  isActive: true,
  createdAt: new Date(),
});

// Insert default pricelists
const pricelists = [
  {
    name: "Locals",
    description: "Standard pricing for local patients",
    currency: "IDR",
    isActive: true,
    createdAt: new Date(),
  },
  {
    name: "Locals w/ Insurance",
    description: "Insurance-contracted pricing for local patients",
    currency: "IDR",
    isActive: true,
    createdAt: new Date(),
  },
  {
    name: "Tourist",
    description: "Standard pricing for international tourists",
    currency: "EUR",
    isActive: true,
    createdAt: new Date(),
  },
  {
    name: "Tourist w/ Insurance",
    description: "Insurance-contracted pricing for international tourists",
    currency: "EUR",
    isActive: true,
    createdAt: new Date(),
  },
];

db.pricelists.insertMany(pricelists);

// Get the clinic ObjectId to reference in services
const clinicId = db.clinics.findOne({ clinicId: "CLINIC001" })._id;

// Insert dummy medical services with pricing for all 4 categories
db.createCollection("services");
db.services.createIndex({ serviceId: 1 }, { unique: true });
db.services.createIndex({ serviceName: "text", serviceId: "text" });
db.services.createIndex({ assignedClinic: 1, isActive: 1 });

const services = [
  // Consultation Services
  {
    serviceId: "SVC001",
    serviceName: "General Consultation",
    category: "Consultation",
    description: "Standard medical consultation with general practitioner",
    pricing: {
      local: 150000,
      localWithInsurance: 100000,
      tourist: 300000,
      touristWithInsurance: 250000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC002",
    serviceName: "Specialist Consultation",
    category: "Consultation",
    description: "Consultation with medical specialist",
    pricing: {
      local: 300000,
      localWithInsurance: 200000,
      tourist: 600000,
      touristWithInsurance: 500000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC003",
    serviceName: "Follow-up Consultation",
    category: "Consultation",
    description: "Follow-up visit after initial consultation",
    pricing: {
      local: 100000,
      localWithInsurance: 75000,
      tourist: 200000,
      touristWithInsurance: 150000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Procedure Services
  {
    serviceId: "SVC004",
    serviceName: "Minor Surgery",
    category: "Procedure",
    description:
      "Minor surgical procedures (wound suturing, cyst removal, etc.)",
    pricing: {
      local: 500000,
      localWithInsurance: 350000,
      tourist: 1000000,
      touristWithInsurance: 800000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC005",
    serviceName: "Wound Dressing",
    category: "Procedure",
    description: "Professional wound cleaning and dressing",
    pricing: {
      local: 75000,
      localWithInsurance: 50000,
      tourist: 150000,
      touristWithInsurance: 100000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC006",
    serviceName: "Injection/IV Therapy",
    category: "Procedure",
    description: "Intramuscular, subcutaneous, or intravenous injection",
    pricing: {
      local: 50000,
      localWithInsurance: 35000,
      tourist: 100000,
      touristWithInsurance: 75000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Laboratory Services
  {
    serviceId: "SVC007",
    serviceName: "Complete Blood Count (CBC)",
    category: "Laboratory",
    description: "Full blood examination including WBC, RBC, platelets",
    pricing: {
      local: 100000,
      localWithInsurance: 75000,
      tourist: 200000,
      touristWithInsurance: 150000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC008",
    serviceName: "Blood Glucose Test",
    category: "Laboratory",
    description: "Fasting and random blood sugar level test",
    pricing: {
      local: 50000,
      localWithInsurance: 35000,
      tourist: 100000,
      touristWithInsurance: 75000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC009",
    serviceName: "Lipid Profile",
    category: "Laboratory",
    description: "Cholesterol, triglycerides, HDL, LDL testing",
    pricing: {
      local: 150000,
      localWithInsurance: 100000,
      tourist: 300000,
      touristWithInsurance: 250000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC010",
    serviceName: "Urine Analysis",
    category: "Laboratory",
    description: "Complete urinalysis",
    pricing: {
      local: 75000,
      localWithInsurance: 50000,
      tourist: 150000,
      touristWithInsurance: 100000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Radiology Services
  {
    serviceId: "SVC011",
    serviceName: "Chest X-Ray",
    category: "Radiology",
    description: "Chest radiography (AP/PA view)",
    pricing: {
      local: 200000,
      localWithInsurance: 150000,
      tourist: 400000,
      touristWithInsurance: 300000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC012",
    serviceName: "Abdominal Ultrasound",
    category: "Radiology",
    description: "Abdominal ultrasonography",
    pricing: {
      local: 350000,
      localWithInsurance: 250000,
      tourist: 700000,
      touristWithInsurance: 500000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC013",
    serviceName: "CT Scan (Single Region)",
    category: "Radiology",
    description: "Computed tomography scan of single body region",
    pricing: {
      local: 1500000,
      localWithInsurance: 1000000,
      tourist: 3000000,
      touristWithInsurance: 2500000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Pharmacy Services
  {
    serviceId: "SVC014",
    serviceName: "Medication Dispensing",
    category: "Pharmacy",
    description: "Prescription medication dispensing service",
    pricing: {
      local: 0,
      localWithInsurance: 0,
      tourist: 0,
      touristWithInsurance: 0,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC015",
    serviceName: "Pharmaceutical Consultation",
    category: "Pharmacy",
    description: "Pharmacist consultation on medication usage",
    pricing: {
      local: 50000,
      localWithInsurance: 0,
      tourist: 100000,
      touristWithInsurance: 50000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Other Services
  {
    serviceId: "SVC016",
    serviceName: "Medical Certificate",
    category: "Other",
    description: "Issuance of medical fitness certificate",
    pricing: {
      local: 75000,
      localWithInsurance: 50000,
      tourist: 150000,
      touristWithInsurance: 100000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC017",
    serviceName: "Medical Report",
    category: "Other",
    description: "Detailed medical report preparation",
    pricing: {
      local: 100000,
      localWithInsurance: 75000,
      tourist: 200000,
      touristWithInsurance: 150000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceId: "SVC018",
    serviceName: "Health Screening Package",
    category: "Other",
    description: "Comprehensive health check-up package",
    pricing: {
      local: 800000,
      localWithInsurance: 600000,
      tourist: 1600000,
      touristWithInsurance: 1200000,
    },
    isActive: true,
    assignedClinic: clinicId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

db.services.insertMany(services);

print(
  "ISY Healthcare Clinic Management System database initialized successfully with " +
    services.length +
    " services"
);

// Initialize retail database
db = db.getSiblingDB("retail");

// Create collections for retail app
db.createCollection("contents");
db.createCollection("admins");

// Create default admin user for retail
db.admins.insertOne({
  username: "admin",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // bcrypt hash for "admin123"
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Create default site content
db.contents.insertOne({
  type: "site",
  content: {
    hero: {
      badge: "Transform Your Business",
      titleLine1: "Modern POS &",
      titleLine2: "Kiosk Solutions",
      subtitle: "Streamline operations, boost sales, and deliver exceptional customer experiences with our cutting-edge retail technology.",
      ctaPrimary: "Get Started",
      ctaSecondary: "Learn More",
      backgroundImage: "/api/placeholder/1920/1080",
    },
    features: [
      {
        icon: "Zap",
        title: "Lightning Fast",
        description: "Process transactions in seconds with our optimized hardware and software solutions.",
      },
      {
        icon: "Shield",
        title: "Secure & Reliable",
        description: "Bank-grade security with 99.9% uptime and comprehensive data protection.",
      },
      {
        icon: "Smartphone",
        title: "Mobile Ready",
        description: "Seamless integration with mobile payments, loyalty programs, and inventory management.",
      },
    ],
    ecosystem: [
      {
        icon: "Monitor",
        title: "POS Terminals",
        description: "High-performance point-of-sale systems for retail and hospitality.",
      },
      {
        icon: "Smartphone",
        title: "Mobile POS",
        description: "Take payments anywhere with our mobile POS solutions.",
      },
      {
        icon: "QrCode",
        title: "QR Payments",
        description: "Accept QR code payments from all major digital wallets.",
      },
      {
        icon: "Printer",
        title: "Receipt Printers",
        description: "Fast, reliable thermal printers for receipts and labels.",
      },
    ],
    pricing: [
      {
        name: "Starter",
        price: "IDR 2,500,000",
        period: "one-time",
        features: [
          "Basic POS Terminal",
          "1 Year Warranty",
          "Basic Support",
          "Software License",
        ],
        popular: false,
        cta: "Get Started",
      },
      {
        name: "Professional",
        price: "IDR 5,000,000",
        period: "one-time",
        features: [
          "Advanced POS Terminal",
          "2 Year Warranty",
          "Priority Support",
          "Software License",
          "Inventory Management",
          "Basic Reporting",
        ],
        popular: true,
        cta: "Get Started",
      },
      {
        name: "Enterprise",
        price: "IDR 10,000,000",
        period: "one-time",
        features: [
          "Premium POS Terminal",
          "3 Year Warranty",
          "24/7 Support",
          "Software License",
          "Advanced Inventory",
          "Advanced Reporting",
          "API Access",
          "Custom Integration",
        ],
        popular: false,
        cta: "Contact Sales",
      },
    ],
    contact: {
      title: "Ready to Transform Your Business?",
      subtitle: "Get in touch with our sales team to discuss your specific needs and find the perfect solution for your business.",
      email: "sales@isy.software",
      phone: "+62 812-3456-7890",
      address: "Jakarta, Indonesia",
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

print("Retail database initialized successfully");
