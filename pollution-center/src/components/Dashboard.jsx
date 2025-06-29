import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import AddBoxIcon from '@mui/icons-material/AddBox';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChecklistIcon from '@mui/icons-material/Checklist';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import UserBar from './UserBar';
import { parse, differenceInCalendarDays, isAfter, isBefore, startOfDay, format } from 'date-fns';
import { useSidebar } from '../context/SidebarContext';
import BarChartIcon from '@mui/icons-material/BarChart';
import { getVehicleData } from '../services/api';

const CURRENT_USER_KEY = 'pollution_current_user';

const Dashboard = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const [expiringVehicles, setExpiringVehicles] = useState([]);
  const { isOpen } = useSidebar();

  // Overview stats
  const [totalCertificates, setTotalCertificates] = useState(0);
  const [certificatesToday, setCertificatesToday] = useState(0);
  const [amountToday, setAmountToday] = useState(0);
  const [amountMonth, setAmountMonth] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
        setUsername(user || 'User');
        
        // Load vehicle data
        const data = await getVehicleData();
        
        // Expiration Alerts logic
        const today = startOfDay(new Date());
        const in7Days = startOfDay(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        let expiring = data.filter(v => {
          if (!v.expiryDate) return false;
          const expiry = parse(v.expiryDate, 'dd-MM-yyyy', new Date());
          return isAfter(expiry, today) && (isBefore(expiry, in7Days) || differenceInCalendarDays(expiry, today) === 0);
        });
        if (user && user !== 'admin') {
          expiring = expiring.filter(v => v.username === user);
        }
        setExpiringVehicles(expiring);

        // Overview stats
        let filteredData = data;
        if (user && user !== 'admin') {
          filteredData = data.filter(v => v.username === user);
        }
        setTotalCertificates(filteredData.length);
        const todayStr = format(today, 'dd-MM-yyyy');
        setCertificatesToday(filteredData.filter(v => v.dateOfEntry === todayStr).length);
        // Amount Collected Today
        setAmountToday(filteredData.filter(v => v.dateOfEntry === todayStr).reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0));
        // Amount Collected This Month
        const now = new Date();
        const monthStr = format(now, 'MM-yyyy');
        setAmountMonth(filteredData.filter(v => {
          if (!v.dateOfEntry) return false;
          const [day, month, year] = v.dateOfEntry.split('-');
          return `${month}-${year}` === monthStr;
        }).reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>
      <Sidebar />
      <div style={{ 
        flex: 1, 
        padding: '40px 0', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        background: '#fafbfc', 
        marginLeft: isOpen ? 250 : 70,
        transition: 'margin-left 0.3s ease'
      }}>
        <UserBar style={{ padding: '0 40px 0 0', width: '100%', maxWidth: 1100, margin: '0 auto' }} />
        {/* Welcome Banner */}
        <div style={{ width: '90%', maxWidth: 1100, marginBottom: 32 }}>
          <div style={{ background: 'linear-gradient(90deg, #fffde7 60%, #e3f2fd 100%)', borderRadius: 12, padding: '28px 36px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24, border: '1px solid #f5f5f5' }}>
            <h2 style={{ color: '#f5b800', fontWeight: 700, fontSize: 28, margin: 0 }}>Welcome to your Dashboard, {username}!</h2>
            <div style={{ color: '#888', fontSize: 18, marginTop: 8 }}>Manage pollution control certificates with ease.</div>
          </div>

          {/* Cards Row */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
            {/* Quick Stats Card */}
            <div style={{ flex: 1, minWidth: 260, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f5f5f5' }}>
              <ChecklistIcon style={{ color: '#1976d2', fontSize: 36, marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4, color: '#1976d2' }}>Quick Stats</div>
              <div style={{ color: '#888', fontSize: 15, marginBottom: 16, textAlign: 'center' }}>View vehicle data statistics and trends.</div>
              <button onClick={() => navigate('/overview')} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>View Stats</button>
            </div>
            {/* Overview Card */}
            <div style={{ flex: 1, minWidth: 260, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(25,118,210,0.08)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #e3f2fd' }}>
              <BarChartIcon style={{ color: '#1976d2', fontSize: 36, marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4, color: '#1976d2' }}>Overview</div>
              <div style={{ color: '#222', fontSize: 15, marginBottom: 8 }}>Total Certificates: <span style={{ fontWeight: 700 }}>{totalCertificates}</span></div>
              <div style={{ color: '#222', fontSize: 15, marginBottom: 8 }}>Issued Today: <span style={{ fontWeight: 700 }}>{certificatesToday}</span></div>
              <div style={{ color: '#222', fontSize: 15, marginBottom: 8 }}>Amount Collected Today: <span style={{ fontWeight: 700 }}>₹{amountToday}</span></div>
              <div style={{ color: '#222', fontSize: 15 }}>Amount Collected This Month: <span style={{ fontWeight: 700 }}>₹{amountMonth}</span></div>
            </div>
            {/* New Data Entry */}
            <div style={{ flex: 1, minWidth: 260, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f5f5f5' }}>
              <AddBoxIcon style={{ color: '#1976d2', fontSize: 36, marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>New Data Entry</div>
              <div style={{ color: '#888', fontSize: 15, marginBottom: 16, textAlign: 'center' }}>Add a new vehicle</div>
              <button onClick={() => navigate('/entry')} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Add New Vehicle</button>
            </div>
            {/* View & Export Data */}
            <div style={{ flex: 1, minWidth: 260, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #f5f5f5' }}>
              <AssessmentIcon style={{ color: '#1976d2', fontSize: 36, marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>View & Export Data</div>
              <div style={{ color: '#888', fontSize: 15, marginBottom: 16, textAlign: 'center' }}>Access records and export data to CSV.</div>
              <button onClick={() => navigate('/reports')} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Go to Reports</button>
            </div>
          </div>

          {/* Expiration Alerts */}
          <div style={{ background: '#fff', border: '1.5px solid #f8d7da', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#d32f2f', fontWeight: 600, fontSize: 20, marginBottom: 8 }}>
              <WarningAmberIcon style={{ marginRight: 8 }} />
              Expiration Alerts
            </div>
            <div style={{ color: '#888', fontSize: 15, marginBottom: 16 }}>Vehicles with certificates expiring within the next 7 days.</div>
            {expiringVehicles.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
                <CalendarMonthIcon style={{ color: '#43a047', fontSize: 36, marginRight: 12 }} />
                <span style={{ color: '#43a047', fontWeight: 500, fontSize: 18 }}>No certificates expiring soon. All clear!</span>
              </div>
            ) : (
              <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fff8e1' }}>
                      <th style={{ padding: '8px', color: '#d32f2f', fontWeight: 600, fontSize: 15, borderRight: '1.5px solid #f8d7da', textAlign: 'center' }}>No.</th>
                      <th style={{ padding: '8px', color: '#d32f2f', fontWeight: 600, fontSize: 15, borderRight: '1.5px solid #f8d7da', textAlign: 'center' }}>Vehicle Number</th>
                      <th style={{ padding: '8px', color: '#d32f2f', fontWeight: 600, fontSize: 15, borderRight: '1.5px solid #f8d7da', textAlign: 'center' }}>Expiry Date</th>
                      <th style={{ padding: '8px', color: '#d32f2f', fontWeight: 600, fontSize: 15, borderRight: username === 'admin' ? '1.5px solid #f8d7da' : 'none', textAlign: 'center' }}>Mobile</th>
                      {username === 'admin' && <th style={{ padding: '8px', color: '#d32f2f', fontWeight: 600, fontSize: 15, textAlign: 'center' }}>Username</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {expiringVehicles.map((v, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', color: '#222', fontWeight: 500, borderRight: '1.5px solid #f8d7da', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '8px', color: '#222', fontWeight: 500, borderRight: '1.5px solid #f8d7da', textAlign: 'center' }}>{v.vehicleNumber}</td>
                        <td style={{ padding: '8px', color: '#d32f2f', fontWeight: 600, borderRight: '1.5px solid #f8d7da', textAlign: 'center' }}>{v.expiryDate}</td>
                        <td style={{ padding: '8px', color: '#222', borderRight: username === 'admin' ? '1.5px solid #f8d7da' : 'none', textAlign: 'center' }}>{v.mobile}</td>
                        {username === 'admin' && <td style={{ padding: '8px', color: '#888', textAlign: 'center' }}>{v.username}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <footer style={{ marginTop: 40, color: '#888', fontSize: 15 }}>Pollution Data Manager © 2025</footer>
      </div>
    </div>
  );
};

export default Dashboard; 