import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  ArrowBack,
  Dashboard,
  CalendarToday,
  Description,
  Person
} from '@mui/icons-material';
import { db } from '../../utils/firebase';
import { doc, onSnapshot } from 'firebase/firestore';


const BoardDetailsPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'boards', boardId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setBoard({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            deadline: data.deadline?.toDate(),
            members: data.members || []
          });
          setLoading(false);
        } else {
          setError('Board not found');
          setLoading(false);
        }
      },
      (error) => {
        setError('Error loading board details');
        setLoading(false);
        console.error("Error fetching board:", error);
      }
    );


    return () => unsubscribe();
  }, [boardId]);


  const getPriorityColor = (priority) => {
    const colors = {
      High: '#ff1744',
      Medium: '#ff9100',
      Low: '#00e676',
    };
    return colors[priority] || '#9e9e9e';
  };


  const getStatusColor = (status) => {
    const colors = {
      'To do': theme.palette.info.main,
      'In Progress': '#ff5722',
      'On Hold': theme.palette.warning.main,
      'Completed': theme.palette.success.main,
    };
    return colors[status] || '#9e9e9e';
  };


  const formatDate = (date) => {
    if (!date) return "No date set";
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }


  if (error) {
    return (
      <Box m="20px" textAlign="center">
        <Typography variant="h6" color="error">{error}</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{
            color: 'white',
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            }
          }}
        >
          Back to Boards
        </Button>
      </Box>
    );
  }


  return (
    <Box m="20px">
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{
          mb: 3,
          color: theme.palette.mode === 'dark' ? 'white' : 'inherit',
          borderColor: theme.palette.mode === 'dark' ? 'white' : 'inherit',
          '&:hover': {
            borderColor: theme.palette.mode === 'dark' ? 'white' : 'inherit',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'inherit',
          }
        }}
      >
        Back to Boards
      </Button>


      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Dashboard
              fontSize="large"
              sx={{
                color: theme.palette.mode === 'dark'
                  ? theme.palette.primary.light
                  : theme.palette.primary.main
              }}
            />
            <Typography variant="h4">{board.boardName}</Typography>
          </Box>


          <Box display="flex" gap={2} mb={3}>
            <Chip
              label={board.priority}
              sx={{
                backgroundColor: getPriorityColor(board.priority),
                color: 'white'
              }}
            />
            <Chip
              label={board.status}
              sx={{
                backgroundColor: getStatusColor(board.status),
                color: 'white'
              }}
            />
          </Box>


          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              <Description sx={{ verticalAlign: 'middle', mr: 1 }} />
              Description
            </Typography>
            <Typography variant="body1">{board.description}</Typography>
          </Box>


          <Divider sx={{ my: 3 }} />


          <Box display="flex" gap={4} mb={3}>
            <Box>
              <Typography variant="subtitle1" color="text.secondary">
                <CalendarToday sx={{ verticalAlign: 'middle', mr: 1 }} />
                Created At
              </Typography>
              <Typography variant="body1">
                {formatDate(board.createdAt)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" color="text.secondary">
                <CalendarToday sx={{ verticalAlign: 'middle', mr: 1 }} />
                Deadline
              </Typography>
              <Typography variant="body1">
                {formatDate(board.deadline)}
              </Typography>
            </Box>
          </Box>


          <Divider sx={{ my: 3 }} />


          <Typography variant="h6" gutterBottom>
            Team Members
          </Typography>
          <List>
            {board.members.map((member) => (
              <ListItem key={member.id}>
                <ListItemAvatar>
                  <Avatar>
                    {member.name?.[0] || <Person />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.name}
                  secondary={member.email}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};


export default BoardDetailsPage;



