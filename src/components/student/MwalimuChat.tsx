import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Sparkles, Loader2 } from 'lucide-react';
import { mwalimuChat } from '../../services/mwalimuService';
import { ChatMessage } from '../../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MwalimuChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const aiResponse = await mwalimuChat(input, history);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponse || "Samahani, I'm having trouble thinking right now. Let's try again.",
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-black/5">
      {/* Header */}
      <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-bold">Mwalimu AI</h2>
            <p className="text-xs text-emerald-100">Your Socratic CBC Tutor</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs">
          <Sparkles size={14} className="text-yellow-300" />
          <span>Inquiry Mode Active</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-emerald-600" />
            <p className="max-w-xs">
              "Jambo! I am Mwalimu AI. What are we exploring today in our learning journey?"
            </p>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg h-fit",
                msg.role === 'user' ? "bg-emerald-100 text-emerald-700" : "bg-white shadow-sm border border-black/5 text-slate-700"
              )}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={cn(
                "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-emerald-600 text-white rounded-tr-none" 
                  : "bg-white shadow-sm border border-black/5 rounded-tl-none"
              )}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="p-2 bg-white shadow-sm border border-black/5 rounded-lg h-fit">
              <Bot size={20} className="text-emerald-600 animate-pulse" />
            </div>
            <div className="bg-white shadow-sm border border-black/5 p-4 rounded-2xl rounded-tl-none">
              <Loader2 size={20} className="animate-spin text-emerald-600" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-black/5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Mwalimu something..."
            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-xl transition-all outline-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors rounded-lg"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
