import { useState } from "react";
import type { Platform } from "../types/chat";
import { TwitchIcon, YouTubeIcon } from "./chat";
import { cn } from "../utils/cn";

export function Setup() {
  const [inputTwitch, setInputTwitch] = useState('');
  const [inputYouTube, setInputYouTube] = useState('');
  const [inputYouTubeKey, setInputYouTubeKey] = useState('');
  const [activeTab, setActiveTab] = useState<Platform>('twitch');

  const handleSetup = (e: React.SubmitEvent) => {
    e.preventDefault();
    const newUrlParams = new URLSearchParams();
    
    if (inputTwitch.trim()) {
      newUrlParams.set('twitch', inputTwitch.trim());
    }
    if (inputYouTube.trim()) {
      newUrlParams.set('youtube', inputYouTube.trim());
    }
    if (inputYouTubeKey.trim()) {
      newUrlParams.set('youtubeKey', inputYouTubeKey.trim());
    }
    
    window.location.href = `/?${newUrlParams.toString()}`;
  };

  // Show setup screen if no channels configured
  return (
    <div className="flex flex-col items-center justify-center h-auto gap-4 bg-neutral-900/85 rounded-3xl p-10 backdrop-blur-[20px] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] max-w-[500px] m-auto">
      <h2 className="m-0 text-[1.8rem] font-semibold bg-linear-to-br from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
        Multi-Stream Chat Overlay
      </h2>
      <p className="text-white/60 text-sm text-center -mt-2">
        Connect to Twitch, YouTube, or both simultaneously
      </p>
      
      {/* Platform Tabs */}
      <div className="flex gap-2 w-full bg-white/5 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('twitch')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'twitch' 
              ? "bg-purple-600 text-white" 
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <TwitchIcon />
          Twitch
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('youtube')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'youtube' 
              ? "bg-red-600 text-white" 
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <YouTubeIcon />
          YouTube
        </button>
      </div>

      <form onSubmit={handleSetup} className="w-full flex flex-col gap-4">
        {activeTab === 'twitch' ? (
          <input 
            type="text" 
            placeholder="Enter Twitch Channel (e.g., shroud)" 
            value={inputTwitch}
            onChange={(e) => setInputTwitch(e.target.value)}
            autoFocus
            className="w-full px-5 py-[14px] rounded-xl border border-white/20 bg-white/5 text-white font-inherit text-base outline-none transition-all duration-300 ease-in-out focus:border-purple-500 focus:bg-white/10 focus:ring-[3px] focus:ring-purple-500/25 box-border"
          />
        ) : (
          <>
            <input 
              type="text" 
              placeholder="YouTube Channel ID (UC...) or URL" 
              value={inputYouTube}
              onChange={(e) => setInputYouTube(e.target.value)}
              autoFocus
              className="w-full px-5 py-[14px] rounded-xl border border-white/20 bg-white/5 text-white font-inherit text-base outline-none transition-all duration-300 ease-in-out focus:border-red-500 focus:bg-white/10 focus:ring-[3px] focus:ring-red-500/25 box-border"
            />
            <input 
              type="password" 
              placeholder="YouTube Data API Key" 
              value={inputYouTubeKey}
              onChange={(e) => setInputYouTubeKey(e.target.value)}
              className="w-full px-5 py-[14px] rounded-xl border border-white/20 bg-white/5 text-white font-inherit text-base outline-none transition-all duration-300 ease-in-out focus:border-red-500 focus:bg-white/10 focus:ring-[3px] focus:ring-red-500/25 box-border"
            />
            <p className="text-white/40 text-xs">
              You can also configure YouTube via environment variables. 
              <a 
                href="https://developers.google.com/youtube/registering_an_application" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-red-400 hover:underline ml-1"
              >
                Get API Key →
              </a>
            </p>
          </>
        )}
        
        <button 
          type="submit" 
          disabled={activeTab === 'twitch' ? !inputTwitch.trim() : (!inputYouTube.trim() || !inputYouTubeKey.trim())}
          className={cn(
            "w-full px-5 py-[14px] rounded-xl border-none text-white font-inherit font-semibold text-[1.1rem] cursor-pointer transition-[transform,box-shadow] duration-200 hover:-translate-y-[2px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
            activeTab === 'twitch'
              ? "bg-linear-to-br from-purple-500 to-pink-500 hover:shadow-[0_8px_20px_rgba(168,85,247,0.4)]"
              : "bg-linear-to-br from-red-500 to-red-600 hover:shadow-[0_8px_20px_rgba(239,68,68,0.4)]"
          )}
        >
          {activeTab === 'twitch' ? 'Connect to Twitch' : 'Connect to YouTube'}
        </button>
        
        {(inputTwitch || inputYouTube) && (
          <p className="text-white/40 text-xs text-center">
            You can add both platforms by including both parameters in the URL
          </p>
        )}
      </form>
    </div>
  );
}