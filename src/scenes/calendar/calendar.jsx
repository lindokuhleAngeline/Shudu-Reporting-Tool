import React, { useState, useEffect } from "react";
import FullCalendar, { formatDate } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { db } from "../../utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";




const Calendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode) || {
    primary: { 400: "#FFFFFF" },
    greenAccent: { 500: "#00FF00" },
    blueAccent: { 500: "#0000FF" },
    redAccent: { 500: "#FF0000" },
    yellowAccent: { 500: "#FFFF00" },
  };
  const [currentEvents, setCurrentEvents] = useState([]);
  const [loading, setLoading] = useState(true);




  useEffect(() => {
    const fetchBoards = async (userId) => {
      try {
        const boardsRef = collection(db, "boards");
        const querySnapshot = await getDocs(boardsRef);




        const today = new Date().toISOString().split("T")[0];




        const events = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((board) =>
            board.members.some((member) => member.id === userId)
          )
          .filter((board) => board.status !== "complete") // Skip "complete" boards
          .map((board) => {
            const eventDate = board.deadline.toDate().toISOString().split("T")[0];




            return {
              id: board.id,
              title: board.boardName,
              date: eventDate,
              backgroundColor: eventDate === today ? colors.redAccent[500] : getEventColor(board.status),
              className: eventDate === today ? "blink-event" : "", // Apply blinking effect for today's events
            };
          });




        setCurrentEvents(events);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching boards:", error);
        setLoading(false);
      }
    };




    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchBoards(user.uid);
      } else {
        console.error("No user is logged in.");
        setLoading(false);
      }
    });
  }, []);




  const getEventColor = (status) => {
    switch (status) {
      case "in-progress":
        return colors.blueAccent[500];
      case "pending":
        return colors.yellowAccent[500];
      case "urgent":
        return colors.redAccent[500];
      default:
        return colors.greenAccent[500];
    }
  };




  const handleDateClick = (selected) => {
    const title = prompt("Please enter a new title for your event");
    const calendarApi = selected.view.calendar;
    calendarApi.unselect();




    if (title) {
      calendarApi.addEvent({
        id: `${selected.dateStr}-${title}`,
        title,
        start: selected.startStr,
        end: selected.endStr,
        allDay: selected.allDay,
        backgroundColor: colors.greenAccent[500], // Default color for new events
      });
    }
  };




  const handleEventClick = (selected) => {
    if (
      window.confirm(
        `Are you sure you want to delete the event '${selected.event.title}'`
      )
    ) {
      selected.event.remove();
    }
  };




  if (loading) {
    return (
      <Box m="20px">
        <Typography>Loading events...</Typography>
      </Box>
    );
  }




  if (!currentEvents.length) {
    return (
      <Box m="20px">
        <Typography>No events found for this user.</Typography>
      </Box>
    );
  }




  return (
    <Box m="20px">
      <Header title="Calendar" subtitle="Full Calendar Interactive Page" />




      {/* Add the blinking animation inside the component */}
      <Box component="style">
        {`
          @keyframes blinker {
            50% {
              opacity: 0;
            }
          }
        `}
      </Box>




      <Box display="flex" justifyContent="space-between">
        {/* CALENDAR SIDEBAR */}
        <Box
          flex="1 1 20%"
          backgroundColor={colors.primary[400]}
          p="15px"
          borderRadius="4px"
        >
          <Typography variant="h5">Events</Typography>
          <List>
            {currentEvents.map((event) => (
              <ListItem
                key={event.id}
                sx={{
                  backgroundColor: event.backgroundColor,
                  margin: "10px 0",
                  borderRadius: "2px",
                  animation: event.className === "blink-event" ? "blinker 1s linear infinite" : "none",
                }}
              >
                <ListItemText
                  primary={event.title}
                  secondary={
                    <Typography>
                      {formatDate(event.date, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>




        {/* CALENDAR */}
        <Box flex="1 1 100%" ml="15px">
          <FullCalendar
            height="75vh"
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            }}
            initialView="dayGridMonth"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            select={handleDateClick}
            eventClick={handleEventClick}
            events={currentEvents}
          />
        </Box>
      </Box>
    </Box>
  );
};




export default Calendar;