import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError, requireApiUser } from "@/lib/api-helpers";
import { callOpenRouter, isAssistantConfigured, type ChatMessage } from "@/lib/openrouter";
import { executeAiTool } from "@/lib/ai-tools";

const SYSTEM_PROMPT = `Você é o assistente de dados do sistema de TID (Transferência Interna de Despesa) da Vila Brasil Engenharia.
Responda SOMENTE com base nos números retornados pelas ferramentas disponíveis — nunca invente valores.
Se precisar do código de uma unidade, use a ferramenta listar_unidades.
Responda sempre em português do Brasil, de forma direta e objetiva, citando os números encontrados.
Formate valores monetários como R$ (ex.: R$ 1.234,56).`;

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .min(1),
});

export async function GET() {
  return NextResponse.json({ configured: isAssistantConfigured() });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser();
    if (user.role !== "ADMIN") {
      throw new ApiError(403, "Apenas o admin acessa o assistente");
    }
    if (!isAssistantConfigured()) {
      throw new ApiError(400, "Assistente IA não configurado (OPENROUTER_API_KEY vazio)");
    }

    const { messages } = chatSchema.parse(await req.json());

    const conversation: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
    ];

    // Primeira chamada: o modelo decide se quer chamar uma ferramenta.
    let response = await callOpenRouter(conversation);
    let message = response.choices?.[0]?.message;

    let loopGuard = 0;
    while (message?.tool_calls?.length && loopGuard < 4) {
      loopGuard++;
      conversation.push({
        role: "assistant",
        content: message.content ?? "",
        tool_calls: message.tool_calls,
      });

      for (const call of message.tool_calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          args = {};
        }
        const result = await executeAiTool(call.function.name, args);
        conversation.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }

      response = await callOpenRouter(conversation);
      message = response.choices?.[0]?.message;
    }

    const answer = message?.content ?? "Não consegui gerar uma resposta.";
    return NextResponse.json({ answer });
  } catch (err) {
    return handleApiError(err);
  }
}
