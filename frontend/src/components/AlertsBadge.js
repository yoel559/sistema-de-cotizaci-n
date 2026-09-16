import React from 'react';
import { useQuery } from 'react-query';
import { alertsAPI } from '../services/api';
import { FiBell } from 'react-icons/fi';

const AlertsBadge = ({ className = '' }) => {
  const { data: alertsCount, isLoading } = useQuery(
    'alertsCount',
    () => alertsAPI.getCount(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider data stale after 10 seconds
    }
  );

  const pendingCount = alertsCount?.pending || 0;
  const highPriorityCount = alertsCount?.high_priority || 0;

  if (isLoading) {
    return (
      <div className={`btn btn-ghost btn-circle ${className}`}>
        <FiBell className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div className={`indicator ${className}`}>
      {pendingCount > 0 && (
        <span className={`indicator-item badge ${
          highPriorityCount > 0 ? 'badge-error' : 'badge-warning'
        }`}>
          {pendingCount}
        </span>
      )}
      <button className="btn btn-ghost btn-circle">
        <FiBell className="w-5 h-5" />
      </button>
    </div>
  );
};

export default AlertsBadge;
