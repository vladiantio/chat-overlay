import { useState, useRef } from 'react';
import { useTwitchChat } from './hooks/useTwitchChat';
import { useAutoScroll } from './hooks/useAutoScroll';
import { cn } from './utils/cn';

const CHANNEL = import.meta.env.VITE_CHANNEL;
const FADE = import.meta.env.VITE_FADE;
const IGNORE_USERS = import.meta.env.VITE_IGNORE_USERS
const NOTIFICATION_SOUND = import.meta.env.VITE_NOTIFICATION_SOUND
const CHAT_ALIGNMENT = import.meta.env.VITE_CHAT_ALIGNMENT

function App() {
  const channel = new URLSearchParams(window.location.search).get('channel')?.toLowerCase() || CHANNEL;
  const fade = Number(new URLSearchParams(window.location.search).get('fade')) || FADE;
  const ignoreParam = new URLSearchParams(window.location.search).get('ignore') || IGNORE_USERS;
  const notificationSound = Boolean(Number(new URLSearchParams(window.location.search).get('notificationSound')) || NOTIFICATION_SOUND);
  const chatAlignment = new URLSearchParams(window.location.search).get('chatAlignment') || CHAT_ALIGNMENT;
  const ignoredUsers = ignoreParam ? ignoreParam.split(',').map(u => u.trim().toLowerCase()) : [];

  const [inputChannel, setInputChannel] = useState('');
  
  const { messages } = useTwitchChat(channel, fade, ignoredUsers, notificationSound);
  
  // Handle auto-scroll to bottom of chat
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useAutoScroll(chatContainerRef, [messages]);

  const handleSetup = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (inputChannel.trim()) {
      // Redirect to the same page with the channel param, which is standard for OBS browser sources setup
      const urlParams = new URLSearchParams();
      urlParams.set('channel', inputChannel.trim());
      urlParams.set('fade', fade.toString());
      urlParams.set('ignore', ignoreParam);
      urlParams.set('notificationSound', notificationSound ? '1' : '0');
      window.location.href = `/?${urlParams.toString()}`;
    }
  };

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center h-auto gap-4 bg-neutral-900/85 rounded-3xl p-10 backdrop-blur-[20px] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] max-w-[400px] m-auto">
        <h2 className="m-0 text-[1.8rem] font-semibold bg-linear-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">Twitch Chat Overlay</h2>
        <form onSubmit={handleSetup} className="w-full flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Enter Twitch Channel..." 
            value={inputChannel}
            onChange={(e) => setInputChannel(e.target.value)}
            required
            autoFocus
            className="w-full px-5 py-[14px] rounded-xl border border-white/20 bg-white/5 text-white font-inherit text-base outline-none transition-all duration-300 ease-in-out focus:border-purple-500 focus:bg-white/10 focus:ring-[3px] focus:ring-purple-500/25 box-border"
          />
          <button type="submit" className="w-full px-5 py-[14px] rounded-xl border-none bg-linear-to-br from-purple-500 to-pink-500 text-white font-inherit font-semibold text-[1.1rem] cursor-pointer transition-[transform,box-shadow] duration-200 hover:-tranneutral-y-[2px] hover:shadow-[0_8px_20px_rgba(168,85,247,0.4)] active:tranneutral-y-0">
            Connect to Chat
          </button>
        </form>
      </div>
    );
  }

  return (
    <div 
      className="w-full max-h-dvh overflow-hidden mask-y-from-[calc(100%-var(--spacing)*4)] p-4 space-y-4 text-[1.25rem] text-shadow-md text-shadow-black/40 font-semibold leading-[1.4] wrap-break-word" 
      data-slot="chat-container"
      ref={chatContainerRef}
      style={{
        "--align": chatAlignment,
      } as React.CSSProperties}
    >
      {messages.map((msg, i) => (
        <div 
          key={msg.id}
          data-slot="chat-message"
          className="origin-bottom-left will-change-[transform,opacity] relative"
          style={{
            "--color": msg.color,
            animation: fade > 0 ? `slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, fadeOut 0.5s ease-out forwards ${fade - 0.5}s` : `slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
          } as React.CSSProperties}
        >
          {(!msg.isSamePreviousUser || i == 0) && (
            <div
              data-slot="chat-message-user"
              className="flex items-center gap-2 px-3 py-1 w-fit absolute z-10 text-[1.125rem] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              style={{
                backgroundColor: 'color-mix(in oklab, var(--color) 80%, black)',
                left: 'if(style(--align: left): 0; else: auto)',
                right: 'if(style(--align: right): 0; else: auto)',
              } as React.CSSProperties}
            >
              {msg.badges && msg.badges.length > 0 && (
                <span data-slot="chat-message-user-badges" className="flex items-center gap-1">
                  {msg.badges.map((badge, index) => (
                    <img 
                      data-slot="chat-message-badge"
                      key={`${msg.id}-badge-${index}`}
                      src={badge.url}
                      srcSet={`${badge.url.slice(0,-1)}1 1x, ${badge.url.slice(0,-1)}2 2x, ${badge.url.slice(0,-1)}3 4x`}
                      alt={badge.id}
                      title={badge.id}
                      className="size-[20px] drop-shadow-sm drop-shadow-black/50"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ))}
                </span>
              )}
              <span data-slot="chat-message-user-name" className="font-bold">{msg.username}</span>
            </div>
          )}

          <div
            data-slot="chat-message-text"
            className={cn(msg.isSamePreviousUser && i > 0 ? "-mt-2" : "pt-7", "px-2 w-fit text-pretty")}
            style={{
              marginLeft: 'if(style(--align: left): 0; else: auto)',
              marginRight: 'if(style(--align: right): 0; else: auto)',
            } as React.CSSProperties}
          >
            <div
              className="px-5 py-3 w-fit rounded-2xl shadow-[0_3px_12px_rgba(0,0,0,0.4)]"
              style={{
                backgroundColor: 'color-mix(in oklab, var(--color) 20%, var(--color-neutral-900))',
              } as React.CSSProperties}
            >
              {msg.parts.map((part, index) => {
                if (part.type === 'emote') {
                  return (
                    <img
                      data-slot="chat-message-text-emote"
                      key={index}
                      src={`https://static-cdn.jtvnw.net/emoticons/v2/${part.id}/default/dark/1.0`}
                      srcSet={`https://static-cdn.jtvnw.net/emoticons/v2/${part.id}/default/dark/1.0 1x, https://static-cdn.jtvnw.net/emoticons/v2/${part.id}/default/dark/2.0 2x, https://static-cdn.jtvnw.net/emoticons/v2/${part.id}/default/dark/3.0 4x`}
                      alt={part.name}
                      title={part.name}
                      className="inline-block align-middle -mt-1 px-[2px] h-[28px] drop-shadow-md drop-shadow-black/50"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  );
                }
                return <span data-slot="chat-message-text-part" key={index}>{part.content}</span>;
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
