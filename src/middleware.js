import { NextResponse } from "next/server";

export const middleware = async function (req) {
  // Get the session token from cookies
  const token =
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token");

  // If there's no token, redirect to the login page
  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Allow the request to continue if authenticated
  return NextResponse.next();
};

// Specify routes where the middleware should apply
export const config = {
  matcher: [
    "/about",
    "/teacher-dashboard",
    "/teacher-dashboard/reports",
    "/teacher-dashboard/rooms/:path*", // Matches dynamic segments
    "/create_flashcard",
    "/create_4pics1word",
    "/create4pics1word_advanced",
    "/create_assignment",
    "/create_color_game",
    "/create_color_game_adanced",
    "/create_decision_maker",
    "/homepage/:path*",
    "/super-admin/account-management",
  ],
};
