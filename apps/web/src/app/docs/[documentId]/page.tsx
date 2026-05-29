import { AppShell } from "@/components/dashboard/app-shell";
import { DocumentRoom } from "@/app/docs/[documentId]/room";
import { getDocumentRoom } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: { documentId: string } }) {
  const room = await getDocumentRoom(params.documentId, "text");

  return (
    <AppShell>
      <DocumentRoom room={room} />
    </AppShell>
  );
}
