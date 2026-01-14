"use server";
import { cookies } from "next/headers";

export async function StartConversation(data: string) {
  const cookiee = await cookies();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/conversations/start`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${cookiee.get("accessToken")?.value}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetAccountId: data,
        }),
      }
    );

    if (!response.ok) {
      const result = await response.json();
      return {
        data: null,
        success: false,
        message: result.message,
        error: {
          message: `Failed to create conversation: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    const result = await response.json();

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
export async function getAllMyConversations(page: string, limit: string) {
  const cookiee = await cookies();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/conversations?page=${page}&limit=${limit}`,
      {
        method: "Get",
        headers: {
          authorization: `Bearer ${cookiee.get("accessToken")?.value}`,
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
          message: `Failed to load conversation: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    const result = await response.json();

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
export async function DeleteConversations(id: string) {
  const cookiee = await cookies();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/conversations/${id}`,
      {
        method: "Delete",
        headers: {
          authorization: `Bearer ${cookiee.get("accessToken")?.value}`,
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
          message: `Failed to load conversation: ${response.statusText}`,
          status: response.status,
        },
      };
    }

    const result = await response.json();

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
