import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ZodError } from "zod";
import { createDocumentForUser } from "@/lib/documents";
import { createDocumentSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in before creating documents." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createDocumentSchema.parse(body);
    const document = await createDocumentForUser(parsed, { id: userId });

    revalidatePath("/dashboard");

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid document payload.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Failed to create document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
