import React, { useState, useRef, useEffect } from "react";
import { ChatMsg } from "../../network/GameClient";
import { MessageSquare, Send, Bell } from "lucide-react";

interface ChatWidgetProps {
  messages: ChatMsg[];
  onSendMessage: (text: string, channel: "GLOBAL" | "PARTY") => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ messages, onSendMessage }) => {
  const [inputText, setInputText] = useState("");
  const [activeChannel, setActiveChannel] = useState<"GLOBAL" | "PARTY">("GLOBAL");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), activeChannel);
    setInputText("");
  };

  return (
    <div className="glass-panel w-96 flex flex-col pointer-events-auto transition-all duration-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-2.5 border-b border-slate-700/60 bg-slate-900/40 rounded-t-xl">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <div className="flex gap-1">
            <button
              onClick={() => setActiveChannel("GLOBAL")}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                activeChannel === "GLOBAL"
                  ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Realm
            </button>
            <button
              onClick={() => setActiveChannel("PARTY")}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                activeChannel === "PARTY"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Party
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[11px] text-slate-400 hover:text-slate-200 font-mono px-2 py-0.5"
        >
          {isCollapsed ? "▲ Open" : "▼ Hide"}
        </button>
      </div>

      {/* Messages Feed */}
      {!isCollapsed && (
        <>
          <div className="h-44 overflow-y-auto p-3 flex flex-col gap-2 font-sans text-xs">
            {messages.map((msg) => {
              const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              if (msg.channel === "SYSTEM") {
                return (
                  <div key={msg.id} className="flex items-start gap-1.5 text-amber-400/90 italic text-[11px]">
                    <Bell className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-400" />
                    <span>
                      <strong className="text-amber-300 font-medium">[Chronicle]</strong> {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">{timeStr}</span>
                  <span
                    className={`font-semibold flex-shrink-0 ${
                      msg.channel === "PARTY" ? "text-cyan-400" : "text-amber-300"
                    }`}
                  >
                    {msg.senderName}:
                  </span>
                  <span className="text-slate-200 break-words">{msg.content}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSubmit} className="p-2 border-t border-slate-700/60 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeChannel.toLowerCase()}...`}
              className="flex-1 bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 font-sans"
            />
            <button
              type="submit"
              className="fantasy-btn py-1 px-3 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
