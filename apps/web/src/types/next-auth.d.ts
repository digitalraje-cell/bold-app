declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isVerified: boolean;
      subscriptionPlan: string;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    isVerified?: boolean;
    subscriptionPlan?: string;
  }
}

export {};
