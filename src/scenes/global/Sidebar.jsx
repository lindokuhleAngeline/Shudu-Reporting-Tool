import { React, useState, useEffect } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { auth, db } from "../../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import PolicyOutlinedIcon from "@mui/icons-material/PolicyOutlined";
import LeaveFormModal from './LeaveFormModal';

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colors.grey[100],
      }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Typography>{title}</Typography>
      <Link to={to} />
    </MenuItem>
  );
};

const handleDownloadForm = () => {
  const link = document.createElement("a");
  link.href = process.env.PUBLIC_URL + "/Shudu_Leave_Form_2025.pdf";
  link.download = "Shudu_Leave_Form_2025.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const [userData, setUserData] = useState({
    name: "Loading...",
    email: "Loading...",
  });
  const [isCEO, setIsCEO] = useState(false);
  const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);
  const handleLeaveFormClick = () => {
    setIsLeaveFormOpen(true);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Set CEO status directly from auth email
        setIsCEO(user.email === "lucky@shuduconnections.com");
  
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
  
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserData({
              name:
                `${data.firstName.charAt(0) || ""} ${
                  data.surname || ""
                }`.trim() || "User",
              position: data.position || "Position Not Set",
            });
          } else {
            // Handle case where user document does not exist
            setUserData({
              name: "User Name",
              position: "Position Not Set",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData({
            name: "User Name",
            position: "Position Not Set",
          });
        }
      } else {
        // Handle case where user is not authenticated
        setUserData({
          name: "User Name",
          position: "Position Not Set",
        });
      }
    });
  
    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
        },
        "& .pro-inner-item:hover": {
          color: "#868dfb !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colors.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Typography variant="h3" color={colors.grey[100]}>
                  SHUDU REPORT
                </Typography>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {!isCollapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="profile-user"
                  width="100px"
                  height="100px"
                  src={`../../assets/ShuCon.png`}
                  style={{ cursor: "pointer", borderRadius: "50%" }}
                />
              </Box>
              <Box textAlign="center">
                <Typography
                  variant="h2"
                  color={colors.grey[100]}
                  fontWeight="bold"
                  sx={{ m: "10px 0 0 0" }}
                >
                  {userData.name}
                </Typography>
                <Typography variant="h5" color={colors.greenAccent[500]}>
                  {userData.position}
                </Typography>
              </Box>

            </Box>
          )}

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title="HOME"
              to="/"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              WORKSPACE
            </Typography>

            <Item
              title="Boards"
              to="/boards"
              icon={<ReceiptOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Profile"
              to="/form"
              icon={<PersonOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            {/* Conditionally render the "Colleagues" menu item for the CEO */}
            {isCEO && (
              <Item
                title="Colleagues"
                to="/adminBoard"
                icon={<PeopleOutlinedIcon />}
                selected={selected}
                setSelected={setSelected}
              />
            )}

            <Item
              title="Create Board"
              to="/newBoard"
              icon={<AddCircleOutlineIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              DATA
            </Typography>
            <Item
              title="History"
              to="/invoices"
              icon={<ReceiptOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Calendar"
              to="/calendar"
              icon={<CalendarTodayOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Pie Chart"
              to="/pie"
              icon={<PieChartOutlineOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <MenuItem
              onClick={handleDownloadForm}
              icon={<PolicyOutlinedIcon />}
              style={{ color: colors.grey[100] }}
            >
              <Typography>Download Leave Form</Typography>
            </MenuItem>

            <Item
              title="Logout"
              to="/"
              icon={<LogoutOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            ></Typography>
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;
