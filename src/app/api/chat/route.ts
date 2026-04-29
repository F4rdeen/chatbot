import { NextRequest, NextResponse } from "next/server";

const LANGUAGE_PROMPTS: Record<string, string> = {
  en: "You are a friendly and helpful AI assistant. Always respond in English. Be conversational and warm.",
  ms: "Anda adalah pembantu AI yang mesra dan membantu. Selalu balas dalam Bahasa Melayu. Gunakan bahasa yang sopan dan mesra.",
  ta: "நீங்கள் ஒரு நட்பான மற்றும் உதவிகரமான AI உதவியாளர். எப்போதும் தமிழில் பதிலளிக்கவும். அன்பாகவும் இனிமையாகவும் பேசவும்.",
  mix: `You are a friendly AI assistant who speaks in Manglish/Singlish – a fun mix of English, Malay, and Tamil commonly spoken in Malaysia and Singapore. 
Mix languages naturally in your responses. For example: "Eh, you boleh tanya me anything lah! I will help you one, don't worry okay?"
Use words like: lah, leh, lor, meh, kan, boleh, tak apa, ayyo, macam mana, shiok, power, satu lagi etc.
Keep it casual, fun and authentic to Malaysian/Singaporean culture.`,
};

const MODEL_ID = "HuggingFaceH4/zephyr-7b-beta";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  let language = "en";
  try {
    const body = await req.json();
    const { messages } = body;
    language = body.language ?? "en";

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const systemPrompt =
      LANGUAGE_PROMPTS[language] ?? LANGUAGE_PROMPTS["en"];

    const systemMessage: Message = { role: "system", content: systemPrompt };
    const fullMessages: Message[] = [systemMessage, ...messages];

    const hfToken = process.env.HUGGINGFACE_API_KEY;

    // Build prompt in ChatML format supported by Zephyr
    const prompt = fullMessages
      .map((m) => {
        if (m.role === "system") return `<|system|>\n${m.content}</s>`;
        if (m.role === "user") return `<|user|>\n${m.content}</s>`;
        return `<|assistant|>\n${m.content}</s>`;
      })
      .join("\n")
      .concat("\n<|assistant|>\n");

    const hfResponse = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {}),
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 512,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true,
            return_full_text: false,
          },
        }),
      }
    );

    if (!hfResponse.ok) {
      const err = await hfResponse.text();
      console.error("HuggingFace error:", err);
      // Return a graceful fallback in the requested language
      const fallback = getFallbackMessage(language);
      return NextResponse.json({ reply: fallback });
    }

    const data = await hfResponse.json();
    let reply: string =
      Array.isArray(data) && data[0]?.generated_text
        ? data[0].generated_text
        : typeof data?.generated_text === "string"
        ? data.generated_text
        : "";

    // Clean up any trailing template tokens
    reply = reply.split("<|")[0].trim();

    if (!reply) {
      reply = getFallbackMessage(language);
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ reply: getFallbackMessage(language ?? "en") });
  }
}

function getFallbackMessage(language: string): string {
  const messages: Record<string, string> = {
    en: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment!",
    ms: "Maaf, saya menghadapi masalah sambungan sekarang. Sila cuba lagi sebentar!",
    ta: "மன்னிக்கவும், இப்போது இணைப்பில் சிக்கல் உள்ளது. சற்று பிறகு மீண்டும் முயற்சிக்கவும்!",
    mix: "Aiyo, ada problem lah with the connection. Try again later okay?",
  };
  return messages[language] ?? messages["en"];
}
