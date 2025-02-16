import React, { useContext, useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Divider,
  Button,
  InputBase,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  DarkModeOutlined,
  LightModeOutlined,
  NotificationsOutlined,
  PersonOutlined,
  EditOutlined,
  LogoutOutlined,
  Search as SearchIcon,
  Event as EventIcon,
  PersonAdd as PersonAddIcon,
  FiberManualRecord as DotIcon,
} from "@mui/icons-material";
import { ColorModeContext, tokens } from "../../theme";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../utils/firebase";
import { onAuthStateChanged } from "firebase/auth";

const Topbar = ({ onLogout }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(new Set());
  const [user, setUser] = useState({
    firstName: "",
    surname: "",
    email: "",
  });
  const [authError, setAuthError] = useState(null);
  const open = Boolean(anchorEl);
  const notificationOpen = Boolean(notificationAnchorEl);

  // Fetch user details on page refresh or auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/Login", { replace: true });
      } else {
        // Fetch user details from Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            firstName: userData.firstName,
            surname: userData.surname,
            email: userData.email,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      setAuthError(null);
      await auth.signOut();
      handleMenuClose();
    } catch (error) {
      setAuthError(error.message);
      console.error("Error logging out:", error);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const getInitials = (firstName, surname) => {
    return `${firstName?.charAt(0) || ''}${surname?.charAt(0) || ''}`;
  };

  const handleEditProfile = () => {
    // Add your logic for editing the profile here
    console.log("Edit Profile clicked");
  };

  const groupNotificationsByDate = (notifications) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groupedNotifications = {
      Today: [],
      Yesterday: [],
      Older: [],
    };

    notifications.forEach((notification) => {
      const notificationDate = new Date(notification.timestamp);
      const notificationDay = new Date(
        notificationDate.getFullYear(),
        notificationDate.getMonth(),
        notificationDate.getDate()
      );

      if (notificationDay.getTime() === today.getTime()) {
        groupedNotifications.Today.push(notification);
      } else if (notificationDay.getTime() === yesterday.getTime()) {
        groupedNotifications.Yesterday.push(notification);
      } else {
        groupedNotifications.Older.push(notification);
      }
    });

    return groupedNotifications;
  };

  const reclassifyNotifications = () => {
    const now = new Date().getTime();
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => {
        const notificationTime = notification.timestamp;
        const timeDiff = now - notificationTime;

        if (timeDiff > 24 * 60 * 60 * 1000) {
          return {
            ...notification,
            timestamp: notificationTime - 24 * 60 * 60 * 1000,
          };
        }
        return notification;
      })
    );
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "boards"), async (snapshot) => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      for (const change of snapshot.docChanges()) {
        if (change.type === "added") {
          const newBoard = {
            ...change.doc.data(),
            memberIds: change.doc.data().memberIds || [],
          };

          if (newBoard.memberIds?.includes(currentUser.uid) && newBoard.createdBy !== currentUser.uid) {
            const creatorDoc = await getDoc(doc(db, "users", newBoard.createdBy));
            const creatorName = creatorDoc.exists()
              ? creatorDoc.data().firstName
              : "Unknown User";

            const notification = {
              id: `board-${newBoard.id}-${Date.now()}`,
              message: `${creatorName} added you to ${newBoard.boardName}`,
              type: "board",
              read: false,
              timestamp: new Date().getTime(),
              boardId: newBoard.id, // Add boardId to the notification
            };

            setNotifications((prev) => [...prev, notification]);
            setUnreadNotifications((prev) => new Set(prev).add(notification.id));
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleNotificationItemClick = (id, boardId) => {
    setUnreadNotifications((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    if (boardId) {
      navigate(`/boards/${boardId}`); // Navigate to the board's page
    }
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* SEARCH BAR */}
      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="3px"
        width="40%"
      >
        <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search..." />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Box>

      {/* ICONS AND PROFILE MENU */}
      <Box display="flex" alignItems="center">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlined />
          ) : (
            <LightModeOutlined />
          )}
        </IconButton>
        <IconButton onClick={handleNotificationClick}>
          <Badge badgeContent={unreadNotifications.size} color="error">
            <NotificationsOutlined />
          </Badge>
        </IconButton>
        <IconButton
          onClick={handleMenuClick}
          aria-controls={open ? "profile-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <PersonOutlined />
        </IconButton>

        {/* NOTIFICATION POPUP */}
        <Popover
          open={notificationOpen}
          anchorEl={notificationAnchorEl}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <Box p={2} width={350} maxHeight={400} sx={{ overflowY: "auto" }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Notifications
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {unreadNotifications.size} unread
              </Typography>
            </Box>

            {Object.entries(groupedNotifications).map(
              ([dateGroup, groupNotifications]) =>
                groupNotifications.length > 0 && (
                  <Box key={dateGroup}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      sx={{
                        mt: 2,
                        mb: 1,
                        color: colors.blueAccent[500],
                        textTransform: "uppercase",
                      }}
                    >
                      {dateGroup}
                    </Typography>
                    <List dense>
                      {groupNotifications.map((notification) => {
                        const isUnread = unreadNotifications.has(notification.id);
                        return (
                          <ListItem
                            key={notification.id}
                            button
                            onClick={() =>
                              handleNotificationItemClick(notification.id, notification.boardId)
                            }
                            sx={{
                              mb: 1,
                              borderRadius: "4px",
                              backgroundColor: isUnread
                                ? colors.primary[400]
                                : colors.primary[200],
                              transition: "all 0.2s ease",
                              "&:hover": {
                                backgroundColor: colors.primary[500],
                              },
                              borderLeft: isUnread
                                ? `3px solid ${colors.blueAccent[500]}`
                                : "none",
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              {notification.type === "board" ? (
                                <PersonAddIcon
                                  sx={{
                                    color: isUnread
                                      ? colors.blueAccent[500]
                                      : colors.grey[500],
                                  }}
                                />
                              ) : (
                                <EventIcon
                                  sx={{
                                    color: isUnread
                                      ? colors.redAccent[500]
                                      : colors.grey[500],
                                  }}
                                />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: isUnread ? 600 : 400,
                                    color: isUnread
                                      ? colors.grey[100]
                                      : colors.grey[400],
                                  }}
                                >
                                  {notification.message}
                                </Typography>
                              }
                            />
                            {isUnread && (
                              <DotIcon
                                sx={{
                                  fontSize: 12,
                                  color: colors.blueAccent[500],
                                  ml: 1,
                                }}
                              />
                            )}
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                )
            )}
          </Box>
        </Popover>

        {/* PROFILE MENU */}
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <Box p={2} width={250}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Avatar>{getInitials(user.firstName, user.surname)}</Avatar>
              <Box>
                <Typography fontWeight="bold">
                  {user.firstName} {user.surname}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<EditOutlined />}
              fullWidth
              onClick={handleEditProfile}
              sx={{
                mb: 2,
                color: colors.blueAccent[500],
                borderColor: colors.blueAccent[500],
                "&:hover": {
                  backgroundColor: colors.blueAccent[500],
                  color: colors.grey[100],
                },
              }}
            >
              Edit Profile
            </Button>
            <Divider />
            <MenuItem onClick={onLogout}>
              <LogoutOutlined sx={{ mr: 1 }} />
              <Typography>Logout</Typography>
            </MenuItem>
          </Box>
        </Menu>
      </Box>
    </Box>
  );
};

export default Topbar;
