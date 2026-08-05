import { useEffect, useMemo, useRef, useState } from "react";

import { ChatSection } from "@/features/chat/chat-section";

import { Snippet } from "./snippet";

export function Setup() {
  const [inputTwitch, setInputTwitch] = useState("");
  const [previewTwitch, setPreviewTwitch] = useState("");
  const chatSectionRef = useRef<HTMLDivElement>(null);

  const url = useMemo(() => {
    if (!inputTwitch) return;
    const newUrlParams = new URLSearchParams();

    if (inputTwitch.trim()) {
      newUrlParams.set("twitch", inputTwitch.trim());
    }

    return `${location.href}?${newUrlParams.toString()}`;
  }, [inputTwitch]);

  const handleSetup = (e: React.SubmitEvent) => {
    e.preventDefault();
    setPreviewTwitch(inputTwitch.trim());
  };

  useEffect(() => {
    if (chatSectionRef.current)
      chatSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, [previewTwitch]);

  // Show setup screen if no channels configured
  return (
    <div className="setup">
      <div className="setup-card">
        <h2 className="setup-title">Chat Overlay</h2>

        <form onSubmit={handleSetup} className="setup-form">
          <div className="setup-field">
            <label htmlFor="twitchChannel" className="setup-label">
              Twitch Channel
            </label>
            <input
              type="text"
              placeholder="Enter Twitch Channel (e.g., vladiantio)"
              value={inputTwitch}
              onChange={(e) => setInputTwitch(e.target.value)}
              autoFocus
              required
              className="setup-input"
            />
          </div>

          <div className="setup-field">
            <label className="setup-label">Overlay URL</label>
            <Snippet
              text={url}
              title="Copy Overlay URL"
              placeholder={location.href}
            />
          </div>

          <button
            type="submit"
            disabled={!inputTwitch.trim()}
            className="setup-button"
          >
            Preview
          </button>
        </form>
      </div>
      <div ref={chatSectionRef} className="setup-card setup-card--center">
        {previewTwitch ? (
          <ChatSection
            className="setup-preview"
            twitchChannel={previewTwitch}
            youtubeChannel=""
            youtubeApiKey=""
            fadeSeconds={0}
            ignoredUsers={[]}
            notificationSound={false}
            chatAlignment="left"
            showPlatform={false}
          />
        ) : (
          <p className="setup-hint">
            Enter a Twitch channel and click "Preview" to see the chat overlay.
          </p>
        )}
      </div>
    </div>
  );
}
