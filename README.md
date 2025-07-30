# Pollution Center Data Management System

A comprehensive web application for managing vehicle pollution certificates and data collection at pollution testing centers. Built with React frontend and Node.js backend, featuring real-time data management, user authentication, and detailed reporting capabilities.

## 🚀 Features

### Core Functionality
- **Vehicle Data Management**: Add, view, and delete vehicle pollution certificates
- **User Authentication**: Secure login system with role-based access
- **Real-time Dashboard**: Overview of certificates, expiring alerts, and financial statistics
- **Data Entry**: Streamlined form for entering new vehicle pollution data
- **Reports Generation**: Comprehensive reporting with charts and analytics
- **Expiry Alerts**: Automated notifications for certificates expiring within 7 days

### Technical Features
- **Responsive Design**: Modern UI built with Material-UI components
- **Data Visualization**: Interactive charts using Recharts library
- **Local Storage**: Persistent user sessions and preferences
- **RESTful API**: Clean backend architecture with Express.js
- **File-based Storage**: JSON-based data persistence

## 🛠️ Tech Stack

### Frontend
- **React 19.1.0** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Material-UI (MUI)** - Component library for consistent design
- **React Router DOM** - Client-side routing
- **Recharts** - Data visualization library
- **Date-fns** - Date manipulation utilities
- **React Datepicker** - Date input components

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **CORS** - Cross-origin resource sharing
- **fs-extra** - Enhanced file system operations

## 📋 Prerequisites

Before running this application, make sure you have the following installed:
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd pollution-center
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   The server will start on `http://localhost:3001`

2. **Start the Frontend Development Server**
   ```bash
   npm run dev
   ```
   The application will open on `http://localhost:5173`

### Production Build

1. **Build the Frontend**
   ```bash
   npm run build
   ```

2. **Start the Production Server**
   ```bash
   cd server
   npm start
   ```

## 📁 Project Structure

```
pollution-center/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── Login.jsx        # Authentication
│   │   ├── NewEntry.jsx     # Data entry form
│   │   ├── Reports.jsx      # Reports and analytics
│   │   ├── Overview.jsx     # Overview page
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   ├── Header.jsx       # Application header
│   │   └── UserBar.jsx      # User information bar
│   ├── context/             # React context
│   │   └── SidebarContext.jsx
│   ├── services/            # API services
│   │   └── api.js
│   ├── assets/              # Static assets
│   ├── App.jsx              # Main application component
│   └── main.jsx             # Application entry point
├── server/
│   ├── data/                # JSON data files
│   │   ├── users.json       # User data
│   │   └── vehicle_data.json # Vehicle pollution data
│   ├── server.js            # Express server
│   └── package.json         # Backend dependencies
├── public/                  # Public assets
├── package.json             # Frontend dependencies
└── vite.config.js          # Vite configuration
```

## 🔧 API Endpoints

### Vehicle Data
- `GET /api/vehicles` - Retrieve all vehicle data
- `POST /api/vehicles` - Add new vehicle data
- `DELETE /api/vehicles` - Delete vehicle data

### User Management
- `GET /api/users` - Retrieve all users
- `POST /api/users` - Create new user
- `DELETE /api/users` - Delete user and associated data

## 📊 Data Structure

### Vehicle Data
```json
{
  "vehicleNumber": "string",
  "ownerName": "string",
  "dateOfEntry": "dd-MM-yyyy",
  "expiryDate": "dd-MM-yyyy",
  "amount": "number",
  "username": "string"
}
```

### User Data
```json
{
  "username": "string",
  "password": "string",
  "role": "string"
}
```

## 🎨 Key Features in Detail

### Dashboard
- Real-time statistics display
- Expiring certificate alerts
- Financial overview (daily/monthly collections)
- Quick access to main functions

### Data Entry
- Comprehensive vehicle information form
- Date picker for entry and expiry dates
- Amount calculation
- Form validation

### Reports
- Interactive charts and graphs
- Filterable data views
- Export capabilities
- Historical data analysis

### User Management
- Role-based access control
- User data isolation
- Secure authentication

## 🔒 Security Features

- User authentication and session management
- Role-based access control
- Data isolation between users
- Input validation and sanitization

## 🚀 Deployment

### Frontend Deployment
The application can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3

### Backend Deployment
The server can be deployed to:
- Heroku
- DigitalOcean
- AWS EC2
- Railway

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Material-UI for the component library
- Recharts for data visualization
- Express.js community for the backend framework

## 📞 Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

---

**Note**: This is a data management system for pollution testing centers. Make sure to comply with local regulations and data protection laws when using this application in production environments.
