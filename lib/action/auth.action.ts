"use server";

import { cookies } from "next/headers";

interface RegisterData {
  userName: string;
  location: string;
  deviceType: string;
}

interface LoginData {
  recoveryPassword: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accountId: string;
    userName: string;
    accountIdQR: string;
    recoveryPassword?: string; // Only present in register response
    recoveryPasswordQR?: string; // Only present in register response
  };
  accessToken: string;
  refreshToken: string;
}

interface ActionResponse {
  data: any;
  message?: string;
  success: boolean;
  error: {
    message: string;
    status: number;
  } | null;
}

export async function handleRegister(
  data: RegisterData
): Promise<ActionResponse> {
  const cookiee = await cookies();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const result = await response.json();
      console.log(result, "herer");
      return {
        data: null,
        success: false,
        message: result.message,
        error: {
          message: `Failed to register ${response.statusText}`,
          status: response.status,
        },
      };
    }

    const result: AuthResponse = await response.json();
    console.log(result);
    // Store tokens in HTTP-only cookies (secure, not accessible via JavaScript)
    cookiee.set("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 15, // 15 minutes
    });

    cookiee.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return {
      data: result.data || {},
      message: result.message,
      success: true,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      success: false,
      error: {
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
        status: 500,
      },
    };
  }
}

export async function handleLogin(data: LoginData): Promise<ActionResponse> {
  const cookiee = await cookies();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const result = await response.json();
      return {
        data: null,
        success: false,
        message: result.message,
        error: {
          message: `Failed to login: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    const result: AuthResponse = await response.json();

    // Store tokens in HTTP-only cookies (secure, not accessible via JavaScript)
    cookiee.set("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 15 * 60, // 15 minutes
    });

    cookiee.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return {
      data: result.data || {},
      message: result.message,
      success: true,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      success: false,
      error: {
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
        status: 500,
      },
    };
  }
}

export async function handleLogout() {
  const token = (await cookies()).get("accessToken")?.value || "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    await (await cookies()).delete("accessToken");
    await (await cookies()).delete("refreshToken");
    if (!response.ok) {
      const result = await response.json();
      return {
        data: null,
        success: false,
        message: result.message,
        error: {
          message: `Failed to logout: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    const result = await response.json();

    return {
      data: result.data || null,
      message: result.message,
      success: true,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
        status: 500,
      },
    };
  }
}
export async function handlegetProfile() {
  const token = (await cookies()).get("accessToken")?.value || "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const result = await response.json();
      return {
        data: null,
        success: false,
        message: result.message,
        error: {
          message: `Failed to logout: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    const result = await response.json();

    return {
      data: result.data || null,
      message: result.message,
      success: true,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      success: false,
      error: {
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
        status: 500,
      },
    };
  }
}
