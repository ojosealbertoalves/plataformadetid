"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Paperclip, Upload } from "lucide-react";

interface AttachmentLike {
  id: string;
  fileName: string;
  size: number;
}

export function AttachmentsPanel({
  tidId,
  attachments,
  canUpload,
}: {
  tidId: string;
  attachments: AttachmentLike[];
  canUpload: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/tids/${tidId}/attachments`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Erro ao enviar anexo");
      return;
    }
    toast.success("Anexo enviado.");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {attachments.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhum anexo.</p>
      )}
      <ul className="space-y-1">
        {attachments.map((a) => (
          <li key={a.id}>
            <a
              href={`/api/attachments/${a.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary flex items-center gap-1.5 text-sm hover:underline"
            >
              <Paperclip className="size-3.5" />
              {a.fileName}
              <span className="text-muted-foreground text-xs">
                ({(a.size / 1024).toFixed(0)} KB)
              </span>
            </a>
          </li>
        ))}
      </ul>
      {canUpload && (
        <>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-1 size-4" />
            {uploading ? "Enviando..." : "Anexar arquivo"}
          </Button>
        </>
      )}
    </div>
  );
}
