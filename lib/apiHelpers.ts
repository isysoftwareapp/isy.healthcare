/**
 * API Route Helpers
 * Wrapper functions to simplify RBAC implementation in API routes
 */

import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireRole,
  requirePermission,
  requireClinicAccess,
  requirePermissionAndClinicAccess,
  canAccessSensitiveData,
  SessionUser,
  createAuditLog,
  getClientIp,
  getUserAgent,
} from "./rbac";
import { UserRole } from "./dbTypes";
import { Resource, Action } from "./permissions";

/**
 * Handler function type
 */
export type ApiHandler = (
  req: NextRequest,
  user: SessionUser,
  context?: any
) => Promise<NextResponse>;

/**
 * Wrapper to protect route with authentication
 */
export function withAuth(handler: ApiHandler) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const authResult = await requireAuth(req);

    if (!authResult.authorized) {
      return authResult.response!;
    }

    return handler(req, authResult.user!, context);
  };
}

/**
 * Wrapper to protect route with role requirement
 */
export function withRole(allowedRoles: UserRole[], handler: ApiHandler) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const roleResult = await requireRole(req, allowedRoles);

    if (!roleResult.authorized) {
      return roleResult.response!;
    }

    return handler(req, roleResult.user!, context);
  };
}

/**
 * Wrapper to protect route with permission requirement
 */
export function withPermission(
  resource: Resource,
  action: Action,
  handler: ApiHandler
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const permResult = await requirePermission(req, resource, action);

    if (!permResult.authorized) {
      return permResult.response!;
    }

    return handler(req, permResult.user!, context);
  };
}

/**
 * Wrapper to protect route with clinic access requirement
 */
export function withClinicAccess(
  getClinicId: (req: NextRequest, context?: any) => string,
  handler: ApiHandler
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const clinicId = getClinicId(req, context);

    if (!clinicId) {
      return NextResponse.json(
        { error: "Clinic ID is required" },
        { status: 400 }
      );
    }

    const clinicResult = await requireClinicAccess(req, clinicId);

    if (!clinicResult.authorized) {
      return clinicResult.response!;
    }

    return handler(req, clinicResult.user!, { ...context, clinicId });
  };
}

/**
 * Wrapper to protect route with permission and clinic access
 */
export function withPermissionAndClinic(
  resource: Resource,
  action: Action,
  getClinicId: (req: NextRequest, context?: any) => string,
  handler: ApiHandler
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const clinicId = getClinicId(req, context);

    if (!clinicId) {
      return NextResponse.json(
        { error: "Clinic ID is required" },
        { status: 400 }
      );
    }

    const result = await requirePermissionAndClinicAccess(
      req,
      resource,
      action,
      clinicId
    );

    if (!result.authorized) {
      return result.response!;
    }

    return handler(req, result.user!, { ...context, clinicId });
  };
}

/**
 * Wrapper to protect route requiring sensitive data access
 */
export function withSensitiveDataAccess(handler: ApiHandler) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const result = await canAccessSensitiveData(req);

    if (!result.authorized) {
      return result.response!;
    }

    return handler(req, result.user!, context);
  };
}

/**
 * Wrapper with automatic audit logging
 */
export function withAuditLog(
  resource: Resource,
  action: Action,
  handler: ApiHandler
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const authResult = await requireAuth(req);

    if (!authResult.authorized) {
      return authResult.response!;
    }

    const user = authResult.user!;

    // Execute handler
    const response = await handler(req, user, context);

    // Log successful operations (status 200-299)
    if (response.status >= 200 && response.status < 300) {
      await createAuditLog({
        userId: user.id,
        userRole: user.role as UserRole,
        action,
        resource,
        resourceId: context?.resourceId,
        clinicId: context?.clinicId,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      });
    }

    return response;
  };
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...details,
    },
    { status }
  );
}

/**
 * Success response helper
 */
export function successResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Validation error response
 */
export function validationError(fields: Record<string, string>): NextResponse {
  return NextResponse.json(
    {
      error: "Validation failed",
      fields,
    },
    { status: 400 }
  );
}

/**
 * Not found error response
 */
export function notFoundError(resource: string): NextResponse {
  return NextResponse.json(
    {
      error: `${resource} not found`,
    },
    { status: 404 }
  );
}

/**
 * Database error response
 */
export function databaseError(error: any): NextResponse {
  console.error("Database error:", error);
  return NextResponse.json(
    {
      error: "Database operation failed",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    },
    { status: 500 }
  );
}

/**
 * Parse request body safely
 */
export async function parseBody<T = any>(req: NextRequest): Promise<T | null> {
  try {
    return await req.json();
  } catch (error) {
    return null;
  }
}

/**
 * Get query parameter
 */
export function getQueryParam(req: NextRequest, key: string): string | null {
  const { searchParams } = new URL(req.url);
  return searchParams.get(key);
}

/**
 * Get multiple query parameters
 */
export function getQueryParams(
  req: NextRequest,
  keys: string[]
): Record<string, string | null> {
  const { searchParams } = new URL(req.url);
  const result: Record<string, string | null> = {};

  for (const key of keys) {
    result[key] = searchParams.get(key);
  }

  return result;
}

/**
 * Validate required fields in body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (
      body[field] === undefined ||
      body[field] === null ||
      body[field] === ""
    ) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
