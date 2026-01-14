"use server";

import { cookies } from "next/headers";

export async function getMessages(
  conversationId: string,
  page = 1,
  limit = 50
) {
  const cookiee = await cookies();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/messages/conversation/${conversationId}?page=${page}&limit=${limit}`,
      {
        method: "GET",
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
          message: `Failed to load messages: ${response.statusText}`,
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
export async function sendMessage(conversationId: string, content: string) {
  const cookiee = await cookies();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/messages`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${cookiee.get("accessToken")?.value}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversationId, content, messageType: "text" }),
      }
    );

    if (!response.ok) {
      const result = await response.json();
      console.log("Error response:", result);
      return {
        data: null,
        success: false,
        message: result.message,
        error: {
          message: `Failed to load messages: ${response.statusText}`,
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
