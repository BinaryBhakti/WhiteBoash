import { auth, currentUser } from "@clerk/nextjs/server";

export async function requireCurrentUser() {
  await auth.protect();

  const user = await currentUser();
  if (!user) {
    throw new Error("Authenticated user was not found.");
  }

  return {
    id: user.id,
    email: user.emailAddresses.at(0)?.emailAddress ?? null,
    displayName: user.fullName ?? user.username ?? "Collaborator",
    avatarUrl: user.imageUrl,
  };
}
