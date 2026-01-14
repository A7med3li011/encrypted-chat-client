import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

export default async function proxy(req: NextRequest) {
  const pathName = req.nextUrl.pathname;
  const cookiesData = await cookies();
  const token = cookiesData.get("accessToken")?.value;


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
