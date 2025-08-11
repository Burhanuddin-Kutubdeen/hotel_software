import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  progress?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  progress 
}) => {
  return (
    <div className="text-center py-12">
      <div className="inline-flex flex-col items-center gap-4 text-slate-600">
        <Sparkles className="h-8 w-8 animate-spin text-teal-500" />
        <div className="text-lg font-medium">{message}</div>
        {progress !== undefined && (
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};