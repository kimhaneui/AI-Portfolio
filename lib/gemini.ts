// Google Gemini API 클라이언트

const geminiApiKey = process.env.GEMINI_API_KEY || "";

if (!geminiApiKey) {
  console.warn("GEMINI_API_KEY is not set");
}

const GEMINI_CHAT_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

/**
 * Google Gemini 채팅 완성 생성
 */
export async function generateChatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  model: "gemini-1.5-flash" | "gemini-1.5-pro" = "gemini-1.5-flash"
): Promise<string> {
  if (!geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Please configure it in .env.local"
    );
  }

  // Gemini는 system 메시지를 별도로 처리하지 않으므로,
  // system 메시지를 user 메시지 앞에 추가
  const systemMessage = messages.find((m) => m.role === "system");
  const userMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );

  let combinedText = "";
  if (systemMessage) {
    combinedText += systemMessage.content + "\n\n";
  }
  userMessages.forEach((msg) => {
    combinedText += `${msg.role === "user" ? "사용자" : "어시스턴트"}: ${
      msg.content
    }\n\n`;
  });

  const chatUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

  const response = await fetch(chatUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: combinedText,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Gemini Chat API error: ${JSON.stringify(data)}`);
  }

  return data.candidates[0]?.content?.parts[0]?.text || "";
}
