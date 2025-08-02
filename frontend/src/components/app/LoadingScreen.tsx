'use client';

import React from 'react';
import Spinner from '@/app/Spinner';

type LoadingScreenProps = {
  message?: string;
  fullScreen?: boolean;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  fullScreen = true 
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center ${fullScreen ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm' : 'py-12'}`}
    >
      <div className="flex flex-col items-center space-y-4">
        <Spinner size="lg" />
        <p className="text-lg font-medium text-foreground/80">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;