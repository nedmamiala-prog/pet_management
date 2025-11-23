const db = require('../config/db');

const query = async (sql, params = []) => {
  console.log("\n--- Executing SQL ---");
  console.log(sql);
  console.log("Params:", params);

  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) {
        console.error("\n❌ SQL ERROR on query:");
        console.error(sql);
        console.error("Params:", params);
        console.error("MySQL error details:", err);
        return reject(err);
      }
      resolve(rows || []);
    });
  });
};

exports.getDashboardStats = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    console.log("\n========== DASHBOARD STATS RUN ==========");

    const [
      petRecordsCount,
      todayAppointments,
      monthlyRevenue,
      pendingApprovals,
      totalUsers,
      totalPets
    ] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM pet_record`),
      query(`SELECT COUNT(*) AS total FROM appointment WHERE DATE(date_time) = CURDATE()`),
      query(`
        SELECT COALESCE(SUM(amount), 0) AS total 
        FROM billing 
        WHERE status = 'paid'
        AND MONTH(paid_at) = MONTH(CURDATE()) 
        AND YEAR(paid_at) = YEAR(CURDATE())
      `),
      query(`SELECT COUNT(*) AS total FROM appointment WHERE status = 'Pending'`),
      query(`SELECT COUNT(*) AS total FROM user`),
      query(`SELECT COUNT(*) AS total FROM pet`)
    ]);

    const pendingAppointments = await query(`
      SELECT a.appointment_id, a.date_time, a.service, a.status,
            p.pet_name, u.first_name, u.last_name
      FROM appointment a
      JOIN pet p ON a.pet_id = p.pet_id
      JOIN user u ON a.user_id = u.user_id
      WHERE a.status = 'Pending'
      ORDER BY a.date_time ASC
      LIMIT 5
    `);

const recentActivity = await query(`
  SELECT 
    'appointment' AS type,
    CONCAT('Appointment ', LOWER(a.status), ' for ', p.pet_name) AS text,
    a.date_time AS activity_time,
    TIMESTAMPDIFF(MINUTE, a.date_time, NOW()) AS minutes_ago
  FROM appointment a
  JOIN pet p ON a.pet_id = p.pet_id
  WHERE a.status IN ('Accepted', 'Rejected', 'Completed', 'Cancelled')

  ORDER BY a.date_time DESC
  LIMIT 5
`);

    res.json({
      success: true,
      stats: {
        petRecords: petRecordsCount[0]?.total || 0,
        todayAppointments: todayAppointments[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        pendingApprovals: pendingApprovals[0]?.total || 0,
        totalUsers: totalUsers[0]?.total || 0,
        totalPets: totalPets[0]?.total || 0
      },
      pendingAppointments: pendingAppointments.map(apt => ({
        id: apt.appointment_id,
        name: `${apt.first_name} ${apt.last_name}`,
        petName: apt.pet_name,
        service: apt.service,
        dateTime: apt.date_time
      })),
   recentActivity: recentActivity.map(act => ({
  id: act.activity_time,
  text: act.text,
time:
  act.minutes_ago < 0
    ? `In ${Math.abs(act.minutes_ago)} minutes`
    : act.minutes_ago < 60
      ? `${act.minutes_ago} mins ago`
      : `${Math.floor(act.minutes_ago / 60)} hours ago`,
  color: act.text.includes('accepted') ? '#c8f7d2'
         : act.text.includes('rejected') ? '#ffd8d8'
         : act.text.includes('cancelled') ? '#ffd8d8'
         : '#d8ffd8'
}))
    });
  } catch (err) {
    console.error("\n🔥 DASHBOARD 500 ERROR:");
    console.error(err);
    res.status(500).json({
      message: 'Failed to fetch dashboard stats',
      error: err.sqlMessage || err.message || err
    });
  }
};
