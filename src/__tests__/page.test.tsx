/**
 * Tests for src/app/page.tsx (ChatPage component and MessageBubble)
 *
 * We mock @/lib/speech so no Web Speech API calls occur.
 * We mock global.fetch for the /api/chat POST.
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPage from "@/app/page";

// jsdom does not implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock("@/lib/speech", () => ({
  speak: jest.fn(),
  stopSpeaking: jest.fn(),
}));

const mockFetchReply = (reply: string) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ reply }),
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchReply("Hi there!");
});

// ─── Rendering ────────────────────────────────────────────────────────────────
describe("ChatPage rendering", () => {
  it("renders the chatbot header", () => {
    render(<ChatPage />);
    expect(screen.getByText("Multilingual Chatbot")).toBeInTheDocument();
  });

  it("renders all 4 language selector buttons", () => {
    render(<ChatPage />);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Bahasa Melayu")).toBeInTheDocument();
    expect(screen.getByText("தமிழ்")).toBeInTheDocument();
    expect(screen.getByText("Manglish Mix")).toBeInTheDocument();
  });

  it("renders the initial English greeting on mount", () => {
    render(<ChatPage />);
    expect(
      screen.getByText("Hello! How can I help you today?")
    ).toBeInTheDocument();
  });

  it("renders the text input textarea", () => {
    render(<ChatPage />);
    expect(
      screen.getByPlaceholderText("Type your message in English…")
    ).toBeInTheDocument();
  });

  it("renders the send button", () => {
    render(<ChatPage />);
    expect(screen.getByTitle("Send")).toBeInTheDocument();
  });

  it("renders the microphone button", () => {
    render(<ChatPage />);
    expect(screen.getByTitle("Voice input")).toBeInTheDocument();
  });

  it("shows the 'Online' status indicator", () => {
    render(<ChatPage />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("shows powered-by footer text", () => {
    render(<ChatPage />);
    expect(
      screen.getByText(/Powered by HuggingFace AI/i)
    ).toBeInTheDocument();
  });
});

// ─── Language switching ───────────────────────────────────────────────────────
describe("Language switching", () => {
  it("switches to Malay and shows Malay greeting", async () => {
    render(<ChatPage />);
    await act(async () => {
      fireEvent.click(screen.getByText("Bahasa Melayu"));
    });
    expect(
      screen.getByText("Halo! Apa yang boleh saya bantu hari ini?")
    ).toBeInTheDocument();
  });

  it("switches to Tamil and shows Tamil greeting", async () => {
    render(<ChatPage />);
    await act(async () => {
      fireEvent.click(screen.getByText("தமிழ்"));
    });
    expect(
      screen.getByText("வணக்கம்! இன்று நான் உங்களுக்கு எவ்வாறு உதவலாம்?")
    ).toBeInTheDocument();
  });

  it("switches to Manglish and shows Manglish greeting", async () => {
    render(<ChatPage />);
    await act(async () => {
      fireEvent.click(screen.getByText("Manglish Mix"));
    });
    expect(
      screen.getByText(/Eh hello! What can I help you with lah/)
    ).toBeInTheDocument();
  });

  it("updates the textarea placeholder when language changes", async () => {
    render(<ChatPage />);
    await act(async () => {
      fireEvent.click(screen.getByText("Bahasa Melayu"));
    });
    expect(
      screen.getByPlaceholderText("Taip mesej anda dalam Bahasa Melayu…")
    ).toBeInTheDocument();
  });

  it("clears input when language changes", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    const textarea = screen.getByPlaceholderText("Type your message in English…");
    await user.type(textarea, "Hello");
    expect(textarea).toHaveValue("Hello");

    await act(async () => {
      fireEvent.click(screen.getByText("Bahasa Melayu"));
    });
    // Textarea should now have the MS placeholder and empty value
    const msTextarea = screen.getByPlaceholderText(
      "Taip mesej anda dalam Bahasa Melayu…"
    );
    expect(msTextarea).toHaveValue("");
  });
});

// ─── Sending messages ─────────────────────────────────────────────────────────
describe("Sending messages", () => {
  it("send button is disabled when input is empty", () => {
    render(<ChatPage />);
    const sendBtn = screen.getByTitle("Send");
    expect(sendBtn).toBeDisabled();
  });

  it("send button becomes enabled when user types", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    const textarea = screen.getByPlaceholderText("Type your message in English…");
    await user.type(textarea, "Hello");
    expect(screen.getByTitle("Send")).not.toBeDisabled();
  });

  it("displays user message in the chat after sending", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    const textarea = screen.getByPlaceholderText("Type your message in English…");
    await user.type(textarea, "What time is it?");
    await act(async () => {
      fireEvent.click(screen.getByTitle("Send"));
    });
    expect(screen.getByText("What time is it?")).toBeInTheDocument();
  });

  it("clears the textarea after sending", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    const textarea = screen.getByPlaceholderText("Type your message in English…");
    await user.type(textarea, "Hello");
    await act(async () => {
      fireEvent.click(screen.getByTitle("Send"));
    });
    expect(textarea).toHaveValue("");
  });

  it("displays the assistant reply after a successful API call", async () => {
    mockFetchReply("Sure, let me help you with that!");
    const user = userEvent.setup();
    render(<ChatPage />);
    const textarea = screen.getByPlaceholderText("Type your message in English…");
    await user.type(textarea, "Help me");
    await act(async () => {
      fireEvent.click(screen.getByTitle("Send"));
    });
    await waitFor(() => {
      expect(
        screen.getByText("Sure, let me help you with that!")
      ).toBeInTheDocument();
    });
  });

  it("sends message on Enter key press", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    const textarea = screen.getByPlaceholderText("Type your message in English…");
    await user.type(textarea, "Hello{Enter}");
    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });
  });

  it("does not send message on Shift+Enter (inserts newline)", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    const textarea = screen.getByPlaceholderText("Type your message in English…");
    await user.type(textarea, "Line one{Shift>}{Enter}{/Shift}");
    // Message should NOT have been sent (fetch not called with user message)
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows a connection error message when fetch throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    const user = userEvent.setup();
    render(<ChatPage />);
    const textarea = screen.getByPlaceholderText("Type your message in English…");
    await user.type(textarea, "Hello");
    await act(async () => {
      fireEvent.click(screen.getByTitle("Send"));
    });
    await waitFor(() => {
      expect(
        screen.getByText("Connection error. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("does not send an empty or whitespace-only message", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    const textarea = screen.getByPlaceholderText("Type your message in English…");
    await user.type(textarea, "   ");
    await act(async () => {
      fireEvent.click(screen.getByTitle("Send"));
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ─── MessageBubble appearance ─────────────────────────────────────────────────
describe("MessageBubble", () => {
  it("shows 'AI' avatar for assistant messages", () => {
    render(<ChatPage />);
    // The greeting is an assistant message; the AI avatar should be present
    const avatars = screen.getAllByText("AI");
    expect(avatars.length).toBeGreaterThan(0);
  });

  it("shows 'You' avatar for user messages after sending", async () => {
    const user = userEvent.setup();
    render(<ChatPage />);
    const textarea = screen.getByPlaceholderText("Type your message in English…");
    await user.type(textarea, "Hey!");
    await act(async () => {
      fireEvent.click(screen.getByTitle("Send"));
    });
    await waitFor(() => {
      expect(screen.getByText("You")).toBeInTheDocument();
    });
  });

  it("shows Listen button on assistant message hover area", async () => {
    render(<ChatPage />);
    // The greeting message should have a Listen button
    await waitFor(() => {
      expect(screen.getByTitle("Listen")).toBeInTheDocument();
    });
  });

  it("calls speak when Listen button is clicked", async () => {
    const { speak } = await import("@/lib/speech");
    render(<ChatPage />);
    await waitFor(() => {
      const listenBtn = screen.getByTitle("Listen");
      fireEvent.click(listenBtn);
    });
    expect(speak).toHaveBeenCalled();
  });
});
