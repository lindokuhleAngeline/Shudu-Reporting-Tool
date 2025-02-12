import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { tokens } from "../../theme";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EmailIcon from "@mui/icons-material/Email";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrafficIcon from "@mui/icons-material/Traffic";
import Header from "../../components/Header";
import LineChart from "../../components/LineChart";
import StatBox from "../../components/StatBox";
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import UserBoardsChart from "../userBoardsChart";
import { db, auth } from "../../utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [boards, setBoards] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [user, setUser] = useState({ firstName: "", surname: "" });
  const [currentUser] = useAuthState(auth);

  // Background images array
  const backgroundImages = [
    "/assets/bg1.jpg",
    "/assets/bg2.jpg",
    "/assets/bg3.jpg",
    "/assets/bg4.jpg",
    "/assets/bg5.jpg",
    "/assets/bg7.jpg",
    "/assets/bg8.jpg",
    "/assets/bg9.jpg",
    "/assets/bg10.jpg",
    "/assets/bg11.jpg",
    "/assets/bg12.jpg",
    "/assets/bg13.jpg",
    "/assets/bg14.jpg",
    "/assets/bg15.jpg",
    "/assets/bg16.jpg",
    "/assets/bg17.jpg",
    "/assets/bg18.jpg",
    "/assets/bg19.jpg",
    "/assets/bg20.jpg",
    "/assets/bg21.jpg",
    "/assets/bg22.jpg",
    "/assets/bg23.jpg",
    "/assets/bg24.jpg",
    "/assets/bg25.jpg",
  ];

  // Fetch users and boards from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!currentUser) return;

        // Fetch users
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);

        // Fetch boards where the current user is a member
        const boardsRef = collection(db, "boards");
        const boardsQuery = query(
          boardsRef,
          where("memberIds", "array-contains", currentUser.uid)
        );
        const boardsSnapshot = await getDocs(boardsQuery);
        const boardsData = boardsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          backgroundImage:
            backgroundImages[Math.floor(Math.random() * backgroundImages.length)],
        }));
        setBoards(boardsData);

        // Group tasks by user
        const groupedTasks = groupTasksByUser(boardsData, usersData);
        setUserTasks(groupedTasks);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [currentUser]);

  // Group tasks by user and select the most recent board for each user
  const groupTasksByUser = (boards, users) => {
    const grouped = {};

    // Initialize all users with default values
    users.forEach((user) => {
      grouped[user.id] = {
        user: `${user.firstName[0]} ${user.surname}`,
        boardName: "No boards",
        deadline: "No deadline",
      };
    });

    // Update users with their boards and deadlines
    boards.forEach((board) => {
      const user = users.find((user) => user.id === board.createdBy);
      if (user) {
        grouped[user.id] = {
          user: `${user.firstName[0]} ${user.surname}`,
          boardName: board.boardName,
          deadline: board.deadline,
        };
      }
    });

    return Object.values(grouped);
  };

  // Format timestamp to a readable date
  const formatDate = (deadline) => {
    if (!deadline || deadline === "No deadline") return "No deadline";

    let date;
    if (typeof deadline === "string") {
      date = new Date(deadline);
    } else if (deadline.toDate) {
      date = deadline.toDate();
    } else {
      return "Invalid deadline";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Truncate long board names
  const truncateBoardName = (name, maxLength = 20) => {
    if (name.length > maxLength) {
      return `${name.substring(0, maxLength)}...`;
    }
    return name;
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!auth) throw new Error("Firebase auth is not initialized");
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            firstName: userData.firstName || "",
            surname: userData.surname || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <Box m="20px" height="90vh" display="flex" flexDirection="column" overflow="auto">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header
          title="SHUDU CONNECTIONS"
          subtitle={`Welcome to reporting tool, ${user.firstName} ${user.surname}`}
        />
        <Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ChevronLeftIcon />}
            onClick={() => navigate("/boards")}
            sx={{
              ml: 2,
              boxShadow: 3,
              borderRadius: 2,
              textTransform: "uppercase",
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            View More
          </Button>
        </Box>
      </Box>

      {/* BOARDS GRID */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gap="20px"
        p="10px"
        sx={{ gridAutoRows: "minmax(140px, auto)" }}
      >
        {boards.slice(0, 4).map((board) => (
          <Box
            key={board.id}
            gridColumn="span 3"
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              borderRadius: "8px",
              boxShadow: 3,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 5,
                cursor: "pointer",
              },
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${board.backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: "white",
            }}
            onClick={() => navigate(`/boards/${board.id}`)}
          >
            <Card sx={{ 
              width: "100%", 
              height: "100%", 
              backgroundColor: "transparent", 
              boxShadow: "none" 
            }}>
              <CardContent>
                <Typography variant="h5" fontWeight="600" color="white">
                  {truncateBoardName(board.boardName)}
                </Typography>
                <Typography variant="body2" color="white">
                  {formatDate(board.deadline)}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* CHARTS GRID */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gap="20px"
        p="10px"
        sx={{ gridAutoRows: "minmax(140px, auto)" }}
      >
        {/* User Boards Distribution */}
        <Box gridColumn="span 8" gridRow="span 3" backgroundColor={colors.primary[400]}>
          <Box mt="25px" p="0 30px" display="flex" justifyContent="space-between">
            <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
              User Boards Distribution
            </Typography>
          </Box>
          <Box height="150px" m="-20px 0 0 0">
            <UserBoardsChart />
          </Box>
        </Box>

        {/* Current Tasks */}
        <Box
          gridColumn="span 4"
          gridRow="span 3"
          backgroundColor={colors.primary[400]}
          overflow="auto"
          maxHeight="470px"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            p="15px"
          >
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              Current Tasks
            </Typography>
          </Box>

          {userTasks.map((task, i) => (
            <Grid
              container
              key={`${task.user}-${i}`}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottom={`4px solid ${colors.primary[500]}`}
              p="15px"
            >
              <Grid item xs={4} display="flex" justifyContent="center">
                <Typography color={colors.greenAccent[500]} variant="h5" fontWeight="600">
                  {task.user}
                </Typography>
              </Grid>

              <Grid item xs={4} display="flex" justifyContent="center">
                <Typography color={colors.grey[100]}>{formatDate(task.deadline)}</Typography>
              </Grid>

              <Grid item xs={4} display="flex" justifyContent="center">
                <Typography
                  sx={{
                    backgroundColor: colors.greenAccent[500],
                    p: "5px 10px",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "150px",
                  }}
                >
                  {truncateBoardName(task.boardName)}
                </Typography>
              </Grid>
            </Grid>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;