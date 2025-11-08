import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Patient from "@/models/Patient";
import { withPermission } from "@/lib/apiHelpers";
import { buildClinicFilter } from "@/lib/rbac";
import { Resource, Action } from "@/lib/permissions";
import { UserRole } from "@/lib/dbTypes";

/**
 * GET /api/patients
 * List patients with filtering and pagination
 * Requires: patients:read permission
 */
export const GET = withPermission(
  Resource.Patient,
  Action.Read,
  async (req, user) => {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const clinicId = searchParams.get("clinicId");

    // Build clinic filter based on user's access
    const clinicFilter = buildClinicFilter(user);

    // Build query
    const query: any = { ...clinicFilter };

    // Add clinic filter if specified
    if (clinicId) {
      query.$or = [{ primaryClinic: clinicId }, { visitedClinics: clinicId }];
    }

    // Add search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
        { patientId: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Patient.countDocuments(query);

    // Get patients
    const patients = await Patient.find(query)
      .select("-passportScan") // Exclude encrypted passport data
      .populate("primaryClinic", "name")
      .populate("insurance.providerId", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

/**
 * POST /api/patients
 * Create a new patient
 * Requires: patients:create permission
 */
export const POST = withPermission(
  Resource.Patient,
  Action.Create,
  async (req, user) => {
    await dbConnect();

    try {
      const body = await req.json();

      // Validate required fields
      if (!body.firstName || !body.lastName || !body.dateOfBirth) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields: firstName, lastName, dateOfBirth",
          },
          { status: 400 }
        );
      }

      // Set primary clinic from session if not provided
      if (!body.primaryClinic) {
        body.primaryClinic = user.primaryClinic;
      }

      // Verify user has access to the specified clinic
      const userHasAccess =
        body.primaryClinic.toString() === user.primaryClinic?.toString() ||
        user.assignedClinics?.includes(body.primaryClinic.toString());

      if (!userHasAccess && user.role !== UserRole.Admin) {
        return NextResponse.json(
          {
            success: false,
            error: "You don't have access to create patients for this clinic",
          },
          { status: 403 }
        );
      }

      // Generate patient ID
      const clinicCode = body.primaryClinic.toString().slice(-4).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      body.patientId = `PAT-${clinicCode}-${timestamp}-${random}`;

      // Initialize visitedClinics with primary clinic
      body.visitedClinics = [body.primaryClinic];

      // Create patient
      const patient = await Patient.create(body);

      // Populate references
      await patient.populate("primaryClinic", "name");
      if (body.insurance?.providerId) {
        await patient.populate("insurance.providerId", "name");
      }

      // Remove sensitive data from response
      const patientObj = patient.toObject();
      delete patientObj.passportScan;

      return NextResponse.json(
        {
          success: true,
          message: "Patient registered successfully",
          data: patientObj,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error("Patient creation error:", error);

      if (error.name === "ValidationError") {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            details: Object.values(error.errors).map((e: any) => e.message),
          },
          { status: 400 }
        );
      }

      if (error.code === 11000) {
        return NextResponse.json(
          {
            success: false,
            error: "A patient with this email or contact number already exists",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to register patient",
        },
        { status: 500 }
      );
    }
  }
);
