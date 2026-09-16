import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const KPIStat = ({ title, value, change, changeType = 'neutral', icon: Icon, color = 'primary' }) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive': return <FiTrendingUp className="w-4 h-4 text-success" />;
      case 'negative': return <FiTrendingDown className="w-4 h-4 text-error" />;
      default: return <FiMinus className="w-4 h-4 text-base-content/60" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-success';
      case 'negative': return 'text-error';
      default: return 'text-base-content/60';
    }
  };

  return (
    <div className="stat bg-base-100 shadow-lg rounded-lg">
      <div className="stat-figure">
        <Icon className={`w-8 h-8 text-${color}`} />
      </div>
      <div className="stat-title text-base-content/60">{title}</div>
      <div className="stat-value text-base-content">{value}</div>
      {change !== undefined && (
        <div className={`stat-desc flex items-center gap-1 ${getChangeColor()}`}>
          {getChangeIcon()}
          <span>{change}%</span>
        </div>
      )}
    </div>
  );
};

export default KPIStat;
