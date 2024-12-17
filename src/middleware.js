import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Allow access to static assets and root without authentication
  if (
    path.startsWith("/_next/") ||
    path.startsWith("/api/") ||
    path.startsWith("/static/") ||
    path.startsWith("/images/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/auth/") ||
    path === "/" ||
    path === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // If user is not logged in, redirect to root page
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user is a student
  if (token.role === "student") {
    // Check if the path matches the flashcard route
    const roomCodeMatch = path.match(
      /\/homepage\/joined_rooms\/(\w+)\/(flashcard|4pics1word|4pics1word_advanced|color_game|sequence_game|decision_maker|assignment)\/\d+/
    );
    if (roomCodeMatch) {
      const roomCode = roomCodeMatch[1];
      const studentId = token.sub; // Use token.sub for student ID

      // Check if studentId is defined before making the API call
      if (studentId) {
        // Check if the student is in the room using API
        const response = await fetch(
          new URL(
            `/api/accounts_student/room/student_exist?account_id=${studentId}&room_code=${roomCode}`,
            request.url
          )
        );
        const data = await response.json();

        if (!data.exists) {
          return NextResponse.redirect(new URL("/unauthorized", request.url)); // Redirect to unauthorized page
        }
      } else {
        console.error("Student ID is undefined");
        return NextResponse.redirect(new URL("/unauthorized", request.url)); // Redirect to unauthorized page
      }
    }

    // Only allow access to homepage and its sub-routes
    if (!path.startsWith("/homepage")) {
      return NextResponse.redirect(new URL("/homepage", request.url));
    }
    return NextResponse.next();
  }

  // If user is a teacher
  if (token.role === "teacher") {
    // Only allow access to teacher routes, prevent access to homepage
    if (path.startsWith("/homepage")) {
      return NextResponse.redirect(new URL("/teacher-dashboard", request.url));
    }
    return NextResponse.next();
  }

  // For other roles, allow access to all protected routes
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
