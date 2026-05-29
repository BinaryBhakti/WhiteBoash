import { AppShell } from "@/components/dashboard/app-shell";
import { BoardRoom } from "@/app/boards/[documentId]/room";
import { getDocumentRoom } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BoardPage({ params }: { params: { documentId: string } }) {
  const room = await getDocumentRoom(params.documentId, "canvas");

  return (
    <AppShell>
      <BoardRoom room={room} />
    </AppShell>
  );
}
