'use client';

import { Maximize2, Send } from 'lucide-react';
import { useState } from 'react';

interface ChatMessage {
  id: number;
  sender?: { name: string; initial: string; color: string };
  text: string;
  outgoing: boolean;
}

const MESSAGES: ChatMessage[] = [
  { id: 1, sender: { name: 'Alex', initial: 'A', color: 'bg-success' }, text: "I'm a newbie", outgoing: false },
  { id: 2, sender: { name: 'Alex', initial: 'A', color: 'bg-success' }, text: 'Love this course... Hello', outgoing: false },
  { id: 3, text: 'Hey!', outgoing: true },
  { id: 4, text: 'Dope Introduction, thanks!', outgoing: true },
];

export default function QuickChat() {
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col rounded-[16px] bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[16px] text-neutral-600">
          Quick <span className="font-bold text-neutral-800">Chat</span>
        </h3>
        <button
          type="button"
          aria-label="Expand chat"
          className="flex items-center justify-center rounded-[8px] text-neutral-400 transition-colors duration-100 hover:bg-neutral-50 hover:text-neutral-700"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="mb-4 flex max-h-[220px] flex-col gap-3 overflow-y-auto">
        {MESSAGES.map((msg) =>
          msg.outgoing ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[75%] rounded-[12px] rounded-br-[4px] bg-primary-500 px-4 py-2.5 text-[13px] text-white">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex items-end gap-2">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${msg.sender?.color} text-[10px] font-bold text-white`}>
                {msg.sender?.initial}
              </div>
              <div>
                <span className="mb-0.5 block text-[10px] font-medium text-neutral-500">
                  {msg.sender?.name}
                </span>
                <div className="max-w-[75%] rounded-[12px] rounded-bl-[4px] bg-neutral-50 px-4 py-2.5 text-[13px] text-neutral-700">
                  {msg.text}
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type something"
          className="h-[40px] flex-1 rounded-full border border-neutral-150 bg-neutral-50 px-4 text-[13px] text-neutral-800 outline-none placeholder:text-neutral-400 transition-all duration-100 focus:border-primary-500 focus:bg-white focus:shadow-focus"
        />
        <button
          type="button"
          aria-label="Send message"
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition-colors duration-100 hover:bg-primary-600"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
