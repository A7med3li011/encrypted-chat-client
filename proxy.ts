import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

export default async function proxy(req: NextRequest) {
  const pathName = req.nextUrl.pathname;
  const cookiesData = await cookies();

  console.log(pathName, "asdasdasddddddddddddddddddddddddddddd");
  const isUserRoute =
    pathName.includes("/dashboard") || pathName.includes("/profile");

  if (!isUserRoute) {
    return NextResponse.next();
  }

  const token = cookiesData.get("accessToken")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
}
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
