import React from 'react';
import { Feature } from '../types/types';
import { useTheme } from 'next-themes';

interface FeatureCardProps {
  feature: Feature;
  inView: boolean;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, inView, index }) => {
  const Icon = feature.icon;
  const { theme } = useTheme();

    return (
        <div
        className={`relative rounded-xl p-6 h-full overflow-hidden group
            transition-all duration-500 ease-in-out
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            ${theme === 'dark' ? 'bg-gray-900/20' : 'bg-white/80 border border-gray-200/60'}
            shadow-lg hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-violet-500/10 transform hover:-translate-y-2
        `}
        style={{ transitionDelay: `${index * 100}ms` }}
        >
        <div className="flex flex-col items-center text-center">
            <div className={`mb-5 p-4 rounded-full bg-gradient-to-br transition-colors duration-300
            ${theme === 'dark' 
                ? 'from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30' 
                : 'from-violet-100 to-pink-100 group-hover:from-violet-200 group-hover:to-pink-200'
            }`
            }>
            <Icon className={`w-8 h-8 transition-colors duration-300 ${theme === 'dark' ? 'text-purple-300' : 'text-violet-600'}`} />
            </div>
            <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{feature.description}</p>
        </div>
        </div>
    );
};

export default FeatureCard;