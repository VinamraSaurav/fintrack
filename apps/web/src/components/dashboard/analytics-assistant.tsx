'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';

const INITIAL_SUGGESTIONS = [
  'What did I spend the most on this month?',
  'How does this month compare to last?',
  'Where can I cut costs?',
];

export function AnalyticsAssistant() {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);

  const askQuestion = async (question: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      const token = await getToken();
      const response = await apiClient<{
        data: { answer: string; suggestedQuestions?: string[] };
      }>('/api/insights/ask', {
        method: 'POST',
        body: JSON.stringify({ question }),
        token: token ?? undefined,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.answer }]);

      if (response.data.suggestedQuestions?.length) {
        setSuggestions(response.data.suggestedQuestions);
      } else {
        setSuggestions(generateFollowUps(question));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Try again.' },
      ]);
      setSuggestions(INITIAL_SUGGESTIONS);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-elevated">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="section-badge">Ask AI</span>
          <h2 className="mt-3 text-lg font-semibold text-slate-900">Talk through the patterns</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use the analytics above, then ask follow-up questions about shifts, spikes, and
            savings opportunities.
          </p>
        </div>
      </div>

      <div className="mb-4 max-h-80 space-y-3 overflow-y-auto">
        {messages.length === 0 && !isLoading ? (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-500">
            Ask about categories, recent changes, recurring spends, or cost-cutting ideas.
          </div>
        ) : null}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-[20px] px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'ml-8 bg-primary/10 text-slate-900'
                : 'mr-8 bg-slate-50 text-slate-700'
            }`}
          >
            {msg.content}
          </div>
        ))}

        {isLoading ? (
          <div className="mr-8 rounded-[20px] bg-slate-50 px-4 py-3">
            <span className="loading loading-dots loading-xs" />
          </div>
        ) : null}
      </div>

      {suggestions.length > 0 && !isLoading ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestions.map((q) => (
            <button
              key={q}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-primary hover:text-primary"
              onClick={() => askQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) askQuestion(input.trim());
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          className="input-clean flex-1"
          placeholder="Ask anything about your finances..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

function generateFollowUps(lastQuestion: string): string[] {
  const lower = lastQuestion.toLowerCase();

  if (lower.includes('category') || lower.includes('most')) {
    return [
      'Show me a weekly breakdown of this category',
      'How has this category changed over 3 months?',
      'What specific items cost the most?',
    ];
  }

  if (lower.includes('compare') || lower.includes('month')) {
    return [
      'Which categories increased the most?',
      'What new expenses appeared this month?',
      'Show me a daily spending pattern',
    ];
  }

  if (lower.includes('cut') || lower.includes('save') || lower.includes('reduce')) {
    return [
      'Which expenses are recurring?',
      'What are my top 5 most frequent purchases?',
      'How much do I spend on non-essentials?',
    ];
  }

  return [
    'What is my average daily spend?',
    'Which day of the week do I spend the most?',
    'Summarize my top 3 expense categories',
  ];
}
