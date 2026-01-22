
"use server"
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
    profilePic?: string;
    role?: string;
    bio?: string;
    recoveryPassword?: string;
    recoveryPasswordQR?: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface ActionResponse {
  data: any;
  message?: string;
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error: {
    message: string;
    status: number;
  } | null;
}

export async function handleRegister(
  data: RegisterData,
): Promise<ActionResponse> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const result = await response.json();

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

    // Return tokens to be stored by the caller
    return {
      data: result.data || {},
      message: result.message,
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
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
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
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

    // Return tokens to be stored by the caller
    return {
      data: result.data || {},
      message: result.message,
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
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

export async function handleLogout(token: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
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
      success: false,
      error: {
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
        status: 500,
      },
    };
  }
}

export async function handlegetProfile(token: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const result = await response.json();
      return {
        data: null,
        success: false,
        message: result.message,
        error: {
          message: `Failed to get profile: ${response.statusText}`,
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

export async function handleUpdateIMageProfile(token: string, data: File) {
  const formData = new FormData();
  formData.append("profileImage", data);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/image`,
      {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const result = await response.json();
      return {
        data: null,
        success: false,
        message: result.message,
        error: {
          message: `Failed to update image profile: ${response.statusText}`,
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

export async function handleUpdateUserInfo(token: string, userName: string, bio: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/info`,
      {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName,
          bio,
        }),
      },
    );

    if (!response.ok) {
      const result = await response.json();
      return {
        data: null,
        success: false,
        message: result.message,
        error: {
          message: `Failed to update  profile info: ${response.statusText}`,
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

export async function handleRefreshToken(refreshToken: string): Promise<ActionResponse> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: refreshToken,
        }),
      },
    );

    if (!response.ok) {
      const result = await response.json();
      return {
        data: null,
        success: false,
        message: result.message,
        error: {
          message: `Failed to refresh token: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    const result = await response.json();

    return {
      data: result.data || null,
      message: result.message,
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
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
