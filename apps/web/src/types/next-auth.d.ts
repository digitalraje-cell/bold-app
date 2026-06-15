declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isVerified: boolean;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    isVerified?: boolean;
  }
}

export {};
