import React from 'react';
import { FiFilter, FiSearch, FiGrid, FiList } from 'react-icons/fi';

const SectionHeader = ({ 
  title, 
  subtitle, 
  count, 
  showFilters = false, 
  viewMode = 'grid',
  onViewModeChange,
  onSearch,
  onFilter,
  children 
}) => {
  return (
    <div className="mb-6">
      {/* Title and Count */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-base-content">{title}</h2>
          {subtitle && (
            <p className="text-base-content/60 mt-1">{subtitle}</p>
          )}
        </div>
        {count !== undefined && (
          <div className="badge badge-primary badge-lg">
            {count} resultados
          </div>
        )}
      </div>

      {/* Filters and Search */}
      {showFilters && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-base-200 rounded-lg">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar..."
                className="input input-bordered w-full pl-10"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="btn-group">
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-active' : ''}`}
              onClick={() => onViewModeChange?.('grid')}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-active' : ''}`}
              onClick={() => onViewModeChange?.('list')}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Button */}
          <button className="btn btn-outline btn-sm" onClick={onFilter}>
            <FiFilter className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>
      )}

      {/* Additional Content */}
      {children}
    </div>
  );
};

export default SectionHeader;
