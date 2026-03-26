'use client';

import { useState } from 'react';
import { useInsightSummary } from '@/hooks/use-expenses';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';

const INITIAL_SUGGESTIONS = [
  'What did I spend the most on this month?',
  'How does this month compare to last?',
  'Where can I cut costs?',
];

export default function InsightsPage() {
  const { data: summaryData } = useInsightSummary();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);

  const summary = summaryData?.data;

  const askQuestion = async (question: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);
    setSuggestions([]); // Clear while loading
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
      // Update suggestions from AI response, or fallback to defaults
      if (response.data.suggestedQuestions?.length) {
        setSuggestions(response.data.suggestedQuestions);
      } else {
        // Generate contextual follow-ups based on the question
        setSuggestions(generateFollowUps(question));
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }]);
      setSuggestions(INITIAL_SUGGESTIONS);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      <h1 className="text-xl font-bold text-gray-900">AI Insights</h1>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center">
            <p className="text-xs text-gray-500">This Month</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(summary.currentMonth.total)}</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-xs text-gray-500">Last Month</p>
            <p className="mt-1 text-2xl font-bold text-gray-500">{formatCurrency(summary.previousMonth.total)}</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-xs text-gray-500">Change</p>
            <p className={`mt-1 text-2xl font-bold ${summary.changePercent >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {summary.changePercent >= 0 ? '+' : ''}{summary.changePercent}%
            </p>
          </div>
        </div>
      )}

      {/* Chat */}
      <div className="card-elevated">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Ask about your spending</h2>

        {/* Messages */}
        <div className="mb-4 max-h-80 space-y-3 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'ml-8 bg-primary/10 text-gray-900'
                  : 'mr-8 bg-gray-50 text-gray-700'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="mr-8 rounded-lg bg-gray-50 px-3 py-2">
              <span className="loading loading-dots loading-xs" />
            </div>
          )}
        </div>

        {/* Suggestions — always shown when available */}
        {suggestions.length > 0 && !isLoading && (
          <div className="mb-3 flex flex-wrap gap-2">
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
        )}

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (input.trim()) askQuestion(input.trim()); }}
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
          <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
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
