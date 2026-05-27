import { useMemo, useState } from "react";

import { ChatSection } from "@/features/chat/chat-section";
import { cn } from "@/utils/cn";

import { Snippet } from "./snippet";

export function Setup() {
  const [inputTwitch, setInputTwitch] = useState("");
  const [previewTwitch, setPreviewTwitch] = useState("");

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

  // Show setup screen if no channels configured
  return (
    <div className="container mx-auto grid min-h-dvh grid-cols-1 items-stretch justify-center gap-6 p-6 md:grid-cols-2">
      <div className="flex flex-col items-start justify-center gap-4 rounded-3xl border bg-neutral-900 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <h2 className="mb-4 text-2xl font-bold">Chat Overlay</h2>

        <form onSubmit={handleSetup} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="twitchChannel" className="text-sm text-white/80">Twitch Channel</label>
            <input
              type="text"
              placeholder="Enter Twitch Channel (e.g., vladiantio)"
              value={inputTwitch}
              onChange={(e) => setInputTwitch(e.target.value)}
              autoFocus
              required
              className="font-inherit box-border w-full rounded-xl border border-white/20 bg-white/5 px-5 py-[14px] text-base text-white transition-all duration-300 ease-in-out outline-none focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-white/80">Overlay URL</label>
            <Snippet text={url} title="Copy Overlay URL" placeholder={location.href} />
          </div>

          <button
            type="submit"
            disabled={!inputTwitch.trim()}
            className={cn(
              "w-full cursor-pointer rounded-xl bg-purple-800 px-5 py-[14px] font-semibold text-white transition-[translate,box-shadow] duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(168,85,247,0.4)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
            )}
          >
            Preview
          </button>
        </form>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border bg-neutral-900 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        {previewTwitch ? (
          <ChatSection
            className="h-[calc(100dvh-var(--spacing)*28)] w-full"
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
          <p className="text-center">
            Enter a Twitch channel and click "Preview" to see the chat overlay.
          </p>
        )}
      </div>
    </div>
  );
}
