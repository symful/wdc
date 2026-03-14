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
        animate-pulse bg-neon-cyan/[0.04] border border-neon-cyan/[0.06]
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
      {/* Loading indicator */}
      <div className="flex items-center gap-3 text-neon-cyan/30">
        <div className="w-2 h-2 rounded-full bg-neon-cyan/40 animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.3)]"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] font-display animate-pulse">Loading Command Center...</span>
      </div>
      
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
      <div className="flex items-center gap-3 text-neon-cyan/30">
        <div className="w-2 h-2 rounded-full bg-neon-cyan/40 animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.3)]"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] font-display animate-pulse">Loading Quest Board...</span>
      </div>
      
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
      <div className="flex items-center gap-3 text-neon-cyan/30">
        <div className="w-2 h-2 rounded-full bg-neon-cyan/40 animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.3)]"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] font-display animate-pulse">Loading Mission Timeline...</span>
      </div>
      
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
