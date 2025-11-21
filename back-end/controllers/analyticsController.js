const db = require('../config/db');

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });

const getNumberField = (rows, field) => {
  if (!rows || !rows.length) return 0;
  const value = rows[0][field];
  if (typeof value === 'number') return value;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const computeChange = (current, previous) => {
  const curr = Number(current || 0);
  const prev = Number(previous || 0);
  if (prev <= 0) {
    return curr > 0 ? 100 : 0;
  }
  return ((curr - prev) / prev) * 100;
};

exports.getOverview = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const [
      currentAppointments,
      previousAppointments,
      currentClients,
      previousClients,
      currentDuration,
      previousDuration,
      currentRevenue,
      previousRevenue,
      statusRows,
      serviceRows,
      currentDailyRows,
      previousDailyRows,
      serviceSalesRows,
    ] = await Promise.all([
      query(
        `SELECT COUNT(*) AS total FROM appointment WHERE date_time >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)`
      ),
      query(
        `SELECT COUNT(*) AS total FROM appointment WHERE date_time >= DATE_SUB(CURDATE(), INTERVAL 59 DAY) AND date_time < DATE_SUB(CURDATE(), INTERVAL 29 DAY)`
      ),
      query(
        `SELECT COUNT(DISTINCT user_id) AS total FROM appointment WHERE date_time >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)`
      ),
      query(
        `SELECT COUNT(DISTINCT user_id) AS total FROM appointment WHERE date_time >= DATE_SUB(CURDATE(), INTERVAL 59 DAY) AND date_time < DATE_SUB(CURDATE(), INTERVAL 29 DAY)`
      ),
      query(
        `SELECT AVG(s.duration_minutes) AS avg_duration FROM appointment a LEFT JOIN service s ON a.service_id = s.service_id WHERE a.date_time >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)`
      ),
      query(
        `SELECT AVG(s.duration_minutes) AS avg_duration FROM appointment a LEFT JOIN service s ON a.service_id = s.service_id WHERE a.date_time >= DATE_SUB(CURDATE(), INTERVAL 59 DAY) AND a.date_time < DATE_SUB(CURDATE(), INTERVAL 29 DAY)`
      ),
      query(
        `SELECT COALESCE(SUM(amount),0) AS total FROM billing WHERE status = 'paid' AND paid_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)`
      ),
      query(
        `SELECT COALESCE(SUM(amount),0) AS total FROM billing WHERE status = 'paid' AND paid_at >= DATE_SUB(CURDATE(), INTERVAL 59 DAY) AND paid_at < DATE_SUB(CURDATE(), INTERVAL 29 DAY)`
      ),
      query(`SELECT status, COUNT(*) AS total FROM appointment GROUP BY status`),
      query(`
        SELECT 
          COALESCE(s.service_name, a.service) AS name,
          COUNT(*) AS volume,
          COALESCE(AVG(s.duration_minutes), 0) AS avg_duration
        FROM appointment a
        LEFT JOIN service s ON a.service_id = s.service_id
        GROUP BY name
        ORDER BY volume DESC
        LIMIT 4
      `),
      query(
        `SELECT DAYOFWEEK(date_time) AS weekday, COUNT(*) AS total
         FROM appointment
         WHERE date_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY weekday`
      ),
      query(
        `SELECT DAYOFWEEK(date_time) AS weekday, COUNT(*) AS total
         FROM appointment
         WHERE date_time >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
           AND date_time < DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY weekday`
      ),
      query(
        `SELECT 
           COALESCE(s.service_name, a.service) AS name,
           COALESCE(SUM(b.amount), 0) AS total_sales
         FROM billing b
         JOIN appointment a ON b.appointment_id = a.appointment_id
         LEFT JOIN service s ON a.service_id = s.service_id
         WHERE b.status = 'paid'
           AND b.paid_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
         GROUP BY name
         ORDER BY total_sales DESC`
      ),
    ]);

    const totalAppointmentsCurrent = getNumberField(currentAppointments, 'total');
    const totalAppointmentsPrev = getNumberField(previousAppointments, 'total');
    const newClientsCurrent = getNumberField(currentClients, 'total');
    const newClientsPrev = getNumberField(previousClients, 'total');

    const avgDurationCurrent = getNumberField(currentDuration, 'avg_duration');
    const avgDurationPrev = getNumberField(previousDuration, 'avg_duration');

    const revenueCurrent = getNumberField(currentRevenue, 'total');
    const revenuePrev = getNumberField(previousRevenue, 'total');

    const metrics = {
      totalAppointments: {
        value: totalAppointmentsCurrent,
        change: computeChange(totalAppointmentsCurrent, totalAppointmentsPrev),
      },
      newClients: {
        value: newClientsCurrent,
        change: computeChange(newClientsCurrent, newClientsPrev),
      },
      avgVisitDuration: {
        value: Math.round(avgDurationCurrent || 0),
        change: computeChange(avgDurationCurrent, avgDurationPrev),
      },
      totalRevenue: {
        value: Number(revenueCurrent.toFixed ? revenueCurrent.toFixed(2) : revenueCurrent || 0),
        change: computeChange(revenueCurrent, revenuePrev),
      },
    };

    const statusColorMap = {
      Pending: '#f97316',
      Accepted: '#0ea5e9',
      Completed: '#22c55e',
      Cancelled: '#ef4444',
    };

    const statusBreakdown = (statusRows || []).map((row) => ({
      label: row.status || 'Unknown',
      value: Number(row.total || 0),
      color: statusColorMap[row.status] || '#6b7280',
    }));

    const maxVolume = (serviceRows || []).reduce(
      (max, row) => (row.volume > max ? row.volume : max),
      0,
    );

    const servicePerformance = (serviceRows || []).map((row) => ({
      name: row.name || 'Unknown service',
      volume: Number(row.volume || 0),
      rating: 4.8,
      duration: Math.round(row.avg_duration || 0),
      trend: 0,
      fill: maxVolume > 0 ? Math.round((row.volume / maxVolume) * 100) : 0,
    }));

    const buildDailyMap = (rows) => {
      const map = new Map();
      (rows || []).forEach((row) => {
        const key = Number(row.weekday);
        if (!Number.isNaN(key)) {
          map.set(key, Number(row.total || 0));
        }
      });
      return map;
    };

    const currentDailyMap = buildDailyMap(currentDailyRows);
    const previousDailyMap = buildDailyMap(previousDailyRows);

    const dayOrder = [
      { weekday: 2, label: 'Mon' },
      { weekday: 3, label: 'Tue' },
      { weekday: 4, label: 'Wed' },
      { weekday: 5, label: 'Thu' },
      { weekday: 6, label: 'Fri' },
      { weekday: 7, label: 'Sat' },
      { weekday: 1, label: 'Sun' },
    ];

    const appointmentTrend = dayOrder.map(({ weekday, label }) => ({
      day: label,
      current: currentDailyMap.get(weekday) || 0,
      previous: previousDailyMap.get(weekday) || 0,
    }));

    const serviceSales = (serviceSalesRows || []).map((row) => ({
      name: row.name || 'Unknown service',
      totalSales: Number(row.total_sales || 0),
    }));

    res.json({
      metrics,
      statusBreakdown,
      servicePerformance,
      appointmentTrend,
      serviceSales,
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics overview' });
  }
};
