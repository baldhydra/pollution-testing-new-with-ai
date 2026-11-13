import React from "react";
import { Box, List, ListItem, ListItemText, IconButton, Tooltip } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddBoxIcon from '@mui/icons-material/AddBox';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useSidebar } from '../context/SidebarContext';

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "New Entry", path: "/entry", icon: <AddBoxIcon /> },
  { label: "Reports & Export", path: "/reports", icon: <AssessmentIcon /> },
  { label: "Overview", path: "/overview", icon: <BarChartIcon /> },
  { label: "AI Assistant", path: "/ai-chat", icon: <SmartToyIcon /> },
];

const Sidebar = () => {
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <Box
      sx={{
        width: isOpen ? 250 : 70,
        backgroundColor: "#ffeb3b",
        height: "100vh",
        padding: 2,
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        transition: 'width 0.3s ease',
        overflow: 'hidden',
      }}
    >
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          color: '#222',
          marginBottom: 2,
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
        }}
      >
        <MenuIcon />
      </IconButton>
      <List>
        {navItems.map((item) => (
          <Tooltip
            key={item.path}
            title={!isOpen ? item.label : ""}
            placement="right"
          >
            <ListItem
              button
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 1,
                mb: 1,
                backgroundColor: location.pathname === item.path ? '#fffde7' : 'inherit',
                fontWeight: location.pathname === item.path ? 700 : 400,
                minHeight: 48,
                justifyContent: isOpen ? 'flex-start' : 'center',
                px: isOpen ? 2 : 2.5,
              }}
            >
              {item.icon}
              {isOpen && (
                <ListItemText
                  primary={item.label}
                  sx={{
                    ml: 2,
                    '& .MuiTypography-root': {
                      fontWeight: 'inherit',
                    },
                  }}
                />
              )}
            </ListItem>
          </Tooltip>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;