import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/boards(.*)",
  "/docs(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/dashboard(.*)",
    "/boards(.*)",
    "/docs(.*)",
    "/settings(.*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
