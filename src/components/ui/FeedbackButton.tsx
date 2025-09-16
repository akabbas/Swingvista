'use client';

export default function FeedbackButton() {
  return (
    <button 
      onClick={() => {
        const feedback = prompt('What can we improve?');
        if (feedback) {
          fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback, timestamp: new Date().toISOString() })
          }).catch(() => {});
        }
      }}
      className="fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      aria-label="Send feedback"
    >
      💬 Feedback
    </button>
  );
}


