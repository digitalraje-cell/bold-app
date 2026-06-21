declare module 'next-auth' {
  interface User {
    isVerified?: boolean;
    subscriptionPlan?: string;
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isVerified: boolean;
      subscriptionPlan: string;
      role: string;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    isVerified?: boolean;
    subscriptionPlan?: string;
    role?: string;
  }
}

export {};
