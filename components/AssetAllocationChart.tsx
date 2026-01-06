
import React from 'react';
import { AssetAllocation } from '../types';

interface AssetAllocationChartProps {
    data: AssetAllocation[];
}

const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({ data }) => {
    let cumulativePercentage = 0;

    const generateSlices = () => {
        return data.map((item, index) => {
            const startAngle = (cumulativePercentage / 100) * 360;
            const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360;
            cumulativePercentage += item.percentage;

            const radius = 45;
            const centerX = 50;
            const centerY = 50;

            const x1 = centerX + radius * Math.cos((startAngle - 90) * (Math.PI / 180));
            const y1 = centerY + radius * Math.sin((startAngle - 90) * (Math.PI / 180));
            const x2 = centerX + radius * Math.cos((endAngle - 90) * (Math.PI / 180));
            const y2 = centerY + radius * Math.sin((endAngle - 90) * (Math.PI / 180));

            const largeArcFlag = item.percentage > 50 ? 1 : 0;

            return (
                <path
                    key={index}
                    d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={item.color}
                    className="transition-all duration-500 hover:scale-[1.02] origin-center cursor-default opacity-80 hover:opacity-100"
                >
                    <title>{`${item.label}: ${item.percentage}%`}</title>
                </path>
            );
        });
    };

    return (
        <div className="flex flex-col items-center w-full gap-8">
            <div className="relative w-48 h-48 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {generateSlices()}
                    {/* Inner hole for Donut effect */}
                    <circle cx="50" cy="50" r="32" className="fill-[#090e1a]" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">ALLOCATION</span>
                </div>
            </div>

            <div className="w-full space-y-4 px-4">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-3 h-3 rounded shadow-lg"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[11px] text-slate-400 font-bold group-hover:text-white transition-colors uppercase tracking-widest">
                                {item.label}
                            </span>
                        </div>
                        <span className="text-[11px] font-black text-white mono">
                            {item.percentage}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AssetAllocationChart;
