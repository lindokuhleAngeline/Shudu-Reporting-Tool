import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Avatar,
  Divider,
  Pagination,
  useTheme,
  Collapse,
  IconButton,
  Menu,
  MenuItem,
  alpha,
  Grid,
  useMediaQuery,
} from "@mui/material";
import {
  Search,
  Person,
  ExpandMore,
  ExpandLess,
  Dashboard,
  CalendarToday,
  Download,
} from "@mui/icons-material";
import Header from "../../components/Header";
import WeeklyReportDownloader from "../downloadReport";
import { db } from "../../utils/firebase";
import {
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";


const AdminEmployeeBoards = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);
  const [boards, setBoards] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 5;


  useEffect(() => {
    const usersUnsubscribe = onSnapshot(
      query(collection(db, "users"), where("role", "==", "employee")),
      (snapshot) => {
        const employeesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          name:
            `${doc.data().firstName || ""} ${
              doc.data().surname || ""
            }`.trim() || "Unknown",
          email: doc.data().email || "No email",
        }));
        setEmployees(employeesData);
      }
    );


    const boardsUnsubscribe = onSnapshot(
      collection(db, "boards"),
      (snapshot) => {
        const boardsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          const convertFirestoreDate = (field) => {
            if (!field) return null;
            if (field.toDate) return field.toDate();
            if (typeof field === "string") return new Date(field);
            return new Date(field.seconds * 1000);
          };


          return {
            id: doc.id,
            ...data,
            createdAt: convertFirestoreDate(data.createdAt),
            deadline: convertFirestoreDate(data.deadline),
            members:
              data.members?.map((member) => ({
                ...member,
                name: member.name || "Unknown member",
                email: member.email || "No email",
              })) || [],
            completionPercentage: data.completionPercentage || 0,
          };
        });
        setBoards(boardsData);
        setIsLoading(false);
      }
    );


    return () => {
      usersUnsubscribe();
      boardsUnsubscribe();
    };
  }, []);


  const getEmployeeBoards = (employeeId) => {
    return boards.filter((board) => board.memberIds?.includes(employeeId));
  };


  const getStatusColor = (status) => {
    const colors = {
      "To do": theme.palette.info.main,
      "In Progress": "#ff5722",
      "On Hold": theme.palette.warning.main,
      Completed: theme.palette.success.main,
    };
    return colors[status] || theme.palette.text.secondary;
  };


  const handleDownload = async (board, format) => {
    if (format === "pdf") {
      try {
        const doc = new jsPDF();
        let yOffset = 10;


        // Fetch tasks for this board
        const tasksSnapshot = await getDocs(
          collection(db, `boards/${board.id}/tasks`)
        );
        const tasksData = tasksSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));


        // Group tasks by status
        const tasksByStatus = tasksData.reduce((acc, task) => {
          if (!acc[task.status]) {
            acc[task.status] = [];
          }
          acc[task.status].push(task);
          return acc;
        }, {});


        // Set title
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text(`Board Report: ${board.boardName}`, 10, yOffset);
        yOffset += 15;


        // Board Details
        doc.setFontSize(12);
        const details = [
          { label: "Status:", value: board.status },
          {
            label: "Description:",
            value: board.description || "No description",
          },
          { label: "Total Tasks:", value: tasksData.length },
        ];


        // Add details
        details.forEach(({ label, value }) => {
          doc.setFont(undefined, "bold");
          doc.text(label, 10, yOffset);
          doc.setFont(undefined, "normal");
          doc.text(value.toString(), 45, yOffset);
          yOffset += 10;
        });


        // Add members section
        yOffset += 5;
        doc.setFont(undefined, "bold");
        doc.text("Members:", 10, yOffset);
        yOffset += 7;


        const members =
          board.members?.map((m) => `${m.name} (${m.email})`) || [];
        members.forEach((member, index) => {
          doc.setFont(undefined, "normal");
          doc.text(`• ${member}`, 15, yOffset + index * 7);
        });
        yOffset += members.length * 7 + 10;


        // Add tasks section grouped by status
        doc.setFont(undefined, "bold");
        doc.text("Tasks by Status:", 10, yOffset);
        yOffset += 10;


        if (tasksData.length === 0) {
          doc.setFont(undefined, "normal");
          doc.text("No tasks found for this board", 15, yOffset);
          yOffset += 10;
        } else {
          Object.entries(tasksByStatus).forEach(([status, tasks]) => {
            if (yOffset > 280) {
              doc.addPage();
              yOffset = 10;
            }


            doc.setFont(undefined, "bold");
            doc.text(`${status}:`, 15, yOffset);
            yOffset += 7;


            tasks.forEach((task, index) => {
              doc.setFont(undefined, "normal");
              doc.text(`${task.title}`, 20, yOffset);
              yOffset += 7;


              if (task.checklist?.length > 0) {
                doc.text("Checklist:", 20, yOffset);
                yOffset += 7;
                task.checklist.forEach((item) => {
                  doc.text(
                    `  ${item.completed ? "✓" : "◻"} ${item.text}`,
                    25,
                    yOffset
                  );
                  yOffset += 7;
                });
              }


              yOffset += 5; // Space between tasks
            });


            yOffset += 10; // Space between status groups
          });
        }


        doc.save(`${board.boardName.replace(/\s+/g, "_")}.pdf`);
      } catch (err) {
        console.error("Error generating PDF:", err);
        alert("Failed to generate PDF report");
      }
    }
  };
  const handleMenuOpen = (event, board) => {
    setAnchorEl(event.currentTarget);
    setSelectedBoard(board);
  };


  const handleMenuClose = () => {
    setAnchorEl(null);
  };


  const formatDate = (date) => {
    if (!date) return "No date set";
    if (typeof date === "string") date = new Date(date);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  if (isLoading) {
    return (
      <Box
        m="20px"
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
      >
        <Typography variant="h6" color="text.secondary">
          Loading employee data...
        </Typography>
      </Box>
    );
  }


  return (
    <Box
      sx={{
        p: theme.spacing(4),
        maxWidth: 1440,
        margin: "0 auto",
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 2 : 0,
        }}
      >
        <Header
          title="Employee Boards"
          subtitle="Team Project Management"
          sx={{ mb: isMobile ? 2 : 0 }}
        />


        {/* Search Bar */}
        <Box sx={{ width: isMobile ? "100%" : "40%" }}>
          <TextField
            fullWidth
            variant="outlined"
            size="medium"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search
                  sx={{
                    color: theme.palette.text.secondary,
                    mr: 2,
                    fontSize: "1.2rem",
                  }}
                />
              ),
              sx: {
                backgroundColor: theme.palette.background.paper,
                borderRadius: "8px",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.divider,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </Box>
      </Box>


      {/* Weekly Report Downloader */}
      <WeeklyReportDownloader
        boards={boards}
        employees={employees}
        sx={{ mb: 4 }}
      />


      {/* Employee Cards */}
      {paginatedEmployees.map((employee) => {
        const employeeBoards = getEmployeeBoards(employee.id);
        return (
          <Card
            key={employee.id}
            sx={{
              mb: 3,
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[1],
              transition: "box-shadow 0.3s ease",
              "&:hover": {
                boxShadow: theme.shadows[4],
              },
              borderRadius: "12px",
            }}
          >
            <CardContent sx={{ p: theme.spacing(3) }}>
              {/* Employee Header */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.03),
                  },
                  borderRadius: "8px",
                  p: 1,
                }}
                onClick={() =>
                  setSelectedEmployee(
                    selectedEmployee?.id === employee.id ? null : employee
                  )
                }
              >
                <Box display="flex" alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.common.white,
                      mr: 3,
                      width: 48,
                      height: 48,
                      fontSize: "1.2rem",
                    }}
                  >
                    {employee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h6"
                      color="text.primary"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {employee.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <span>{employee.email}</span>
                      <Chip
                        label={`${employeeBoards.length} projects`}
                        size="small"
                        sx={{
                          backgroundColor: alpha(
                            theme.palette.text.secondary,
                            0.1
                          ),
                          color: "red",
                          fontWeight: 500,
                          height: 20,
                        }}
                      />
                    </Typography>
                  </Box>
                </Box>
                {selectedEmployee?.id === employee.id ? (
                  <ExpandLess sx={{ color: theme.palette.text.secondary }} />
                ) : (
                  <ExpandMore sx={{ color: theme.palette.text.secondary }} />
                )}
              </Box>


              {/* Boards Collapse Section */}
              <Collapse in={selectedEmployee?.id === employee.id}>
                <Divider sx={{ my: 3, borderColor: theme.palette.divider }} />


                {employeeBoards.length === 0 ? (
                  <Box
                    sx={{
                      p: 3,
                      textAlign: "center",
                      backgroundColor: alpha(theme.palette.text.primary, 0.02),
                      borderRadius: "8px",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No boards assigned to this employee
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {employeeBoards.map((board) => (
                      <Grid item xs={12} sm={6} md={4} key={board.id}>
                        <Card
                          component={Link}
                          to={`/admin/boards/${board.id}`}
                          sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            textDecoration: "none",
                            backgroundColor:
                              theme.palette.mode === "light"
                                ? alpha(getStatusColor(board.status), 0.05)
                                : alpha(getStatusColor(board.status), 0.15),
                            borderLeft: `4px solid ${getStatusColor(
                              board.status
                            )}`,
                            transition: "transform 0.2s, box-shadow 0.2s",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: theme.shadows[3],
                            },
                          }}
                        >
                          <CardContent
                            sx={{
                              p: theme.spacing(2.5),
                              flexGrow: 1,
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            {/* Board Header */}
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                mb: 2,
                              }}
                            >
                              <Dashboard
                                sx={{
                                  color: getStatusColor(board.status),
                                  fontSize: "1.8rem",
                                  mt: 0.5,
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleMenuOpen(e, board);
                                }}
                                sx={{
                                  color: theme.palette.text.secondary,
                                  "&:hover": {
                                    backgroundColor: alpha(
                                      theme.palette.primary.main,
                                      0.1
                                    ),
                                  },
                                }}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </Box>


                            {/* Board Content */}
                            <Box flexGrow={1}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 600,
                                  mb: 1.5,
                                  color: theme.palette.text.primary,
                                }}
                              >
                                {board.boardName}
                              </Typography>
                              <Chip
                                label={board.status}
                                size="small"
                                sx={{
                                  backgroundColor: getStatusColor(board.status),
                                  color: theme.palette.getContrastText(
                                    getStatusColor(board.status)
                                  ),
                                  fontWeight: 500,
                                  px: 1,
                                  borderRadius: "4px",
                                }}
                              />
                            </Box>


                            {/* Deadline and Completion Percentage Section */}
                            <Box mt={2}>
                              <Divider sx={{ mb: 1.5 }} />
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <CalendarToday
                                  sx={{
                                    fontSize: "1rem",
                                    color: theme.palette.text.secondary,
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    fontWeight: 500,
                                  }}
                                >
                                  Deadline: {formatDate(board.deadline)}
                                </Typography>
                              </Box>
                              {/* Completion Percentage */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                  mt: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    fontWeight: 500,
                                  }}
                                >
                                  Completion: {board.completionPercentage || 0}%
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Collapse>
            </CardContent>
          </Card>
        );
      })}


      {/* Download Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[3],
            minWidth: 180,
            borderRadius: "8px",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleDownload(selectedBoard, "pdf");
            handleMenuClose();
          }}
          sx={{ typography: "body2", py: 1.5 }}
        >
          Download as PDF
        </MenuItem>
      </Menu>


      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Pagination
          count={Math.ceil(filteredEmployees.length / itemsPerPage)}
          page={currentPage}
          onChange={(e, page) => setCurrentPage(page)}
          color="primary"
          shape="rounded"
          sx={{
            "& .MuiPaginationItem-root": {
              fontWeight: 500,
              color: theme.palette.text.secondary,
            },
            "& .Mui-selected": {
              backgroundColor: `${theme.palette.primary.main} !important`,
              color: theme.palette.common.white,
              boxShadow: theme.shadows[1],
            },
            "& .MuiPaginationItem-root:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        />
      </Box>
    </Box>
  );
};


export default AdminEmployeeBoards;





