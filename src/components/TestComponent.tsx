import React from 'react';

export const TestComponent: React.FC = () => {
  return (
    <div className="p-4 m-4 bg-blue-500 text-white rounded-lg">
      <h1 className="text-2xl font-bold">Test Component</h1>
      <p className="mt-2">This is a test component to verify if Tailwind CSS is working correctly.</p>
      <button className="mt-4 px-4 py-2 bg-white text-blue-500 rounded hover:bg-blue-100">
        Test Button
      </button>
    </div>
  );
};
