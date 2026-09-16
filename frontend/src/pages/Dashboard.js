import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  FiFileText, 
  FiDollarSign, 
  FiTrendingUp, 
  FiAlertTriangle,
  FiClock,
  FiPlus,
  FiUsers,
  FiTruck,
  FiCreditCard,
  FiPackage,
  FiBarChart2
} from 'react-icons/fi';
import { quotationsAPI, reportsAPI, seedersAPI } from '../services/api';
import { useWebSocket } from '../contexts/WebSocketContext';
import LoadingSpinner from '../components/LoadingSpinner';
import QuotationCard from '../components/QuotationCard';
import SectionHeader from '../components/SectionHeader';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { messages } = useWebSocket();

  // Refrescar datos cuando lleguen notificaciones WebSocket
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // Refrescar datos relevantes según el tipo de notificación
    if (lastMessage.type === 'quotation_created' || 
        lastMessage.type === 'quotation_update' || 
        lastMessage.type === 'quotation_notification') {
      queryClient.invalidateQueries('dashboardData');
      queryClient.invalidateQueries('quotationsData');
      queryClient.invalidateQueries('pipelineData');
    }

    if (lastMessage.type === 'alert' || lastMessage.type === 'alert_notification') {
      queryClient.invalidateQueries('alertsData');
      queryClient.invalidateQueries('dashboardData');
    }

    if (lastMessage.type === 'analytics') {
      queryClient.invalidateQueries('dashboardData');
      queryClient.invalidateQueries('pipelineData');
    }
  }, [messages, queryClient]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery(
    'dashboardData',
    () => quotationsAPI.getDashboard(),
    {
      refetchInterval: 60000,
    }
  );

  // Fetch pipeline data
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery(
    'pipelineData',
    () => reportsAPI.getPipeline()
  );

  // Fetch alerts data
  const { data: alertsData, isLoading: alertsLoading } = useQuery(
    'alertsData',
    () => reportsAPI.getAlerts()
  );

  // Fetch quotations for catalog view
  const { data: quotationsData, isLoading: quotationsLoading } = useQuery(
    'quotationsData',
    () => quotationsAPI.getAll({ limit: 20 }),
    {
      refetchInterval: 30000,
    }
  );

  const isLoading = dashboardLoading || pipelineLoading || alertsLoading || quotationsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="alert alert-error">
        <FiAlertTriangle className="w-5 h-5" />
        <span>Error al cargar los datos del dashboard</span>
      </div>
    );
  }

  const {
    total_quotations = 0,
    hot_quotations = 0,
    conversion_rate = 0,
    recent_activity = []
  } = dashboardData?.data || dashboardData || {};

  const pipeline = pipelineData?.data || pipelineData || { total: 0, frio: 0, tibio: 0, caliente: 0 };
  const alerts = alertsData?.data || alertsData || { total: 0, pendientes: 0, atendidas: 0 };
  const quotations = Array.isArray(quotationsData?.data) ? quotationsData.data : (Array.isArray(quotationsData) ? quotationsData : []);
  
  // Debug: Log quotations data
  console.log('Dashboard quotations data:', quotationsData);
  console.log('Processed quotations:', quotations);

  // Filter quotations based on search
  const filteredQuotations = quotations.filter(q => {
    if (!q || typeof q !== 'object') return false;
    const numero = q.numero_cotizacion || '';
    const vehiculo = q.vehiculo || '';
    return numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
           vehiculo.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // KPI Stats
  const kpiStats = [
    {
      title: 'Total Cotizaciones',
      value: total_quotations,
      icon: FiFileText,
      color: 'primary',
      change: pipeline.total > 0 ? ((total_quotations / pipeline.total) * 100).toFixed(1) : 0,
      changeType: 'positive'
    },
    {
      title: 'Cotizaciones Calientes',
      value: hot_quotations,
      icon: FiTrendingUp,
      color: 'error',
      change: pipeline.caliente > 0 ? ((hot_quotations / pipeline.caliente) * 100).toFixed(1) : 0,
      changeType: 'positive'
    },
    {
      title: 'Alertas Pendientes',
      value: alerts.pendientes,
      icon: FiAlertTriangle,
      color: 'warning',
      change: alerts.total > 0 ? ((alerts.pendientes / alerts.total) * 100).toFixed(1) : 0,
      changeType: alerts.pendientes > 0 ? 'negative' : 'positive'
    },
    {
      title: 'Tasa Conversión',
      value: `${conversion_rate.toFixed(1)}%`,
        icon: FiBarChart2,
      color: 'success',
      change: conversion_rate > 0 ? conversion_rate.toFixed(1) : 0,
      changeType: conversion_rate > 50 ? 'positive' : 'negative'
    }
  ];

  // Quick Actions
  const quickActions = [
    { title: 'Nueva Cotización', icon: FiPlus, link: '/quotations/create', color: 'btn-primary' },
    { title: 'Ver Clientes', icon: FiUsers, link: '/clients', color: 'btn-secondary' },
    { title: 'Inventario', icon: FiTruck, link: '/inventory', color: 'btn-accent' },
    { title: 'Créditos', icon: FiCreditCard, link: '/credit', color: 'btn-info' },
    { title: 'Pagos', icon: FiDollarSign, link: '/billing', color: 'btn-success' },
    { title: 'Entregas', icon: FiPackage, link: '/deliveries', color: 'btn-warning' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient animate-fade-in-left">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-2 animate-fade-in-left" style={{ animationDelay: '0.1s' }}>
            Sistema de Trading - Resumen General
          </p>
        </div>
        <div className="flex gap-2">
          <Link 
            to="/users/create" 
            className="btn btn-outline border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300 hover:transform hover:scale-105"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Crear Usuario
          </Link>
          <button 
            className="btn btn-outline border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300 hover:transform hover:scale-105"
            onClick={() => seedersAPI.seedDemo(10)}
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Generar Demo
          </button>
          <Link to="/quotations/create" className="btn btn-modern text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-right">
            <FiPlus className="w-4 h-4 mr-2" />
            Nueva Cotización
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiStats.map((stat, index) => (
          <div
            key={index}
            className="glass-effect rounded-xl p-6 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stat.color === 'primary' ? 'gradient-primary' :
                stat.color === 'error' ? 'bg-red-500' :
                stat.color === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`badge ${
                stat.changeType === 'positive' ? 'badge-success' : 'badge-error'
              }`}>
                {stat.changeType === 'positive' ? '+' : ''}{stat.change}%
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-slate-400 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Overview */}
      <div className="glass-effect rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h3 className="text-xl font-bold text-white mb-6">Pipeline de Ventas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 hover:bg-red-500/20 transition-all duration-300 hover:transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-400">{pipeline.caliente}</div>
                <div className="text-sm text-red-300">Calientes</div>
              </div>
            </div>
            <p className="text-red-200 text-sm">Alta probabilidad de cierre</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 hover:bg-yellow-500/20 transition-all duration-300 hover:transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <FiClock className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-400">{pipeline.tibio}</div>
                <div className="text-sm text-yellow-300">Tibios</div>
              </div>
            </div>
            <p className="text-yellow-200 text-sm">Probabilidad media</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 hover:bg-blue-500/20 transition-all duration-300 hover:transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <FiAlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-400">{pipeline.frio}</div>
                <div className="text-sm text-blue-300">Fríos</div>
              </div>
            </div>
            <p className="text-blue-200 text-sm">Baja probabilidad</p>
          </div>
        </div>
      </div>

      {/* Quotations Catalog */}
      <SectionHeader
        title="Cotizaciones Recientes"
        subtitle="Últimas cotizaciones del sistema"
        count={filteredQuotations.length}
        showFilters={true}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSearch={setSearchTerm}
      />

      {filteredQuotations.length > 0 ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredQuotations.map((quotation) => (
            <QuotationCard
              key={quotation.id_cotizacion}
              quotation={quotation}
              showActions={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FiFileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-base-content/60 mb-2">
            No hay cotizaciones
          </h3>
          <p className="text-base-content/40 mb-4">
            Comienza creando tu primera cotización
          </p>
          <Link to="/quotations/create" className="btn btn-primary">
            <FiPlus className="w-4 h-4 mr-2" />
            Crear Cotización
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-effect rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <h3 className="text-xl font-bold text-white mb-6">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="group flex flex-col items-center gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg"
            >
              <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center group-hover:animate-glow">
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-center text-slate-300 group-hover:text-white transition-colors duration-300">
                {action.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recent_activity.length > 0 && (
        <div className="glass-effect rounded-xl p-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <h3 className="text-xl font-bold text-white mb-6">Actividad Reciente</h3>
          <div className="space-y-4">
            {recent_activity.slice(0, 5).map((activity, index) => (
              <div 
                key={activity.id} 
                className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 transition-all duration-300 hover:transform hover:scale-102"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div>
                  <p className="font-medium text-white text-sm">
                    {activity.quotation_number}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(activity.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge px-3 py-1 text-xs font-medium ${
                  activity.status === 'caliente' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  activity.status === 'tibio' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 
                  'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-700">
            <Link to="/quotations" className="btn btn-modern text-white text-sm">
              Ver Todas las Cotizaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
