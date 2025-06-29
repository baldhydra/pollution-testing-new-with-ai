import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import UserBar from './UserBar';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse, startOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useSidebar } from '../context/SidebarContext';

const VEHICLE_DATA_KEY = 'vehicle_data';

const Overview = () => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [vehicleData, setVehicleData] = useState([]);
  const [histogramData, setHistogramData] = useState([]);
  const { isOpen } = useSidebar();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(VEHICLE_DATA_KEY) || '[]');
    setVehicleData(data);
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) {
      setHistogramData([]);
      return;
    }
    // Build a map of date string to count
    const counts = {};
    let d = startOfDay(startDate);
    const end = startOfDay(endDate);
    while (d <= end) {
      counts[format(d, 'dd-MM-yyyy')] = 0;
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    }
    vehicleData.forEach(v => {
      if (!v.dateOfEntry) return;
      if (v.dateOfEntry >= format(startOfDay(startDate), 'dd-MM-yyyy') && v.dateOfEntry <= format(startOfDay(endDate), 'dd-MM-yyyy')) {
        counts[v.dateOfEntry] = (counts[v.dateOfEntry] || 0) + 1;
      }
    });
    setHistogramData(Object.entries(counts).map(([date, count]) => ({ date, count })));
  }, [startDate, endDate, vehicleData]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>
      <Sidebar />
      <div style={{ 
        flex: 1, 
        marginLeft: isOpen ? 250 : 70, 
        minHeight: '100vh', 
        background: '#fff',
        transition: 'margin-left 0.3s ease'
      }}>
        <UserBar style={{ padding: '24px 40px 0 0' }} />
        <div style={{ width: '100%', maxWidth: 900, margin: '24px auto 0 auto' }}>
          <div style={{ background: '#e3f2fd', borderRadius: 12, padding: '24px 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f5f5f5', marginBottom: 24 }}>
            <h2 style={{ color: '#1976d2', fontWeight: 700, fontSize: 24, margin: 0 }}>Overview</h2>
            <div style={{ color: '#888', fontSize: 16, marginTop: 8 }}>Select a date range to view the number of vehicles per day.</div>
            <div style={{ marginTop: 24 }}>
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                isClearable={true}
                inline
              />
            </div>
          </div>
          <div style={{ background: '#fff', border: '1.5px solid #eee', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, margin: '32px 0', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {histogramData.length === 0 ? (
              <div style={{ color: '#888', fontSize: 18 }}>Select a date range to see the histogram.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" stroke="#888" fontSize={13} angle={-30} textAnchor="end" height={60} />
                  <YAxis stroke="#888" fontSize={13} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#f5f5f5', border: '1px solid #1976d2', color: '#222' }} />
                  <Bar dataKey="count" fill="#1976d2" barSize={32} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <footer style={{ marginTop: 40, color: '#888', fontSize: 15, textAlign: 'center' }}>Pollution Data Manager © 2025</footer>
      </div>
    </div>
  );
};

export default Overview; 