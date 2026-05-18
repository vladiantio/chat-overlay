import { useState } from "react";

import type { Platform } from "@/types/chat";

import { cn } from "@/utils/cn";

import { TwitchIcon, YouTubeIcon } from "./chat";

export function Setup() {
  const [inputTwitch, setInputTwitch] = useState("");
  const [inputYouTube, setInputYouTube] = useState("");
  const [inputYouTubeKey, setInputYouTubeKey] = useState("");
  const [activeTab, setActiveTab] = useState<Platform>("twitch");

  const handleSetup = (e: React.SubmitEvent) => {
    e.preventDefault();
    const newUrlParams = new URLSearchParams();

    if (inputTwitch.trim()) {
      newUrlParams.set("twitch", inputTwitch.trim());
    }
    if (inputYouTube.trim()) {
      newUrlParams.set("youtube", inputYouTube.trim());
    }
    if (inputYouTubeKey.trim()) {
      newUrlParams.set("youtubeKey", inputYouTubeKey.trim());
    }

    window.location.href = `/?${newUrlParams.toString()}`;
  };

  // Show setup screen if no channels configured
  return (
    <div className="m-auto flex h-auto max-w-[500px] flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-neutral-900/85 p-10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-[20px]">
      <h2 className="m-0 bg-linear-to-br from-purple-500 via-pink-500 to-red-500 bg-clip-text text-[1.8rem] font-semibold text-transparent">
        Multi-Stream Chat Overlay
      </h2>
      <p className="-mt-2 text-center text-sm text-white/60">
        Connect to Twitch, YouTube, or both simultaneously
      </p>

      {/* Platform Tabs */}
      <div className="flex w-full gap-2 rounded-xl bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("twitch")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeTab === "twitch"
              ? "bg-purple-600 text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white",
          )}
        >
          <TwitchIcon />
          Twitch
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("youtube")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeTab === "youtube"
              ? "bg-red-600 text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white",
          )}
        >
          <YouTubeIcon />
          YouTube
        </button>
      </div>

      <form onSubmit={handleSetup} className="flex w-full flex-col gap-4">
        {activeTab === "twitch" ? (
          <input
            type="text"
            placeholder="Enter Twitch Channel (e.g., shroud)"
            value={inputTwitch}
            onChange={(e) => setInputTwitch(e.target.value)}
            autoFocus
            className="font-inherit box-border w-full rounded-xl border border-white/20 bg-white/5 px-5 py-[14px] text-base text-white transition-all duration-300 ease-in-out outline-none focus:border-purple-500 focus:bg-white/10 focus:ring-[3px] focus:ring-purple-500/25"
          />
        ) : (
          <>
            <input
              type="text"
              placeholder="YouTube Channel ID (UC...) or URL"
              value={inputYouTube}
              onChange={(e) => setInputYouTube(e.target.value)}
              autoFocus
              className="font-inherit box-border w-full rounded-xl border border-white/20 bg-white/5 px-5 py-[14px] text-base text-white transition-all duration-300 ease-in-out outline-none focus:border-red-500 focus:bg-white/10 focus:ring-[3px] focus:ring-red-500/25"
            />
            <input
              type="password"
              placeholder="YouTube Data API Key"
              value={inputYouTubeKey}
              onChange={(e) => setInputYouTubeKey(e.target.value)}
              className="font-inherit box-border w-full rounded-xl border border-white/20 bg-white/5 px-5 py-[14px] text-base text-white transition-all duration-300 ease-in-out outline-none focus:border-red-500 focus:bg-white/10 focus:ring-[3px] focus:ring-red-500/25"
            />
            <p className="text-xs text-white/40">
              You can also configure YouTube via environment variables.
              <a
                href="https://developers.google.com/youtube/registering_an_application"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-red-400 hover:underline"
              >
                Get API Key →
              </a>
            </p>
          </>
        )}

        <button
          type="submit"
          disabled={
            activeTab === "twitch"
              ? !inputTwitch.trim()
              : !inputYouTube.trim() || !inputYouTubeKey.trim()
          }
          className={cn(
            "font-inherit w-full cursor-pointer rounded-xl border-none px-5 py-[14px] text-[1.1rem] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:-translate-y-[2px] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
            activeTab === "twitch"
              ? "bg-linear-to-br from-purple-500 to-pink-500 hover:shadow-[0_8px_20px_rgba(168,85,247,0.4)]"
              : "bg-linear-to-br from-red-500 to-red-600 hover:shadow-[0_8px_20px_rgba(239,68,68,0.4)]",
          )}
        >
          {activeTab === "twitch" ? "Connect to Twitch" : "Connect to YouTube"}
        </button>

        {(inputTwitch || inputYouTube) && (
          <p className="text-center text-xs text-white/40">
            You can add both platforms by including both parameters in the URL
          </p>
        )}
      </form>
    </div>
  );
}
