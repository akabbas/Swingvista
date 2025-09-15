'use client';

export default function LoadingState() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[9999] flex items-center justify-center">
      <div className="animate-pulse text-primary-600 text-xl font-semibold">
        Loading SwingVista...
      </div>
    </div>
  );
}
