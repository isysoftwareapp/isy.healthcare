import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Clinic from "@/models/Clinic";
import { hash } from "@/lib/hash";

function randomFrom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const firstNames = [
  "Aditya",
  "Rina",
  "Budi",
  "Siti",
  "Agus",
  "Nur",
  "Yasmine",
  "Dewi",
  "Andi",
  "Lina",
  "Hendra",
  "Mega",
  "Rizal",
  "Putri",
  "Wawan",
];

const lastNames = [
  "Santoso",
  "Susanto",
  "Wijaya",
  "Halim",
  "Pratama",
  "Setiawan",
  "Kusuma",
  "Putra",
  "Rahma",
  "Sari",
];

const specializations = [
  "General Medicine",
  "Cardiology",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Orthopedics",
  "Dermatology",
  "ENT",
  "Urology",
  "Neurology",
  "Radiology",
];

const roles = ["Doctor", "Nurse", "Laboratory", "Radiology", "Pharmacy"];

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!session?.user || !["Admin", "Director"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const body = await req.json();
    const count = parseInt(String(body.count || 10), 10);
    const requestedClinicId = body.clinicId || null;
    if (!count || count <= 0 || count > 500) {
      return NextResponse.json({ error: "Invalid count" }, { status: 400 });
    }

    const clinics = await Clinic.find().lean();
    if (!clinics || clinics.length === 0) {
      return NextResponse.json(
        { error: "No clinics found to assign" },
        { status: 400 }
      );
    }

    const created: any[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = randomFrom(firstNames);
      const lastName = randomFrom(lastNames);
      const role = randomFrom(roles);
      const specialization = randomFrom(specializations);

      let assignedClinics: any[] = [];
      let primaryClinic: any = null;

      if (requestedClinicId) {
        // if caller requested a specific clinic, validate it
        const found = clinics.find(
          (c: any) => String(c._id) === String(requestedClinicId)
        );
        if (!found) {
          return NextResponse.json(
            { error: "Requested clinic not found" },
            { status: 400 }
          );
        }
        assignedClinics = [found._id];
        primaryClinic = found._id;
      } else {
        // pick 1-3 clinics randomly
        const assignedCount = Math.max(
          1,
          Math.min(3, randomInt(1, Math.min(3, clinics.length)))
        );
        const shuffled = clinics.sort(() => 0.5 - Math.random());
        assignedClinics = shuffled
          .slice(0, assignedCount)
          .map((c: any) => c._id);
        primaryClinic = assignedClinics[0];
      }

      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()
        .toString()
        .slice(-5)}@example.local`;
      const plainPassword = `Passw0rd!${randomInt(10, 99)}`;
      const hashed = await hash(plainPassword, 10);

      const professionalDetails = {
        licenseNumber: `LIC-${randomInt(10000, 99999)}`,
        specialization,
        department: role === "Doctor" ? "Clinical" : role,
        yearsOfExperience: randomInt(1, 20),
        education: "Universitas Kesehatan",
        certifications: ["Basic Life Support"],
      };

      const availability = {
        workingDays: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ].slice(0, randomInt(3, 5)),
        workingHours: { start: "08:00", end: "16:00" },
      };

      const userDoc = new User({
        email,
        password: hashed,
        role: role === "Laboratory" ? "Laboratory" : role,
        firstName,
        lastName,
        assignedClinics,
        primaryClinic,
        professionalDetails,
        isActive: true,
        preferences: {
          language: "en",
          theme: "light",
          defaultClinic: primaryClinic,
        },
        contactInfo: { phone: `+62${randomInt(800000000, 899999999)}` },
        availability,
      } as any);

      await userDoc.save();
      created.push({ _id: userDoc._id, email, password: plainPassword, role });
    }

    return NextResponse.json(
      {
        success: true,
        created,
        message: `${created.length} practitioners created`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error generating practitioners:", err);
    return NextResponse.json(
      { error: "Failed to generate practitioners" },
      { status: 500 }
    );
  }
}
