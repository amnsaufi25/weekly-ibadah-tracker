import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, colorClass = "bg-white" }) => {
  return (
    <div className={`${colorClass} p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center`}>
      <span className="text-slate-500 text-xs uppercase font-semibold tracking-wider">{label}</span>
      <span className="text-2xl font-bold text-slate-800 my-1">{value}</span>
      {subtext && <span className="text-xs text-slate-400">{subtext}</span>}
    </div>
  );
};
