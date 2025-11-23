import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Users, Clock, DollarSign } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { fetchAnalyticsOverview } from '../api/analyticsApi';
import './AnalyticsDashboard.css';

const metricTemplates = [
  { key: 'totalAppointments', title: 'Total Appointments', icon: PawPrint },
  { key: 'newClients', title: 'New Clients', icon: Users },
  { key: 'avgVisitDuration', title: 'Average Visit Duration', icon: Clock },
  { key: 'totalRevenue', title: 'Total Revenue', icon: DollarSign },
];

const SAMPLE_METRIC_VALUES = {
  totalAppointments: { value: 1245, change: 12 },
  newClients: { value: 89, change: 8 },
  avgVisitDuration: { value: 45, change: 5 },
  totalRevenue: { value: 12450, change: 15 },
};

const SAMPLE_CHART_DATA = [
  { day: 'Mon', current: 120, previous: 100 },
  { day: 'Tue', current: 150, previous: 130 },
  { day: 'Wed', current: 180, previous: 160 },
  { day: 'Thu', current: 200, previous: 180 },
  { day: 'Fri', current: 220, previous: 190 },
  { day: 'Sat', current: 250, previous: 210 },
  { day: 'Sun', current: 280, previous: 230 },
];

const RANGE_FILTERS = ['Last 7 Days', 'Last 30 Days', 'This Quarter'];

const SAMPLE_STATUS_BREAKDOWN = [
  { label: 'Pending', value: 320, color: '#f97316' },
  { label: 'Accepted', value: 540, color: '#0ea5e9' },
  { label: 'Completed', value: 410, color: '#22c55e' },
  { label: 'Cancelled', value: 75, color: '#ef4444' },
];

const SAMPLE_SERVICE_PERFORMANCE = [
  { name: 'Wellness Exam', volume: 312, rating: 4.9, duration: 35, trend: 12, fill: 82 },
  { name: 'Dental Cleaning', volume: 208, rating: 4.6, duration: 55, trend: 6, fill: 64 },
  { name: 'Vaccination', volume: 405, rating: 4.8, duration: 25, trend: 18, fill: 94 },
  { name: 'Grooming', volume: 178, rating: 4.5, duration: 70, trend: -3, fill: 52 },
];

function formatMetricValue(key, rawValue) {
  switch (key) {
    case 'totalRevenue':
      return `$${Number(rawValue || 0).toLocaleString()}`;
    case 'avgVisitDuration':
      return `${rawValue || 0} min`;
    default:
      return rawValue?.toLocaleString
        ? rawValue.toLocaleString()
        : Number(rawValue || 0).toLocaleString();
  }
}

function formatMetricChange(change) {
  if (typeof change !== 'number') return '0%';
  const rounded = change.toFixed(0);
  return `${change >= 0 ? '+' : ''}${rounded}%`;
}

function buildMetricsFromData(metrics = {}) {
  return metricTemplates.map((template) => {
    const incoming = metrics[template.key] || SAMPLE_METRIC_VALUES[template.key];
    return {
      key: template.key,
      title: template.title,
      icon: template.icon,
      value: formatMetricValue(template.key, incoming.value),
      change: formatMetricChange(incoming.change),
    };
  });
}

const AnalyticsDashboard = () => {
  // TODO (Backend Integration): replace SAMPLE_* data with a fetch call to /analytics/overview
  // and map the response into the shape expected by buildMetricsFromData / chartData.
  const [activeRange, setActiveRange] = useState(RANGE_FILTERS[0]);
  const [metricsData, setMetricsData] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [serviceData, setServiceData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [serviceSales, setServiceSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      try {
        const result = await fetchAnalyticsOverview();
        if (!isMounted) return;

        if (result.success && result.data) {
          setMetricsData(result.data.metrics || null);
          setStatusData(result.data.statusBreakdown || null);
          setServiceData(result.data.servicePerformance || null);
          setTrendData(result.data.appointmentTrend || null);
          setServiceSales(result.data.serviceSales || null);
          setError(null);
        } else {
          setError(result.message || 'Analytics data unavailable');
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Analytics data unavailable');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = useMemo(() => buildMetricsFromData(metricsData || {}), [metricsData]);
  const chartData = trendData && trendData.length ? trendData : SAMPLE_CHART_DATA;
  const maxValue = Math.max(...chartData.flatMap((d) => [d.current, d.previous]));
  const chartHeight = 260;
  const chartWidth = 640;
  const chartPadding = 30;

  const buildLinePoints = (key) => {
    const step = (chartWidth - chartPadding * 2) / (chartData.length - 1 || 1);
    const scaleMax = maxValue > 0 ? maxValue : 1;
    return chartData
      .map((point, index) => {
        const x = chartPadding + step * index;
        const y =
          chartHeight -
          chartPadding -
          (point[key] / scaleMax) * (chartHeight - chartPadding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const currentPoints = buildLinePoints('current');
  const previousPoints = buildLinePoints('previous');

  const chartTicks = useMemo(() => {
    const tickCount = 4;
    const increment = Math.ceil(maxValue / tickCount);
    return Array.from({ length: tickCount + 1 }, (_, index) => increment * index);
  }, [maxValue]);
  const statusBreakdown = statusData && statusData.length ? statusData : SAMPLE_STATUS_BREAKDOWN;
  const statusTotal = useMemo(
    () => statusBreakdown.reduce((sum, status) => sum + status.value, 0),
    [statusBreakdown],
  );
  const statusMessage = metricsData || statusData || serviceData
    ? 'Showing live analytics based on recent appointments and billing.'
    : 'Showing sample analytics data (live analytics unavailable).';

  const metricCards = useMemo(
    () =>
      metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div key={metric.key} className="metric-card">
            <div className="metric-icon">
              <Icon size={24} />
            </div>
            <div className="metric-content">
              <h3>{metric.title}</h3>
              <p className="metric-value">{metric.value}</p>
              <span className="metric-change">{metric.change}</span>
            </div>
          </div>
        );
      }),
    [metrics],
  );

  return (
    <div className="grid-container-admin analytics-page">
      <Sidebar />
      <Header />
      <main className="main-container analytics-main">
        <section className="analytics-dashboard">
          <div className="dashboard-header">
         
            <h2>PetCare Analytics</h2>
            <p>Appointment Statistics Overview</p>
            <span className="status-badge ready">{statusMessage}</span>
          </div>

          <div className="analytics-controls">
            <div className="chip-group">
              {RANGE_FILTERS.map((range) => (
                <button
                  key={range}
                  type="button"
                  className={`filter-chip ${activeRange === range ? 'active' : ''}`}
                  onClick={() => setActiveRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
            
          </div>

          <div className="metrics-grid">{metricCards}</div>

          <div className="overview-grid">
            <div className="chart-container">
              <div className="chart-header">
                <h2>Daily Appointments ({activeRange})</h2>
                <span className="chart-subtitle">
                  Tracking current week vs. previous week appointment volumes
                </span>
              </div>
              <div className="chart-svg-wrapper">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
                  <defs>
                    <linearGradient id="currentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(66,133,244,0.35)" />
                      <stop offset="100%" stopColor="rgba(66,133,244,0)" />
                    </linearGradient>
                    <linearGradient id="previousGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(52,168,83,0.35)" />
                      <stop offset="100%" stopColor="rgba(52,168,83,0)" />
                    </linearGradient>
                  </defs>

                  {chartTicks.map((tick) => {
                    const y =
                      chartHeight -
                      chartPadding -
                      (tick / maxValue) * (chartHeight - chartPadding * 2);
                    return (
                      <g key={tick}>
                        <line
                          x1={chartPadding}
                          x2={chartWidth - chartPadding}
                          y1={y}
                          y2={y}
                          stroke="rgba(15,23,42,0.1)"
                          strokeDasharray="4 6"
                        />
                        <text x={chartPadding - 10} y={y + 4} className="chart-axis-label">
                          {tick}
                        </text>
                      </g>
                    );
                  })}

                  <polyline
                    points={previousPoints}
                    className="chart-line previous"
                    fill="url(#previousGradient)"
                  />
                  <polyline
                    points={currentPoints}
                    className="chart-line current"
                    fill="url(#currentGradient)"
                  />

                  {chartData.map((point, index) => {
                    const step = (chartWidth - chartPadding * 2) / (chartData.length - 1);
                    const x = chartPadding + step * index;
                    const y =
                      chartHeight -
                      chartPadding -
                      (point.current / maxValue) * (chartHeight - chartPadding * 2);
                    const yPrev =
                      chartHeight -
                      chartPadding -
                      (point.previous / maxValue) * (chartHeight - chartPadding * 2);
                    return (
                      <g key={point.day}>
                        <circle cx={x} cy={y} r={4} className="chart-dot current" />
                        <circle cx={x} cy={yPrev} r={4} className="chart-dot previous" />
                        <text x={x} y={chartHeight - chartPadding + 18} className="chart-day-label">
                          {point.day}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <div className="chart-legend">
                  <span className="legend-item current">Current Week</span>
                  <span className="legend-item previous">Previous Week</span>
                </div>
              </div>
            </div>

            <div className="status-card">
              <div className="status-header">
                <div>
                  <h2>Status Breakdown</h2>
                  <p>Distribution of all appointments</p>
                </div>
                <span className="status-total">{statusTotal} total</span>
              </div>
              <ul className="status-list">
                {statusBreakdown.map((status) => {
                  const percentage = Math.round((status.value / statusTotal) * 100);
                  return (
                    <li key={status.label} className="status-row">
                      <div className="status-meta">
                        <span className="status-dot" style={{ backgroundColor: status.color }} />
                        <div>
                          <p>{status.label}</p>
                          <small>{status.value} appointments</small>
                        </div>
                      </div>
                      <span className="status-percent">{percentage}%</span>
                      <div className="status-progress">
                        <span
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: status.color,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="service-grid">
            {(serviceData && serviceData.length ? serviceData : SAMPLE_SERVICE_PERFORMANCE).map((service) => {
              const salesEntry =
                serviceSales && Array.isArray(serviceSales)
                  ? serviceSales.find((s) => s.name === service.name)
                  : null;
              const salesAmount = salesEntry ? salesEntry.totalSales : null;
              return (
                <div key={service.name} className="service-card">
                  <div className="service-header">
                    <h3>{service.name}</h3>
                    <span className={`trend ${service.trend >= 0 ? 'up' : 'down'}`}>
                      {service.trend >= 0 ? '+' : ''}
                      {service.trend}%
                    </span>
                  </div>
                  <p className="service-volume">{service.volume} visits</p>
                  <div className="service-bar">
                    <span style={{ width: `${service.fill}%` }} />
                  </div>
                  <small>
                    Avg rating {service.rating} · {service.duration} min avg duration
                  </small>
                  {salesAmount !== null && (
                    <small>
                      Sales: ${salesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;

