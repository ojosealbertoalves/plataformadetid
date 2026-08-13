"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Send, TriangleAlert } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Quem enviou mais TIDs este mês?",
  "Qual departamento mais aprovou TID?",
  "Qual o total de mão-de-obra direta da Porto Araras I?",
];

export function AssistantChat() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((d) => setConfigured(!!d.configured))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages([...next, { role: "assistant", content: `Erro: ${data.error}` }]);
      } else {
        setMessages([...next, { role: "assistant", content: data.answer }]);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Erro de rede ao consultar o assistente." }]);
    } finally {
      setLoading(false);
    }
  }

  if (configured === false) {
    return (
      <Alert>
        <TriangleAlert className="size-4" />
        <AlertTitle>Assistente IA não configurado</AlertTitle>
        <AlertDescription>
          Defina a variável de ambiente <code>OPENROUTER_API_KEY</code> no arquivo <code>.env</code>{" "}
          para habilitar esta aba.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex h-[70vh] flex-col gap-4">
      <Card className="flex-1 overflow-hidden">
        <CardContent className="flex h-full flex-col gap-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 text-center text-sm">
              <p>Pergunte sobre os dados de TID. Exemplos:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted mr-auto"
              )}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="bg-muted text-muted-foreground mr-auto rounded-lg px-3 py-2 text-sm">
              Consultando dados...
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo sobre as TIDs..."
          rows={1}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
