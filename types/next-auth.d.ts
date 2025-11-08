import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: string;
    assignedClinics: string[];
    primaryClinic?: string;
    preferences: {
      language: string;
      theme: string;
    };
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      assignedClinics: string[];
      primaryClinic?: string;
      preferences: {
        language: string;
        theme: string;
      };
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    assignedClinics: string[];
    primaryClinic?: string;
    preferences: {
      language: string;
      theme: string;
    };
  }
}
