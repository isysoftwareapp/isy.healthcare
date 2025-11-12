import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";

// GET - Fetch all services for the user's clinic
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // DUMMY DATA - Realistic Indonesian Healthcare Services
    const dummyServices = [
      // Consultation Services
      {
        serviceId: "SVC001",
        serviceName: "Konsultasi Dokter Umum",
        category: "Consultation",
        description: "General practitioner consultation",
        pricing: {
          local: 150000,
          localWithInsurance: 200000,
          tourist: 300000,
          touristWithInsurance: 350000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC002",
        serviceName: "Konsultasi Dokter Spesialis Anak",
        category: "Consultation",
        description: "Pediatric specialist consultation",
        pricing: {
          local: 250000,
          localWithInsurance: 350000,
          tourist: 500000,
          touristWithInsurance: 600000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC003",
        serviceName: "Konsultasi Dokter Spesialis Kandungan",
        category: "Consultation",
        description: "Obstetrician consultation",
        pricing: {
          local: 300000,
          localWithInsurance: 400000,
          tourist: 600000,
          touristWithInsurance: 700000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC004",
        serviceName: "Konsultasi Dokter Gigi",
        category: "Consultation",
        description: "Dental consultation",
        pricing: {
          local: 200000,
          localWithInsurance: 280000,
          tourist: 400000,
          touristWithInsurance: 480000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC005",
        serviceName: "Konsultasi Dokter Jantung",
        category: "Consultation",
        description: "Cardiology consultation",
        pricing: {
          local: 400000,
          localWithInsurance: 550000,
          tourist: 800000,
          touristWithInsurance: 950000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },

      // Laboratory Services
      {
        serviceId: "SVC006",
        serviceName: "Pemeriksaan Darah Lengkap",
        category: "Laboratory",
        description: "Complete blood count",
        pricing: {
          local: 100000,
          localWithInsurance: 140000,
          tourist: 200000,
          touristWithInsurance: 240000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC007",
        serviceName: "Tes Gula Darah",
        category: "Laboratory",
        description: "Blood glucose test",
        pricing: {
          local: 50000,
          localWithInsurance: 70000,
          tourist: 100000,
          touristWithInsurance: 120000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC008",
        serviceName: "Tes Kolesterol",
        category: "Laboratory",
        description: "Cholesterol test",
        pricing: {
          local: 80000,
          localWithInsurance: 110000,
          tourist: 160000,
          touristWithInsurance: 190000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC009",
        serviceName: "Tes Fungsi Hati",
        category: "Laboratory",
        description: "Liver function test",
        pricing: {
          local: 200000,
          localWithInsurance: 280000,
          tourist: 400000,
          touristWithInsurance: 480000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC010",
        serviceName: "Tes Urine Lengkap",
        category: "Laboratory",
        description: "Complete urine analysis",
        pricing: {
          local: 75000,
          localWithInsurance: 105000,
          tourist: 150000,
          touristWithInsurance: 180000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },

      // Radiology Services
      {
        serviceId: "SVC011",
        serviceName: "Rontgen Thorax",
        category: "Radiology",
        description: "Chest X-ray",
        pricing: {
          local: 200000,
          localWithInsurance: 280000,
          tourist: 400000,
          touristWithInsurance: 480000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC012",
        serviceName: "USG Abdomen",
        category: "Radiology",
        description: "Abdominal ultrasound",
        pricing: {
          local: 350000,
          localWithInsurance: 490000,
          tourist: 700000,
          touristWithInsurance: 840000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC013",
        serviceName: "USG Kehamilan",
        category: "Radiology",
        description: "Pregnancy ultrasound",
        pricing: {
          local: 300000,
          localWithInsurance: 420000,
          tourist: 600000,
          touristWithInsurance: 720000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC014",
        serviceName: "CT Scan Kepala",
        category: "Radiology",
        description: "Head CT scan",
        pricing: {
          local: 1500000,
          localWithInsurance: 2100000,
          tourist: 3000000,
          touristWithInsurance: 3600000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC015",
        serviceName: "MRI",
        category: "Radiology",
        description: "Magnetic resonance imaging",
        pricing: {
          local: 3000000,
          localWithInsurance: 4200000,
          tourist: 6000000,
          touristWithInsurance: 7200000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },

      // Procedure Services
      {
        serviceId: "SVC016",
        serviceName: "Jahit Luka Sederhana",
        category: "Procedure",
        description: "Simple wound suturing",
        pricing: {
          local: 300000,
          localWithInsurance: 420000,
          tourist: 600000,
          touristWithInsurance: 720000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC017",
        serviceName: "Cabut Gigi",
        category: "Procedure",
        description: "Tooth extraction",
        pricing: {
          local: 250000,
          localWithInsurance: 350000,
          tourist: 500000,
          touristWithInsurance: 600000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC018",
        serviceName: "Tambal Gigi",
        category: "Procedure",
        description: "Tooth filling",
        pricing: {
          local: 200000,
          localWithInsurance: 280000,
          tourist: 400000,
          touristWithInsurance: 480000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC019",
        serviceName: "Sirkumsisi",
        category: "Procedure",
        description: "Circumcision",
        pricing: {
          local: 1500000,
          localWithInsurance: 2100000,
          tourist: 3000000,
          touristWithInsurance: 3600000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC020",
        serviceName: "Endoskopi",
        category: "Procedure",
        description: "Endoscopy",
        pricing: {
          local: 2500000,
          localWithInsurance: 3500000,
          tourist: 5000000,
          touristWithInsurance: 6000000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },

      // Pharmacy Services
      {
        serviceId: "SVC021",
        serviceName: "Obat Resep Standar",
        category: "Pharmacy",
        description: "Standard prescription medication",
        pricing: {
          local: 50000,
          localWithInsurance: 70000,
          tourist: 100000,
          touristWithInsurance: 120000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC022",
        serviceName: "Vitamin & Suplemen",
        category: "Pharmacy",
        description: "Vitamins and supplements",
        pricing: {
          local: 100000,
          localWithInsurance: 140000,
          tourist: 200000,
          touristWithInsurance: 240000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      {
        serviceId: "SVC023",
        serviceName: "Antibiotik",
        category: "Pharmacy",
        description: "Antibiotics",
        pricing: {
          local: 150000,
          localWithInsurance: 210000,
          tourist: 300000,
          touristWithInsurance: 360000,
        },
        isActive: true,
        assignedClinic: {
          _id: "1",
          clinicId: "CLN001",
          clinicName: "Main Clinic",
        },
      },
      // Branch Clinic Services
      {
        serviceId: "SVC024",
        serviceName: "Konsultasi Dokter Umum",
        category: "Consultation",
        description: "General practitioner consultation - Branch",
        pricing: {
          local: 120000,
          localWithInsurance: 170000,
          tourist: 250000,
          touristWithInsurance: 300000,
        },
        isActive: true,
        assignedClinic: {
          _id: "2",
          clinicId: "CLN002",
          clinicName: "Branch Clinic",
        },
      },
      {
        serviceId: "SVC025",
        serviceName: "Pemeriksaan Fisik Lengkap",
        category: "Checkup",
        description: "Complete physical examination - Branch",
        pricing: {
          local: 250000,
          localWithInsurance: 350000,
          tourist: 500000,
          touristWithInsurance: 600000,
        },
        isActive: true,
        assignedClinic: {
          _id: "2",
          clinicId: "CLN002",
          clinicName: "Branch Clinic",
        },
      },
      {
        serviceId: "SVC026",
        serviceName: "Tes Darah Lengkap",
        category: "Laboratory",
        description: "Complete blood count - Branch",
        pricing: {
          local: 100000,
          localWithInsurance: 140000,
          tourist: 200000,
          touristWithInsurance: 240000,
        },
        isActive: true,
        assignedClinic: {
          _id: "2",
          clinicId: "CLN002",
          clinicName: "Branch Clinic",
        },
      },
      {
        serviceId: "SVC027",
        serviceName: "X-Ray Dada",
        category: "Radiology",
        description: "Chest X-ray - Branch",
        pricing: {
          local: 200000,
          localWithInsurance: 280000,
          tourist: 400000,
          touristWithInsurance: 480000,
        },
        isActive: true,
        assignedClinic: {
          _id: "2",
          clinicId: "CLN002",
          clinicName: "Branch Clinic",
        },
      },
      {
        serviceId: "SVC028",
        serviceName: "Pembersihan Gigi",
        category: "Dental",
        description: "Teeth cleaning - Branch",
        pricing: {
          local: 300000,
          localWithInsurance: 420000,
          tourist: 600000,
          touristWithInsurance: 720000,
        },
        isActive: true,
        assignedClinic: {
          _id: "2",
          clinicId: "CLN002",
          clinicName: "Branch Clinic",
        },
      },
    ];

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const clinicId = searchParams.get("clinicId");

    // Authorization: Users can only see their assigned clinic's pricelists
    // Admin and Director can see all clinics
    const userRole = session.user.role;
    const userPrimaryClinic = session.user.primaryClinic;

    if (
      clinicId &&
      userRole !== "Admin" &&
      userRole !== "Director" &&
      clinicId !== userPrimaryClinic
    ) {
      return NextResponse.json(
        { error: "You can only view your assigned clinic's pricelists" },
        { status: 403 }
      );
    }

    // Connect to database
    await dbConnect();

    // Build query filters
    const query: any = {};

    // Filter by clinic if specified
    if (clinicId) {
      query.assignedClinic = clinicId;
    } else if (userRole !== "Admin" && userRole !== "Director") {
      // Non-admin users can only see their clinic's services
      query.assignedClinic = userPrimaryClinic;
    }

    // Filter by category
    if (category && category !== "All") {
      query.category = category;
    }

    // Filter by search term
    if (search) {
      query.$or = [
        { serviceName: { $regex: search, $options: "i" } },
        { serviceId: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch services from database with populated clinic data
    const services = await Service.find(query)
      .populate("assignedClinic", "clinicId name")
      .sort({ category: 1, serviceName: 1 })
      .lean();

    return NextResponse.json({ services }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST - Create new service
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin, Director, Finance can create services
    if (!["Admin", "Director", "Finance"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const body = await req.json();
    const { serviceName, category, description, pricing, assignedClinic } =
      body;

    // Validate required fields
    if (!serviceName || !category || !pricing || !assignedClinic) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate serviceId (e.g., SVC001, SVC002)
    const lastService = await Service.findOne().sort({ serviceId: -1 });
    let serviceNumber = 1;
    if (lastService) {
      const lastNumber = parseInt(lastService.serviceId.replace("SVC", ""));
      serviceNumber = lastNumber + 1;
    }
    const serviceId = `SVC${serviceNumber.toString().padStart(3, "0")}`;

    const newService = new Service({
      serviceId,
      serviceName,
      category,
      description,
      pricing,
      assignedClinic,
    });

    await newService.save();

    return NextResponse.json(
      { service: newService, message: "Service created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}

// PUT - Update service
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin, Director, Finance can update services
    if (!["Admin", "Director", "Finance"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const body = await req.json();
    const {
      _id,
      serviceName,
      category,
      description,
      pricing,
      isActive,
      insuranceProvider,
    } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Service ID required" },
        { status: 400 }
      );
    }

    const updatedService = await Service.findByIdAndUpdate(
      _id,
      {
        serviceName,
        category,
        description,
        pricing,
        isActive,
        insuranceProvider,
      },
      { new: true }
    );

    if (!updatedService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(
      { service: updatedService, message: "Service updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete service (set isActive to false)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admin, Director can delete services
    if (!["Admin", "Director"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Service ID required" },
        { status: 400 }
      );
    }

    const service = await Service.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Service deactivated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
