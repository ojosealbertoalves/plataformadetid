"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Check, X } from "lucide-react";

export function InboxRowActions({ tidId }: { tidId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);

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
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" onClick={approve} disabled={busy}>
        <Check className="mr-1 size-4" />
        Aprovar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button size="sm" variant="destructive" disabled={busy}>
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={reject} disabled={busy}>
              Confirmar recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
