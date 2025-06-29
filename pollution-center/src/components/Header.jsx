import React from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";

const Header = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: "#ffffff", color: "#000" }}>
      <Toolbar>
        <Typography variant="h6">Pollution Data Manager</Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;