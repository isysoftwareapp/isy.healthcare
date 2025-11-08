/**
 * Patients API Route
 * Demonstrates RBAC implementation for patient management
 */

import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Patient } from "@/models";
import { Resource, Action } from "@/lib/permissions";
import {
  withPermissionAndClinic,
  withPermission,
  successResponse,
  errorResponse,
  notFoundError,
  databaseError,
  parseBody,
  getQueryParam,
  validateRequiredFields,
} from "@/lib/apiHelpers";
import { buildClinicFilter, getUserClinicIds } from "@/lib/rbac";

/**
 * GET /api/patients
 * List patients (filtered by clinic access)
 */
export const GET = withPermission(
  Resource.Patient,
  Action.Read,
  async (req, user) => {
    try {
      await dbConnect();

      const clinicId = getQueryParam(req, "clinicId");
      const search = getQueryParam(req, "search");
      const category = getQueryParam(req, "category");

      // Build query
      const query: any = { isActive: true };

      // Apply clinic filter based on user's access
      const clinicFilter = buildClinicFilter(user);
      Object.assign(query, clinicFilter);

      // If specific clinic requested, verify access
      if (clinicId) {
        query.primaryClinic = clinicId;
      }

      // Search filter
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { patientId: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ];
      }

      // Category filter
      if (category) {
        query.category = category;
      }

      const patients = await Patient.find(query)
        .select("-passportScan") // Exclude sensitive data by default
        .populate("primaryClinic", "name code")
        .sort({ lastName: 1, firstName: 1 })
        .limit(100);

      return successResponse({ patients, count: patients.length });
    } catch (error) {
      return databaseError(error);
    }
  }
);

/**
 * POST /api/patients
 * Create new patient
 */
export const POST = withPermissionAndClinic(
  Resource.Patient,
  Action.Create,
  (req) => getQueryParam(req, "clinicId") || "",
  async (req, user, context) => {
    try {
      await dbConnect();

      const body = await parseBody(req);
      if (!body) {
        return errorResponse("Invalid request body");
      }

      // Validate required fields
      const validation = validateRequiredFields(body, [
        "firstName",
        "lastName",
        "dateOfBirth",
        "gender",
        "phoneNumber",
      ]);

      if (!validation.valid) {
        return errorResponse("Missing required fields", 400, {
          missingFields: validation.missing,
        });
      }

      // Create patient
      const patient = await Patient.create({
        ...body,
        primaryClinic: context.clinicId,
        visitedClinics: [context.clinicId],
      });

      return successResponse({ patient }, 201);
    } catch (error) {
      return databaseError(error);
    }
  }
);

/**
 * PUT /api/patients/[id]
 * Update patient
 */
export const PUT = withPermission(
  Resource.Patient,
  Action.Update,
  async (req, user) => {
    try {
      await dbConnect();

      const patientId = getQueryParam(req, "id");
      if (!patientId) {
        return errorResponse("Patient ID is required");
      }

      const body = await parseBody(req);
      if (!body) {
        return errorResponse("Invalid request body");
      }

      // Find patient
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return notFoundError("Patient");
      }

      // Check clinic access
      const userClinicIds = getUserClinicIds(user);
      const hasAccess = userClinicIds.some(
        (id) => id.toString() === patient.primaryClinic.toString()
      );

      if (!hasAccess) {
        return errorResponse("Access denied to this patient", 403);
      }

      // Update patient (exclude protected fields)
      const { passportScan, primaryClinic, patientId: _, ...updateData } = body;

      Object.assign(patient, updateData);
      await patient.save();

      return successResponse({ patient });
    } catch (error) {
      return databaseError(error);
    }
  }
);

/**
 * DELETE /api/patients/[id]
 * Soft delete patient (set isActive to false)
 */
export const DELETE = withPermission(
  Resource.Patient,
  Action.Delete,
  async (req, user) => {
    try {
      await dbConnect();

      const patientId = getQueryParam(req, "id");
      if (!patientId) {
        return errorResponse("Patient ID is required");
      }

      // Find patient
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return notFoundError("Patient");
      }

      // Check clinic access
      const userClinicIds = getUserClinicIds(user);
      const hasAccess = userClinicIds.some(
        (id) => id.toString() === patient.primaryClinic.toString()
      );

      if (!hasAccess) {
        return errorResponse("Access denied to this patient", 403);
      }

      // Soft delete
      patient.isActive = false;
      await patient.save();

      return successResponse({ message: "Patient deactivated successfully" });
    } catch (error) {
      return databaseError(error);
    }
  }
);
