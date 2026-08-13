import { requireRole } from "@/lib/session";
import { AssistantChat } from "@/components/admin/assistant-chat";

export default async function AdminAssistantPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assistente IA</h1>
        <p className="text-muted-foreground text-sm">
          Pergunte sobre os dados de TID. O modelo só responde com números vindos de consultas
          pré-definidas e parametrizadas — nunca com SQL livre ou valores inventados.
        </p>
      </div>
      <AssistantChat />
    </div>
  );
}
