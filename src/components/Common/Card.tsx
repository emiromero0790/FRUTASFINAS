import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function Card({ title, children, className = '', actions }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base lg:text-lg font-semibold text-white">{title}</h2>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </div>
      <div className="p-4 lg:p-6">
        {children}
      </div>
    </div>
  );
}