/**
 * Database Types & Utilities
 * Common type definitions and helper types for database operations
 */

import mongoose from "mongoose";
import type { IUser, IPatient, IClinic } from "@/models";

/**
 * User Roles Enum
 */
export enum UserRole {
  Admin = "Admin",
  Director = "Director",
  Operational = "Operational",
  Doctor = "Doctor",
  Nurse = "Nurse",
  Reception = "Reception",
  Finance = "Finance",
  Laboratory = "Laboratory",
  Radiology = "Radiology",
  Pharmacy = "Pharmacy",
}

/**
 * Global Access Roles (can access all clinics)
 */
export const GLOBAL_ACCESS_ROLES: UserRole[] = [
  UserRole.Admin,
  UserRole.Director,
  UserRole.Operational,
];

/**
 * Clinic-Specific Roles (restricted to assigned clinics)
 */
export const CLINIC_SPECIFIC_ROLES: UserRole[] = [
  UserRole.Doctor,
  UserRole.Nurse,
  UserRole.Reception,
  UserRole.Finance,
  UserRole.Laboratory,
  UserRole.Radiology,
  UserRole.Pharmacy,
];

/**
 * Patient Categories for Pricing
 */
export enum PatientCategory {
  Local = "Local",
  LocalInsurance = "Local_Insurance",
  Tourist = "Tourist",
  TouristInsurance = "Tourist_Insurance",
}

/**
 * Service Categories
 */
export enum ServiceCategory {
  Consultation = "Consultation",
  Procedure = "Procedure",
  Laboratory = "Laboratory",
  Radiology = "Radiology",
  Pharmacy = "Pharmacy",
  Other = "Other",
}

/**
 * Template Types
 */
export enum TemplateType {
  ConsultationNote = "ConsultationNote",
  Prescription = "Prescription",
  LabOrder = "LabOrder",
  RadiologyOrder = "RadiologyOrder",
  ConsentForm = "ConsentForm",
  Invoice = "Invoice",
  Other = "Other",
}

/**
 * Pricelist Types
 */
export enum PricelistType {
  Insurance = "Insurance",
  Contract = "Contract",
  Custom = "Custom",
  Promotional = "Promotional",
}

/**
 * Theme Options
 */
export enum Theme {
  Light = "light",
  Dark = "dark",
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Common Query Filters
 */
export interface CommonFilters {
  clinicId?: string | mongoose.Types.ObjectId;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * User Query Filters
 */
export interface UserFilters extends CommonFilters {
  role?: UserRole;
  assignedClinic?: string | mongoose.Types.ObjectId;
}

/**
 * Patient Query Filters
 */
export interface PatientFilters extends CommonFilters {
  category?: PatientCategory;
  hasInsurance?: boolean;
  ageMin?: number;
  ageMax?: number;
}

/**
 * Permission Check Result
 */
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiredRole?: UserRole[];
  requiredClinic?: mongoose.Types.ObjectId;
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  userId: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId: mongoose.Types.ObjectId;
  changes?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Clinic Context (for operations)
 */
export interface ClinicContext {
  clinicId: mongoose.Types.ObjectId;
  clinic?: IClinic;
  user: IUser;
  hasAccess: boolean;
}

/**
 * Search Result
 */
export interface SearchResult<T> {
  type: string;
  item: T;
  score?: number;
  highlights?: string[];
}

/**
 * Utility type for populating references
 */
export type PopulatedDocument<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] extends mongoose.Types.ObjectId
    ? mongoose.Document
    : T[P] extends mongoose.Types.ObjectId[]
    ? mongoose.Document[]
    : T[P];
};

/**
 * Helper function to check if user has global access
 */
export function hasGlobalAccess(role: UserRole): boolean {
  return GLOBAL_ACCESS_ROLES.includes(role);
}

/**
 * Helper function to check if role requires clinic assignment
 */
export function requiresClinicAssignment(role: UserRole): boolean {
  return CLINIC_SPECIFIC_ROLES.includes(role);
}

/**
 * Helper function to validate ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Helper function to convert to ObjectId
 */
export function toObjectId(
  id: string | mongoose.Types.ObjectId
): mongoose.Types.ObjectId {
  if (typeof id === "string") {
    return new mongoose.Types.ObjectId(id);
  }
  return id;
}

/**
 * Helper function to create pagination metadata
 */
export function createPaginationMetadata(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Helper function to apply pagination to query
 */
export function applyPagination<T>(
  query: mongoose.Query<T[], T>,
  params: PaginationParams
): mongoose.Query<T[], T> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const skip = (page - 1) * limit;

  if (params.sortBy) {
    const sortOrder = params.sortOrder === "desc" ? -1 : 1;
    query.sort({ [params.sortBy]: sortOrder });
  }

  return query.skip(skip).limit(limit);
}

/**
 * Error types for database operations
 */
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class PermissionError extends Error {
  constructor(message: string, public requiredRole?: UserRole[]) {
    super(message);
    this.name = "PermissionError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
    this.name = "ValidationError";
  }
}
