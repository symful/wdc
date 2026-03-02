import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'card';
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const baseSize = variant === 'text' ? 'h-4 w-full' : 
                   variant === 'circle' ? 'h-12 w-12 rounded-full' :
                   variant === 'card' ? 'h-64 w-full rounded-[2.5rem]' :
                   'h-full w-full';

  return (
    <div 
      className={`
        animate-pulse bg-white/5 border border-white/5
        ${variant === 'rect' ? 'rounded-2xl' : ''}
        ${variant === 'text' ? 'rounded-md' : ''}
        ${baseSize}
        ${className}
      `}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2 w-1/3">
          <Skeleton variant="text" className="h-10" />
          <Skeleton variant="text" className="h-4 w-3/4" />
        </div>
        <Skeleton className="w-48 h-16 rounded-3xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2 w-1/3">
          <Skeleton variant="text" className="h-10" />
          <Skeleton variant="text" className="h-4 w-3/4" />
        </div>
        <Skeleton className="w-40 h-14 rounded-2xl" />
      </div>
      <div className="flex gap-6 h-[600px]">
        <Skeleton variant="rect" className="flex-1 rounded-[2.5rem]" />
        <Skeleton variant="rect" className="flex-1 rounded-[2.5rem]" />
        <Skeleton variant="rect" className="flex-1 rounded-[2.5rem]" />
      </div>
    </div>
  );
}

export function ScheduleSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <Skeleton variant="text" className="h-10 w-1/4" />
        <div className="flex gap-4">
          <Skeleton className="w-32 h-12 rounded-2xl" />
          <Skeleton className="w-32 h-12 rounded-2xl" />
        </div>
      </div>
      <Skeleton variant="rect" className="flex-1 min-h-[500px] rounded-[2.5rem]" />
    </div>
  );
}
