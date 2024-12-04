import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Allow access to static assets and root without authentication
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path.startsWith('/static/') ||
    path.startsWith('/images/') ||
    path.startsWith('/assets/') ||
    path.startsWith('/auth/') ||
    path === '/' ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // If user is not logged in, redirect to root page
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user is a student
  if (token.role === "student") {
    // Only allow access to homepage and its sub-routes
    if (!path.startsWith("/homepage")) {
      return NextResponse.redirect(new URL("/homepage", request.url));
    }
    return NextResponse.next();
  }

  // For other roles (like teachers), allow access to all protected routes
  return NextResponse.next();
}

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
