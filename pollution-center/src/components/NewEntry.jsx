import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addMonths, addYears, format } from 'date-fns';
import UserBar from './UserBar';
import { useSidebar } from '../context/SidebarContext';
import { saveVehicleData } from '../services/api';

const CURRENT_USER_KEY = 'pollution_current_user';

const vehicleTypes = [
  'Car',
  'Bike',
  'Truck',
  'Bus',
  'Auto',
  'Other',
];

const NewEntry = () => {
  const [username, setUsername] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [validity, setValidity] = useState('6 Months');
  const [success, setSuccess] = useState('');
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const { isOpen } = useSidebar();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    setUsername(user || 'User');
  }, []);

  // Calculate expiry date
  const getExpiryDate = () => {
    if (!date) return '';
    if (validity === '6 Months') {
      return format(addMonths(date, 6), 'dd-MM-yyyy');
    } else {
      return format(addYears(date, 1), 'dd-MM-yyyy');
    }
  };
  const expiryDate = getExpiryDate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      setMobileError('Mobile number must be exactly 10 digits');
      return;
    } else {
      setMobileError('');
    }

    try {
      const data = {
        vehicleNumber,
        vehicleType,
        fuelType,
        amount,
        dateOfEntry: format(date, 'dd-MM-yyyy'),
        validity,
        expiryDate,
        mobile,
        username
      };
      
      await saveVehicleData(data);
      setSuccess('Record saved!');
      setVehicleNumber('');
      setFuelType('');
      setVehicleType('');
      setMobile('');
      setAmount('');
      setDate(new Date());
      setValidity('6 Months');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      setSuccess('Error saving record. Please try again.');
      console.error('Error saving vehicle data:', error);
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
        <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ color: '#222', marginBottom: 32 }}>New Entry</h1>
          <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, color: '#222' }}>Vehicle Number</label>
              <input type="text" required placeholder="Enter vehicle number" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} style={{ width: '100%', marginTop: 6, padding: 10, border: '1px solid #eee', borderRadius: 6, fontSize: 16, color: '#222', background: '#fff' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, color: '#222' }}>Vehicle Type</label>
              <select required value={vehicleType} onChange={e => setVehicleType(e.target.value)} style={{ width: '100%', marginTop: 6, padding: 10, border: '1px solid #eee', borderRadius: 6, fontSize: 16, color: '#222', background: '#fff' }}>
                <option value="">Select vehicle type</option>
                {vehicleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, color: '#222' }}>Fuel Type</label>
              <select required value={fuelType} onChange={e => setFuelType(e.target.value)} style={{ width: '100%', marginTop: 6, padding: 10, border: '1px solid #eee', borderRadius: 6, fontSize: 16, color: '#222', background: '#fff' }}>
                <option value="">Select fuel type</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, color: '#222' }}>Amount</label>
              <input type="number" required placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '100%', marginTop: 6, padding: 10, border: '1px solid #eee', borderRadius: 6, fontSize: 16, color: '#222', background: '#fff' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, color: '#222' }}>Date of Entry</label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <DatePicker
                  selected={date}
                  onChange={date => setDate(date)}
                  dateFormat="dd-MM-yyyy"
                  style={{ width: '100%', padding: 10, border: '1px solid #eee', borderRadius: 6, fontSize: 16, color: '#222', background: '#fff' }}
                />
                <CalendarTodayIcon style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, color: '#222' }}>Validity</label>
              <select required value={validity} onChange={e => setValidity(e.target.value)} style={{ width: '100%', marginTop: 6, padding: 10, border: '1px solid #eee', borderRadius: 6, fontSize: 16, color: '#222', background: '#fff' }}>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
              </select>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, color: '#222' }}>Expiry Date</label>
              <input
                type="text"
                value={expiryDate}
                readOnly
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: 10,
                  border: '1px solid #eee',
                  borderRadius: 6,
                  fontSize: 16,
                  color: '#222',
                  background: '#f8f9fa',
                  cursor: 'not-allowed'
                }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, color: '#222' }}>Mobile Number</label>
              <input type="tel" required maxLength={10} pattern="[0-9]{10}" placeholder="Enter 10-digit mobile number" value={mobile} onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setMobile(val.slice(0, 10));
              }} style={{ width: '100%', marginTop: 6, padding: 10, border: '1px solid #eee', borderRadius: 6, fontSize: 16, color: '#222', background: '#fff' }} />
              {mobileError && <div style={{ color: '#e74c3c', fontSize: 13, marginTop: 4 }}>{mobileError}</div>}
            </div>
            <button type="submit" style={{ width: '100%', background: '#f5b800', color: '#222', fontWeight: 600, border: 'none', borderRadius: 6, padding: '12px 0', fontSize: 17, marginTop: 8, cursor: 'pointer' }}>Save Record</button>
            {success && <div style={{ color: '#4a90e2', marginTop: 16, textAlign: 'center' }}>{success}</div>}
          </form>
          <footer style={{ marginTop: 40, color: '#888', fontSize: 15 }}>Pollution Data Manager © 2025</footer>
        </div>
      </div>
    </div>
  );
};

export default NewEntry; 