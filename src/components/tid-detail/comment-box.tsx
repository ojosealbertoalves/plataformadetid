"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommentBox({ tidId }: { tidId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/tids/${tidId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Erro ao comentar");
      return;
    }
    setText("");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Adicionar comentário..."
        rows={2}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={submit} disabled={busy || !text.trim()}>
          Comentar
        </Button>
      </div>
    </div>
  );
}
