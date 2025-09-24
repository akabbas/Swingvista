'use client';

import useRenderCounter from '@/hooks/useRenderCounter';

export const RenderLoopTest = () => {
  const { renderCount } = useRenderCounter('RenderLoopTest', {
    emergencyThreshold: 10,
    enableLogging: true
  });

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
      <h3 className="font-bold">Render Loop Test</h3>
      <p>Render count: {renderCount}</p>
      <button 
        onClick={() => console.log('Test button clicked')}
        className="px-3 py-1 bg-blue-500 text-white rounded mt-2"
      >
        Test Button
      </button>
    </div>
  );
};
