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
  SettingsOutlined,
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
  getDocs,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../utils/firebase";
import LoginForm from "../Login";
import { onAuthStateChanged } from "firebase/auth";

const handleMenuClose = () => {
  // Perform any logout-related tasks here (e.g., clearing tokens, session data)
  console.log("User logged out");
  // Redirect to the login page
  navigate("/Login");
};

const onLogout = () => {
  // Clear authentication state (e.g., localStorage, context, etc.)
  localStorage.removeItem("isAuthenticated");
  navigate("/Login"); // Redirect to login page
};

const Topbar = ({ onLogout }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [boards, setBoards] = useState([]);
  const [users, setUsers] = useState({});
  const [unreadNotifications, setUnreadNotifications] = useState(new Set());
  const [user, setUser] = useState({
    firstName: "",
    surname: "",
    email: "",
  });
  const [authError, setAuthError] = useState(null);
  const open = Boolean(anchorEl);
  const notificationOpen = Boolean(notificationAnchorEl);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/Login", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      setAuthError(null);
      await auth.signOut();
      handleMenuClose();
      // Navigation will be handled by the auth state change listener
    } catch (error) {
      setAuthError(error.message);
      // Optionally show error to user through a toast/alert
      console.error("Error logging out:", error);
    }
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
    const fetchUsers = async () => {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const usersData = {};
      snapshot.docs.forEach((doc) => {
        usersData[doc.id] = doc.data();
      });
      setUsers(usersData);
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchBoards = async () => {
      const boardsRef = collection(db, "boards");
      const snapshot = await getDocs(boardsRef);
      const boardsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        memberIds: doc.data().memberIds || [],
      }));
      setBoards(boardsData);
    };

    fetchBoards();

    const unsubscribe = onSnapshot(
      collection(db, "boards"),
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === "added") {
            const newBoard = {
              ...change.doc.data(),
              memberIds: change.doc.data().memberIds || [],
            };
            const currentUser = auth.currentUser;

            if (
              newBoard.memberIds?.includes(currentUser.uid) &&
              newBoard.createdBy !== currentUser.uid
            ) {
              const creatorDoc = await getDoc(
                doc(db, "users", newBoard.createdBy)
              );
              const creatorName = creatorDoc.exists()
                ? creatorDoc.data().firstName
                : "Unknown User";

              const notification = {
                id: `board-${newBoard.id}-${Date.now()}`,
                message: `${creatorName} added you to ${newBoard.boardName}`,
                type: "board",
                read: false,
                timestamp: new Date().getTime(),
              };

              setNotifications((prev) => [...prev, notification]);
              setUnreadNotifications((prev) =>
                new Set(prev).add(notification.id)
              );
            }
          }
        }
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkDeadlines = () => {
      const currentUser = auth.currentUser;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      boards.forEach((board) => {
        if (board.memberIds?.includes(currentUser.uid)) {
          const deadline = board.deadline.toDate();
          const deadlineDate = new Date(
            deadline.getFullYear(),
            deadline.getMonth(),
            deadline.getDate()
          );

          if (deadlineDate.getTime() === tomorrow.getTime()) {
            const notification = {
              id: `${board.id}-tomorrow`,
              message: `Tomorrow's deadline: ${board.boardName}`,
              type: "deadline",
              read: false,
              timestamp: new Date().getTime(),
            };
            setNotifications((prev) => {
              if (!prev.some((n) => n.id === notification.id)) {
                return [...prev, notification];
              }
              return prev;
            });
            setUnreadNotifications((prev) =>
              new Set(prev).add(notification.id)
            );
          }

          if (deadlineDate.getTime() === today.getTime()) {
            const notification = {
              id: `${board.id}-today`,
              message: `Today's deadline: ${board.boardName}`,
              type: "deadline",
              read: false,
              timestamp: new Date().getTime(),
            };
            setNotifications((prev) => {
              if (!prev.some((n) => n.id === notification.id)) {
                return [...prev, notification];
              }
              return prev;
            });
            setUnreadNotifications((prev) =>
              new Set(prev).add(notification.id)
            );
          }
        }
      });
    };

    const interval = setInterval(checkDeadlines, 1000 * 60 * 60);
    checkDeadlines();

    return () => clearInterval(interval);
  }, [boards]);

  useEffect(() => {
    const interval = setInterval(reclassifyNotifications, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            firstName: userData.firstName || "",
            surname: userData.surname || "",
            email: userData.email || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const getInitials = (firstName, surname) => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || "";
    const surnameInitial = surname?.charAt(0)?.toUpperCase() || "";
    return `${firstInitial}${surnameInitial}`;
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditProfile = () => {
    navigate("/form");
    handleMenuClose();
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationItemClick = (id) => {
    setUnreadNotifications((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
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
        <IconButton>
          <SettingsOutlined />
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
                        const isUnread = unreadNotifications.has(
                          notification.id
                        );
                        return (
                          <ListItem
                            key={notification.id}
                            button
                            onClick={() =>
                              handleNotificationItemClick(notification.id)
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
          <Box p={2} width={200}>
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

            {/* <MenuItem onClick={handleMenuClose}>
              <SettingsOutlined sx={{ mr: 1 }} />
              <Typography>Settings</Typography>
            </MenuItem> */}

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
