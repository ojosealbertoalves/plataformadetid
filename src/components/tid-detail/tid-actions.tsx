"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, Pencil, Trash2, X } from "lucide-react";

export function TidActions({
  tidId,
  canDecide,
  canManage,
  locked,
}: {
  tidId: string;
  canDecide: boolean;
  canManage: boolean;
  locked: boolean;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  async function approve() {
    setBusy(true);
    const res = await fetch(`/api/tids/${tidId}/approve`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.error || "Erro ao aprovar");
      return;
    }
    toast.success("TID aprovada.");
    router.refresh();
  }

  async function reject() {
    if (!comment.trim()) {
      toast.error("Informe o motivo da recusa");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/tids/${tidId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.error || "Erro ao recusar");
      return;
    }
    toast.success("TID recusada.");
    setRejectOpen(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Tem certeza que deseja excluir esta TID? Ela poderá ser vista no histórico de auditoria.")) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/tids/${tidId}`, { method: "DELETE" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.error || "Erro ao excluir");
      return;
    }
    toast.success("TID excluída.");
    router.push("/dashboard");
    router.refresh();
  }

  if (locked && !canManage) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {canDecide && !locked && (
        <>
          <Button onClick={approve} disabled={busy}>
            <Check className="mr-1 size-4" />
            Aprovar
          </Button>
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger
              render={
                <Button variant="destructive" disabled={busy}>
                  <X className="mr-1 size-4" />
                  Recusar
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recusar TID</DialogTitle>
                <DialogDescription>
                  Informe o motivo da recusa. Este comentário ficará registrado no histórico da TID.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Motivo da recusa..."
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={reject} disabled={busy}>
                  Confirmar recusa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
      {canManage && (
        <>
          <Button
            variant="outline"
            render={
              <Link href={`/tids/${tidId}/edit`}>
                <Pencil className="mr-1 size-4" />
                Editar
              </Link>
            }
          />
          <Button variant="outline" onClick={remove} disabled={busy}>
            <Trash2 className="mr-1 size-4" />
            Excluir
          </Button>
        </>
      )}
    </div>
  );
}
