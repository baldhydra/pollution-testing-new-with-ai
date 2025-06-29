import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import UserBar from './UserBar';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse, startOfDay, endOfDay, isWithinInterval, isAfter, isBefore } from 'date-fns';
import { useSidebar } from '../context/SidebarContext';
import { getVehicleData, deleteVehicleData, deleteUser } from '../services/api';

const CURRENT_USER_KEY = 'pollution_current_user';

const Reports = () => {
  const navigate = useNavigate();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [vehicleData, setVehicleData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const { isOpen } = useSidebar();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load vehicle data
        const data = await getVehicleData();
        setVehicleData(data);
        
        // Get current user
        const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
        setUsername(user || 'User');
        
        // Filter for user unless admin
        if (user && user !== 'admin') {
          setFilteredData(data.filter(v => v.username === user));
        } else {
          setFilteredData(data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let data = vehicleData;
    // Filter for user unless admin
    if (username && username !== 'admin') {
      data = data.filter(v => v.username === username);
    }
    // Filter by search
    if (search.trim()) {
      data = data.filter(v => v.vehicleNumber && v.vehicleNumber.toLowerCase().includes(search.trim().toLowerCase()));
    }
    // Filter by date range
    if (startDate && endDate) {
      const startStr = format(startOfDay(startDate), 'dd-MM-yyyy');
      const endStr = format(startOfDay(endDate), 'dd-MM-yyyy');
      data = data.filter(v => {
        if (!v.dateOfEntry) return false;
        return v.dateOfEntry >= startStr && v.dateOfEntry <= endStr;
      });
    } else if (startDate) {
      const startStr = format(startOfDay(startDate), 'dd-MM-yyyy');
      data = data.filter(v => v.dateOfEntry && v.dateOfEntry >= startStr);
    } else if (endDate) {
      const endStr = format(startOfDay(endDate), 'dd-MM-yyyy');
      data = data.filter(v => v.dateOfEntry && v.dateOfEntry <= endStr);
    }
    setFilteredData(data);
  }, [search, startDate, endDate, vehicleData, username]);

  const handleClearFilters = () => {
    setDateRange([null, null]);
    setSearch('');
    setFilteredData(vehicleData);
  };

  // Helper to format date range for button
  const formatRange = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'dd-MM-yyyy')} to ${format(endDate, 'dd-MM-yyyy')}`;
    } else if (startDate) {
      return `${format(startDate, 'dd-MM-yyyy')} to ...`;
    } else {
      return 'Filter by Entry Date';
    }
  };

  // CSV export function
  const exportCSV = () => {
    if (!filteredData.length) return;
    const headers = ['Vehicle Number', 'Entry Date', 'Fuel Type', 'Mobile', 'Certificate Expiry'];
    const rows = filteredData.map(v => [
      v.vehicleNumber,
      v.dateOfEntry,
      v.fuelType,
      v.mobile,
      v.expiryDate
    ]);
    let csvContent = '';
    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(val => `"${val}"`).join(',') + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicle_data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Admin: delete data entry
  const handleDeleteEntry = async (idx) => {
    try {
      const entry = filteredData[idx];
      await deleteVehicleData(entry);
      const newData = vehicleData.filter(d =>
        !(
          d.vehicleNumber === entry.vehicleNumber &&
          d.dateOfEntry === entry.dateOfEntry &&
          d.username === entry.username
        )
      );
      setVehicleData(newData);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  // Admin: delete user
  const handleDeleteUser = async (userToDelete) => {
    try {
      await deleteUser(userToDelete);
      // Update local state
      const newUsers = users.filter(u => u !== userToDelete);
      setUsers(newUsers);
      // Remove user's data from vehicle data
      const newData = vehicleData.filter(d => d.username !== userToDelete);
      setVehicleData(newData);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

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
        <UserBar />
        <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ color: '#222', marginBottom: 32 }}>Reports</h1>
          
          {/* Search and Filter Bar */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ position: 'relative', flex: '0 0 300px' }}>
              <SearchIcon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input
                type="text"
                placeholder="Search by vehicle number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #eee',
                  borderRadius: 8,
                  fontSize: 16,
                  color: '#222',
                  background: '#fff'
                }}
              />
            </div>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                border: '1px solid #eee',
                borderRadius: 8,
                background: '#fff',
                color: '#222',
                cursor: 'pointer'
              }}
            >
              <FilterAltIcon />
              {formatRange()}
            </button>
            <button
              onClick={handleClearFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                border: '1px solid #eee',
                borderRadius: 8,
                background: '#fff',
                color: '#222',
                cursor: 'pointer'
              }}
            >
              <ClearIcon />
              Clear
            </button>
            <button
              onClick={exportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                border: '1px solid #eee',
                borderRadius: 8,
                background: '#fff',
                color: '#222',
                cursor: 'pointer'
              }}
            >
              <FileDownloadIcon />
              Export CSV
            </button>
          </div>

          {/* Date Range Picker Popup */}
          {showDatePicker && (
            <div style={{ 
              position: 'fixed', 
              zIndex: 1000, 
              left: '50%', 
              top: '50%', 
              transform: 'translate(-50%, -50%)', 
              background: '#fff', 
              border: '1px solid #eee', 
              borderRadius: 8, 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
              padding: 16 
            }}>
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                isClearable={true}
                inline
              />
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <button onClick={() => setShowDatePicker(false)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 500, cursor: 'pointer' }}>Done</button>
              </div>
            </div>
          )}

          {/* Data Table or No Data Found */}
          <div style={{ 
            background: '#fff', 
            border: '1.5px solid #eee', 
            borderRadius: 12, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
            padding: 0, 
            margin: '32px 0', 
            minHeight: 200, 
            maxHeight: 400, 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'stretch', 
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            {filteredData.length === 0 ? (
              <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <InfoOutlinedIcon style={{ color: '#bbb', fontSize: 48, marginBottom: 12 }} />
                <div style={{ color: '#222', fontWeight: 600, fontSize: 22, marginBottom: 6 }}>No Data Found</div>
                <div style={{ color: '#888', fontSize: 16 }}>Try adjusting your search or date filters, or add new entries.</div>
              </div>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Vehicle Number</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Entry Date</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Fuel Type</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Mobile</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Certificate Expiry</th>
                      {username === 'admin' && <th style={{ padding: '12px 8px', textAlign: 'left', color: '#666', fontWeight: 600 }}>User</th>}
                      <th style={{ padding: '12px 8px', textAlign: 'center', color: '#666', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((v, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px 8px', color: '#222', fontWeight: 500 }}>{v.vehicleNumber}</td>
                        <td style={{ padding: '10px 8px', color: '#222' }}>{v.dateOfEntry ? format(parse(v.dateOfEntry, 'dd-MM-yyyy', new Date()), 'dd-MM-yyyy') : ''}</td>
                        <td style={{ padding: '10px 8px', color: '#222' }}>{v.fuelType}</td>
                        <td style={{ padding: '10px 8px', color: '#222' }}>{v.mobile}</td>
                        <td style={{ padding: '10px 8px', color: '#222' }}>{v.expiryDate ? format(parse(v.expiryDate, 'dd-MM-yyyy', new Date()), 'dd-MM-yyyy') : ''}</td>
                        {username === 'admin' && <td style={{ padding: '10px 8px', color: '#888' }}>{v.username}</td>}
                        <td style={{ padding: '10px 8px', color: '#d32f2f', textAlign: 'center' }}><button onClick={() => handleDeleteEntry(idx)} style={{ background: 'none', border: 'none', color: '#d32f2f', fontWeight: 700, cursor: 'pointer' }}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <footer style={{ 
          marginTop: 40, 
          color: '#888', 
          fontSize: 15,
          padding: '0 32px',
          marginLeft: isOpen ? 250 : 70,
          transition: 'margin-left 0.3s ease'
        }}>Pollution Data Manager © 2025</footer>
      </div>
    </div>
  );
};

export default Reports; 