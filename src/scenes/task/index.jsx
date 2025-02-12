import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Checkbox,
  CircularProgress,
  Link,
} from "@mui/material";
import {
  DragHandle,
  Edit as EditIcon,
  Add as AddIcon,
  People as PeopleIcon,
  ChevronLeft as ChevronLeftIcon,
  Delete as DeleteIcon,
  Description as DocumentIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../utils/firebase";
// import IconButton from '@mui/material/IconButton';
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";

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

const Task = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [boardDocument, setBoardDocument] = useState(null);
  const [tasks, setTasks] = useState({
    todo: [],
    doing: [],
    onHold: [],
    done: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const updateBoardCompletionPercentage = async (percentage) => {
    try {
      const boardRef = doc(db, "boards", boardId);
      await updateDoc(boardRef, {
        completionPercentage: percentage,
      });
    } catch (err) {
      console.error("Error updating board completion percentage:", err);
      setError("Failed to update board completion percentage");
    }
  };

  useEffect(() => {
    const percentage = calculateCompletionPercentage();
    updateBoardCompletionPercentage(percentage);
  }, [tasks]);

  const calculateCompletionPercentage = () => {
    const totalTasks =
      tasks.todo.length +
      tasks.doing.length +
      tasks.onHold.length +
      tasks.done.length;

    const completedTasks = tasks.done.length;

    if (totalTasks === 0) return 0;

    const percentage = Math.round((completedTasks / totalTasks) * 100);
    return Math.min(percentage, 100);
  };

  const getBoardStatus = () => {
    if (tasks.doing.length > 0) {
      return "In Progress";
    } else if (
      tasks.done.length ===
      tasks.todo.length +
        tasks.doing.length +
        tasks.onHold.length +
        tasks.done.length
    ) {
      return "Completed";
    } else {
      return "To Do";
    }
  };

  useEffect(() => {
    const status = getBoardStatus();
    console.log("Board Status:", status);

    const updateBoardStatus = async () => {
      try {
        const boardRef = doc(db, "boards", boardId);
        await updateDoc(boardRef, {
          status: status,
        });
      } catch (err) {
        console.error("Error updating board status:", err);
        setError("Failed to update board status");
      }
    };

    updateBoardStatus();
  }, [tasks]);

  const fetchBoardData = async () => {
    try {
      const boardRef = doc(db, "boards", boardId);
      const boardSnap = await getDoc(boardRef);

      if (!boardSnap.exists()) {
        throw new Error("Board not found");
      }
      const data = boardSnap.data();
      setBoard({
        id: boardSnap.id,
        ...data,
        backgroundImage:
          backgroundImages[Math.floor(Math.random() * backgroundImages.length)],
        completionPercentage: data.completionPercentage || 0,
      });

      // Set document URL if it exists
      if (data.documentURL) {
        setBoardDocument({
          url: data.documentURL,
          name: data.documentURL.split("/").pop(), // Extract filename from URL
        });
      }
    } catch (err) {
      console.error("Error fetching board:", err);
      setError("Failed to load board");
      navigate("/boards");
    }
  };

  const fetchTasks = () => {
    try {
      const tasksRef = collection(db, `boards/${boardId}/tasks`);
      const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
        const tasksData = {
          todo: [],
          doing: [],
          onHold: [],
          done: [],
        };
        snapshot.docs.forEach((doc) => {
          const task = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toLocaleString(),
            updatedAt: doc.data().updatedAt?.toDate().toLocaleString(),
          };
          if (tasksData[task.status]) {
            tasksData[task.status].push(task);
          } else {
            console.warn(`Invalid task status: ${task.status}`);
          }
        });
        setTasks(tasksData);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
    const unsubscribe = fetchTasks();
    return () => unsubscribe && unsubscribe();
  }, [boardId, navigate]);

  const handleDragStart = (e, taskId, sourceColumn) => {
    setDragging({ taskId, sourceColumn });
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    if (!dragging || dragging.sourceColumn === targetColumn) return;

    try {
      const taskRef = doc(db, `boards/${boardId}/tasks/${dragging.taskId}`);

      if (!["todo", "doing", "onHold", "done"].includes(targetColumn)) {
        throw new Error("Invalid target column");
      }

      await updateDoc(taskRef, {
        status: targetColumn,
        updatedAt: new Date(),
      });

      setTasks((prevTasks) => {
        const updatedTasks = { ...prevTasks };
        const taskIndex = updatedTasks[dragging.sourceColumn].findIndex(
          (task) => task.id === dragging.taskId
        );

        if (taskIndex !== -1) {
          const [task] = updatedTasks[dragging.sourceColumn].splice(
            taskIndex,
            1
          );
          task.status = targetColumn;
          updatedTasks[targetColumn].push(task);
        }

        return updatedTasks;
      });
    } catch (err) {
      console.error("Error updating task status:", err);
      setError("Failed to move task");
    }
    setDragging(null);
  };

  const handleAddTask = (column) => {
    setSelectedColumn(column);
    setIsAddTaskDialogOpen(true);
  };

  const handleEditTask = (task, column) => {
    setSelectedTask(task);
    setSelectedColumn(column);
    setNewTaskTitle(task.title);
    setIsEditTaskDialogOpen(true);
  };

  const handleAddTaskSubmit = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      if (!["todo", "doing", "onHold", "done"].includes(selectedColumn)) {
        throw new Error("Invalid column selected");
      }

      await addDoc(collection(db, `boards/${boardId}/tasks`), {
        title: newTaskTitle.trim(),
        status: selectedColumn,
        checklist: [],
        members: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setNewTaskTitle("");
      setIsAddTaskDialogOpen(false);
    } catch (err) {
      console.error("Error adding task:", err);
      setError("Failed to add task");
    }
  };

  const handleEditTaskSubmit = async () => {
    if (!newTaskTitle.trim() || !selectedTask) return;
    try {
      const taskRef = doc(db, `boards/${boardId}/tasks/${selectedTask.id}`);
      await updateDoc(taskRef, {
        title: newTaskTitle.trim(),
        updatedAt: new Date(),
      });
      setIsEditTaskDialogOpen(false);
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const taskRef = doc(db, `boards/${boardId}/tasks/${taskId}`);
      await deleteDoc(taskRef);
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task");
    }
  };

  const handleAddChecklistItem = async (task) => {
    if (!newChecklistItem.trim()) return;
    try {
      const taskRef = doc(db, `boards/${boardId}/tasks/${task.id}`);
      const newItem = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false,
      };
      await updateDoc(taskRef, { checklist: [...task.checklist, newItem] });
      setNewChecklistItem("");
    } catch (err) {
      console.error("Error adding checklist item:", err);
      setError("Failed to add checklist item");
    }
  };

  const handleToggleChecklistItem = async (task, itemId) => {
    try {
      const taskRef = doc(db, `boards/${boardId}/tasks/${task.id}`);
      const updatedChecklist = task.checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      await updateDoc(taskRef, {
        checklist: updatedChecklist,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("Error toggling checklist item:", err);
      setError("Failed to update checklist");
    }
  };

  const getDocumentName = (url) => {
    if (!url) return "";
  
    // Decode URL components
    let decodedUrl = decodeURIComponent(url);
  
    // Remove "documents/" or any prefix before the actual file name
    let fileName = decodedUrl.split("/").pop().split("?")[0];
  
    return fileName;
  };
  
  const DocumentDisplay = () => {
    if (!boardDocument) return null;
  
    const documentName = boardDocument.name || getDocumentName(boardDocument.url);
  
    return (
      <Box
        sx={{
          p: 2,
          mt: 2,
          mb: 2,
          display: "flex",
          alignItems: "center",
          bgcolor: "background.paper",
          borderRadius: 1,
          boxShadow: 1,
          width: "100%",
          maxWidth: "600px",
        }}
      >
        <DocumentIcon sx={{ mr: 2, color: "secondary.light" }} />
        <Typography variant="subtitle1" sx={{ mr: 2 }}>
          Attached Document:
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", flexGrow: 1 }}
        >
          {documentName}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={() => {
              const previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
                boardDocument.url
              )}`;
              window.open(previewUrl, "_blank");
            }}
            sx={{
              color: "secondary.main",
              "&:hover": {
                backgroundColor: "secondary.light",
                color: "secondary.dark",
              },
            }}
            size="small"
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              const link = document.createElement("a");
              link.href = boardDocument.url;
              link.download = documentName;
              link.click();
            }}
            sx={{
              color: "secondary.main",
              "&:hover": {
                backgroundColor: "secondary.light",
                color: "secondary.dark",
              },
            }}
            size="small"
          >
            <DownloadIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };
  
  

  const renderColumn = (columnId, columnTitle) => (
    <Box
      sx={{
        flex: "0 0 280px",
        mx: 1,
        p: 1.5,
        bgcolor: "background.paper",
        borderRadius: 3,
        boxShadow: 1,
        height: "fit-content",
        maxHeight: "90vh",
        overflowY: "auto",
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${board.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, columnId)}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
          position: "sticky",
          top: 0,
          bgcolor: "background.paper",
          zIndex: 1,
          py: 0.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {columnTitle} ({tasks[columnId].length})
        </Typography>
        <IconButton
          size="small"
          onClick={() => handleAddTask(columnId)}
          sx={{ p: 0.5 }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 1, minHeight: 40 }}
      >
        {tasks[columnId].map((task) => (
          <Box
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id, columnId)}
            sx={{
              p: 1.5,
              bgcolor: "rgba(0, 0, 0, 0.6)",
              borderRadius: 2,
              cursor: "move",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.7)", boxShadow: 1 },
              border: "1px solid",
              borderColor: "divider",
              backdropFilter: "blur(5px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <DragHandle
                sx={{
                  color: "text.secondary",
                  fontSize: 18,
                  mt: 0.25,
                  cursor: "grab",
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ lineHeight: 1.3, color: "white" }}
                >
                  {task.title}
                </Typography>
                {task.checklist.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mt: 0.5,
                      color: "text.secondary",
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={task.checklist.every((item) => item.completed)}
                      sx={{ p: 0.5, color: "white" }}
                    />
                    <Typography variant="caption" sx={{ color: "white" }}>
                      {task.checklist.filter((item) => item.completed).length}/
                      {task.checklist.length}
                    </Typography>
                  </Box>
                )}
              </Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditTask(task, columnId);
                }}
                sx={{ p: 0.5, color: "white" }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.id);
                }}
                sx={{ p: 0.5, color: "white" }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  if (loading) return <CircularProgress sx={{ margin: "auto", mt: 4 }} />;

  if (error || !board)
    return (
      <Box m="20px">
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Button
            startIcon={<ChevronLeftIcon />}
            onClick={() => navigate("/boards")}
          >
            Back to Boards
          </Button>
        </Box>
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      </Box>
    );

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: "background.paper",
          boxShadow: 1,
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}
        >
          {board.boardName}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            whiteSpace: "pre-line",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "center",
          }}
        >
          {board.description || "Manage project tasks"}
        </Typography>

        {/* Document Display */}
        <DocumentDisplay />

        <Button
          variant="contained"
          color="secondary"
          startIcon={<ChevronLeftIcon />}
          onClick={() => navigate("/boards")}
          sx={{
            mt: 2,
            boxShadow: 3,
            borderRadius: 2,
            textTransform: "uppercase",
            fontWeight: 600,
            px: 3,
            py: 1,
          }}
        >
          All Boards
        </Button>
      </Box>

      {/* Progress Bar */}
      <Box
        sx={{
          width: "80%",
          mx: "auto",
          mt: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            height: 10,
            bgcolor: "divider",
            borderRadius: 5,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${calculateCompletionPercentage()}%`,
              height: "100%",
              bgcolor: "success.main",
              borderRadius: 5,
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {calculateCompletionPercentage()}% - {getBoardStatus()}
        </Typography>
      </Box>

      {/* Task Columns */}
      <Box
        sx={{
          flexGrow: 1,
          overflowX: "auto",
          p: 3,
          display: "flex",
          gap: 3,
        }}
      >
        {renderColumn("todo", "To Do")}
        {renderColumn("doing", "In Progress")}
        {renderColumn("onHold", "On Hold")}
        {renderColumn("done", "Completed")}
      </Box>

      {/* Team Members Button */}
      <Button
        variant="contained"
        color="secondary"
        startIcon={<PeopleIcon />}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          boxShadow: 3,
          borderRadius: 2,
        }}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        Team ({board.members?.length || 0})
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {board.members?.map((member) => (
          <MenuItem key={member.id} dense>
            {member.name} ({member.email})
          </MenuItem>
        ))}
      </Menu>

      {/* Add Task Dialog */}
      <Dialog
        open={isAddTaskDialogOpen}
        onClose={() => setIsAddTaskDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Task Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsAddTaskDialogOpen(false)}
            sx={{ color: "error.main" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddTaskSubmit}
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog
        open={isEditTaskDialogOpen}
        onClose={() => setIsEditTaskDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Task Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsEditTaskDialogOpen(false)}
            sx={{ color: "error.main" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditTaskSubmit}
            sx={{ color: "primary.main", fontWeight: 600 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Task;
