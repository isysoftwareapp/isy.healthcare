/**
 * RBAC Middleware
 * Provides authentication and authorization middleware for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserRole, hasGlobalAccess } from "./dbTypes";
import {
  Resource,
  Action,
  hasPermission,
  getPermissionScope,
} from "./permissions";
import mongoose from "mongoose";

/**
 * Session user type
 */
export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  assignedClinics: string[];
  primaryClinic?: string;
  preferences: {
    language: string;
    theme: string;
  };
}

/**
 * Authorization context
 */
export interface AuthContext {
  user: SessionUser;
  clinicId?: string;
  resourceId?: string;
}

/**
 * Authorization result
 */
export interface AuthResult {
  authorized: boolean;
  user?: SessionUser;
  reason?: string;
}

/**
 * Middleware to check if user is authenticated
 */
export async function requireAuth(req: NextRequest): Promise<{
  authorized: boolean;
  user?: SessionUser;
  response?: NextResponse;
}> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    user: session.user as SessionUser,
  };
}

/**
 * Middleware to check if user has specific role(s)
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[]
): Promise<{
  authorized: boolean;
  user?: SessionUser;
  response?: NextResponse;
}> {
  const authResult = await requireAuth(req);

  if (!authResult.authorized) {
    return authResult;
  }

  const user = authResult.user!;

  if (!allowedRoles.includes(user.role as UserRole)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Forbidden - Insufficient permissions",
          requiredRoles: allowedRoles,
          userRole: user.role,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Middleware to check if user has permission for resource and action
 */
export async function requirePermission(
  req: NextRequest,
  resource: Resource,
  action: Action
): Promise<{
  authorized: boolean;
  user?: SessionUser;
  response?: NextResponse;
}> {
  const authResult = await requireAuth(req);

  if (!authResult.authorized) {
    return authResult;
  }

  const user = authResult.user!;

  if (!hasPermission(user.role as UserRole, resource, action)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Forbidden - You don't have permission for this action",
          resource,
          action,
          userRole: user.role,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Middleware to check if user has access to a specific clinic
 */
export async function requireClinicAccess(
  req: NextRequest,
  clinicId: string
): Promise<{
  authorized: boolean;
  user?: SessionUser;
  response?: NextResponse;
}> {
  const authResult = await requireAuth(req);

  if (!authResult.authorized) {
    return authResult;
  }

  const user = authResult.user!;

  // Global access roles can access any clinic
  if (hasGlobalAccess(user.role as UserRole)) {
    return {
      authorized: true,
      user,
    };
  }

  // Check if clinic is in user's assigned clinics
  const hasAccess = user.assignedClinics.some(
    (assignedClinic) => assignedClinic.toString() === clinicId.toString()
  );

  if (!hasAccess) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Forbidden - You don't have access to this clinic",
          clinicId,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Combined middleware to check permission and clinic access
 */
export async function requirePermissionAndClinicAccess(
  req: NextRequest,
  resource: Resource,
  action: Action,
  clinicId: string
): Promise<{
  authorized: boolean;
  user?: SessionUser;
  response?: NextResponse;
}> {
  // First check permission
  const permResult = await requirePermission(req, resource, action);
  if (!permResult.authorized) {
    return permResult;
  }

  // Then check clinic access
  const clinicResult = await requireClinicAccess(req, clinicId);
  if (!clinicResult.authorized) {
    return clinicResult;
  }

  return {
    authorized: true,
    user: clinicResult.user,
  };
}

/**
 * Check if user can access sensitive patient data (passport/ID scans)
 */
export async function canAccessSensitiveData(req: NextRequest): Promise<{
  authorized: boolean;
  user?: SessionUser;
  response?: NextResponse;
}> {
  const authResult = await requireAuth(req);

  if (!authResult.authorized) {
    return authResult;
  }

  const user = authResult.user!;
  const allowedRoles: UserRole[] = [
    UserRole.Admin,
    UserRole.Director,
    UserRole.Finance,
  ];

  if (!allowedRoles.includes(user.role as UserRole)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error:
            "Forbidden - Access to sensitive data requires Admin, Director, or Finance role",
          userRole: user.role,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Build query filter based on user's role and clinic access
 */
export function buildClinicFilter(user: SessionUser): Record<string, any> {
  // Global access roles see all clinics
  if (hasGlobalAccess(user.role as UserRole)) {
    return {}; // No filter - can see all
  }

  // Clinic-specific roles only see their assigned clinics
  return {
    $or: [
      {
        primaryClinic: {
          $in: user.assignedClinics.map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      },
      {
        assignedClinic: {
          $in: user.assignedClinics.map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      },
    ],
  };
}

/**
 * Validate ObjectId format
 */
export function validateObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Extract clinic ID from request (query param or body)
 */
export function extractClinicId(req: NextRequest): string | null {
  const { searchParams } = new URL(req.url);
  return searchParams.get("clinicId");
}

/**
 * Get clinic IDs user has access to
 */
export function getUserClinicIds(user: SessionUser): mongoose.Types.ObjectId[] {
  return user.assignedClinics.map((id) => new mongoose.Types.ObjectId(id));
}

/**
 * Check if user owns a resource (for "own" scope permissions)
 */
export function isResourceOwner(
  userId: string,
  resourceOwnerId: string
): boolean {
  return userId.toString() === resourceOwnerId.toString();
}

/**
 * Audit log helper - to be used after successful operations
 */
export interface AuditLogData {
  userId: string;
  userRole: UserRole;
  action: Action;
  resource: Resource;
  resourceId?: string;
  clinicId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry (to be implemented with AuditLog model)
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  // TODO: Implement when AuditLog model is created
  console.log("Audit Log:", {
    timestamp: new Date().toISOString(),
    ...data,
  });
}

/**
 * Get client IP from request
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : req.headers.get("x-real-ip") || "unknown";
  return ip;
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent") || "unknown";
}
