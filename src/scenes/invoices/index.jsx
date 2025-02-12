import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  useTheme,
  Button,
  Menu,
  MenuItem
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../utils/firebase";




const HistoryPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);




  // Custom cell component for members dropdown
  const MemberDropdownCell = ({ members }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);




    const handleClick = (event) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    };




    const handleClose = () => {
      setAnchorEl(null);
    };




    return (
      <div>
        <Button
          onClick={handleClick}
          variant="outlined"
          size="small"
          sx={{
            padding: '4px 8px',
            fontSize: '0.875rem',
            color: '#ffff',
            textTransform: 'none',
            borderColor: colors.grey[300],
            '&:hover': {
              backgroundColor: colors.primary[300],
             
              borderColor: colors.greenAccent[600]
            }
          }}
        >
          {members.length} Members
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          PaperProps={{
            style: {
              maxHeight: 200,
              width: '20ch',
            },
          }}
        >
          {members.map((member, index) => (
            <MenuItem key={index} onClick={handleClose}>
              {member.name}
            </MenuItem>
          ))}
          {members.length === 0 && (
            <MenuItem disabled>No members</MenuItem>
          )}
        </Menu>
      </div>
    );
  };




  const columns = [
    // { field: "id", headerName: "Board ID", flex: 1 },
    { field: "boardName", headerName: "Board Name", flex: 1.5 },
    { field: "description", headerName: "Description", flex: 2 },
    { field: "deadline", headerName: "Deadline", flex: 1 },
    { field: "createdAt", headerName: "Created At", flex: 1 },
    { field: "status", headerName: "status", flex: 1 },
    {
      field: "members",
      headerName: "Members",
      renderCell: (params) => (
        <MemberDropdownCell members={params.value || []} />
      ),
    },
  ];






  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("You must be logged in to view your board history.");
          return;
        }




        const boardsRef = collection(db, "boards");
        const q = query(
          boardsRef,
          where("memberIds", "array-contains", currentUser.uid)
        );
        const snapshot = await getDocs(q);




        const boardsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          boardName: doc.data().boardName,
          description: doc.data().description,
          createdAt: doc.data().createdAt?.toDate().toLocaleDateString() || "N/A",
          deadline: doc.data().deadline?.toDate().toLocaleDateString() || "No Deadline",
          createdBy: doc.data().createdBy,
          status: doc.data().status,
          members: doc.data().members || [],
        }));




        setBoards(boardsData);
      } catch (err) {
        console.error("Error fetching boards:", err);
        setError("Failed to load boards. Please try again later.");
      } finally {
        setLoading(false);
      }
    };




    fetchBoards();
  }, []);




  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
        <Typography variant="h6">Loading...</Typography>
      </Box>
    );
  }




  if (error) {
    return (
      <Box m="20px">
        <Header title="HISTORY" subtitle="Your Board Activity" />
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      </Box>
    );
  }




  return (
    <Box m="20px">
      <Header title="HISTORY" subtitle="Your Board Activity" />
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
        }}
      >
        <DataGrid
          rows={boards}
          columns={columns}
          loading={loading}
          disableSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Box>
    </Box>
  );
};




export default HistoryPage;