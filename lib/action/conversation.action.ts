// Client-side conversation functions - no longer using server actions with cookies
"use server"


export async function StartConversation(data: string, token?: string) {
  const accessToken = token;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/conversations/start`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
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

export async function getAllMyConversations(page: string, limit: string, token?: string) {
  const accessToken = token;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/conversations?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${accessToken}`,
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

export async function getConversationById(id: string, token?: string) {
  const accessToken = token;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/conversations/${id}`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${accessToken}`,
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

export async function DeleteConversations(id: string, token?: string) {
  const accessToken = token;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/conversations/${id}`,
      {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${accessToken}`,
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
          message: `Failed to delete conversation: ${response.statusText}`,
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
