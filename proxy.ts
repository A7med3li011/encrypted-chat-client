import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch {
    return true;
  }
}

export default async function proxy(req: NextRequest) {
  const pathName = req.nextUrl.pathname;
  const cookiesData = await cookies();
  const token = cookiesData.get("accessToken")?.value;
  const refreshToken = cookiesData.get("refreshToken")?.value;

  if (token && !isTokenExpired(token)) {
    // console.log("alive");
  } else if (token && isTokenExpired(token)) {
    // console.log("token expired");
    const data = await fetch(
      `https://api.healthy.bond/api/v1/auth/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: refreshToken }),
      }
    );
    const res = await data.json();

    if (res.success) {
      const response = NextResponse.next();
      response.cookies.set("accessToken", res.accessToken);
      response.cookies.set("refreshToken", res.refreshToken);
      return response;
    } else {
      const response = NextResponse.redirect(new URL("/auth/login", req.url));
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }
  }

  const isUserRoute =
    pathName.includes("/dashboard") || pathName.includes("/profile");

  if (token && pathName.includes("/auth")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (!isUserRoute) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
}
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
