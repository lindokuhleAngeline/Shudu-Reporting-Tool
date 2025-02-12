import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  ListItemText,
  Checkbox,
  ListItemIcon,
  Alert,
  IconButton,
  Chip,
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import useMediaQuery from "@mui/material/useMediaQuery";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, Timestamp, doc, getDoc } from "firebase/firestore";
import { db, auth, storage } from "../../utils/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CancelIcon from "@mui/icons-material/Cancel";

const AddBoard = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [fileUploading, setFileUploading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleFileUpload = async (files, uploaderName) => {
    if (!files || files.length === 0) return [];
    
    setFileUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const filename = `${uploaderName}_${Date.now()}_${file.name}`; // Include uploader's name in filename
        const storageRef = ref(storage, `documents/${filename}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { name: file.name, url: downloadURL, uploader: uploaderName }; // Include uploader's name in document metadata
      });

      const uploadedDocuments = await Promise.all(uploadPromises);
      setFileUploading(false);
      return uploadedDocuments;
    } catch (error) {
      console.error("Error uploading files:", error);
      setFileUploading(false);
      setError("Failed to upload files");
      return [];
    }
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("You must be logged in to create a board");
        return;
      }

      // Fetch the current user's details
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      const uploaderName = userDoc.exists()
        ? `${userDoc.data().firstName || ""} ${userDoc.data().surname || ""}`.trim()
        : "Unknown";

      // Upload all files and get their metadata
      let uploadedDocuments = [];
      if (files.length > 0) {
        uploadedDocuments = await handleFileUpload(files, uploaderName);
        if (uploadedDocuments.length !== files.length) {
          setError("Some files failed to upload");
          return;
        }
      }

      const creatorData = userDoc.exists()
        ? {
            id: currentUser.uid,
            name: uploaderName,
            email: userDoc.data().email,
          }
        : {
            id: currentUser.uid,
            name: "Unknown",
            email: currentUser.email || "Unknown",
          };

      const allMemberIds = [...new Set([currentUser.uid, ...values.members])];

      const boardData = {
        ...values,
        status: "To do",
        createdAt: Timestamp.now(),
        deadline: Timestamp.fromDate(new Date(values.deadline)),
        members: allMemberIds.map((memberId) => {
          const user = users.find((user) => user.id === memberId);
          return {
            id: user.id,
            name: `${user.firstName || ""} ${user.surname || ""}`.trim(),
            email: user.email,
          };
        }),
        memberIds: allMemberIds,
        createdBy: currentUser.uid,
        createdByDetails: creatorData,
        documents: uploadedDocuments, // Store array of documents with uploader's name
      };

      await addDoc(collection(db, "boards"), boardData);
      navigate("../boards");
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexGrow={1}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        flexGrow={1}
        m="20px"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Header title="CREATE BOARD" subtitle="Add a New Board to Your Workspace" />
        <Box width={isNonMobile ? "80%" : "100%"} maxWidth="800px">
          {error && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Formik
            onSubmit={handleFormSubmit}
            initialValues={initialValues}
            validationSchema={boardSchema}
          >
            {({
              values,
              errors,
              touched,
              handleBlur,
              handleChange,
              handleSubmit,
              setFieldValue,
              isSubmitting,
            }) => (
              <form onSubmit={handleSubmit}>
                <Box
                  display="grid"
                  gap="20px"
                  gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                  sx={{
                    "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                  }}
                >
                  <TextField
                    fullWidth
                    variant="filled"
                    type="text"
                    label="Board Name"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.boardName}
                    name="boardName"
                    error={!!touched.boardName && !!errors.boardName}
                    helperText={touched.boardName && errors.boardName}
                    sx={{ gridColumn: "span 4" }}
                  />

                  <TextField
                    fullWidth
                    variant="filled"
                    type="text"
                    label="Description"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.description}
                    name="description"
                    error={!!touched.description && !!errors.description}
                    helperText={touched.description && errors.description}
                    multiline
                    rows={4}
                    sx={{ gridColumn: "span 4" }}
                  />

                  <FormControl
                    fullWidth
                    variant="filled"
                    sx={{ gridColumn: "span 4" }}
                  >
                    <InputLabel id="priority-label">Priority</InputLabel>
                    <Select
                      labelId="priority-label"
                      value={values.priority}
                      onChange={handleChange}
                      name="priority"
                      error={!!touched.priority && !!errors.priority}
                    >
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl
                    fullWidth
                    variant="filled"
                    sx={{ gridColumn: "span 4" }}
                  >
                    <InputLabel id="members-label">Choose Members</InputLabel>
                    <Select
                      labelId="members-label"
                      multiple
                      value={values.members}
                      onChange={(event) =>
                        setFieldValue("members", event.target.value)
                      }
                      renderValue={(selected) =>
                        selected
                          .map((id) => {
                            const user = users.find((user) => user.id === id);
                            return user
                              ? `${user.firstName} ${user.surname}`
                              : "";
                          })
                          .filter(Boolean)
                          .join(", ")
                      }
                    >
                      {users
                        .filter((user) => user.id !== auth.currentUser?.uid)
                        .map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            <ListItemIcon>
                              <Checkbox
                                checked={values.members.indexOf(user.id) > -1}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${user.firstName} ${user.surname}`}
                              secondary={user.email}
                            />
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  <DatePicker
                    label="Deadline"
                    value={values.deadline}
                    onChange={(date) => setFieldValue("deadline", date)}
                    minDate={new Date()}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        variant="filled"
                        error={!!touched.deadline && !!errors.deadline}
                        helperText={touched.deadline && errors.deadline}
                        sx={{ gridColumn: "span 4" }}
                      />
                    )}
                  />

                  <Box sx={{ gridColumn: "span 4" }}>
                    <input
                      accept=".pdf,.doc,.docx"
                      style={{ display: "none" }}
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={(e) => 
                        setFiles([...files, ...Array.from(e.target.files)])
                      }
                    />
                    <label htmlFor="file-upload">
                      <IconButton component="span" color="secondary">
                        <CloudUploadIcon />
                      </IconButton>
                      <span>{files.length > 0 ? `${files.length} files selected` : "Upload documents"}</span>
                    </label>
                    {fileUploading && <CircularProgress size={24} />}
                    
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {files.map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          onDelete={() => setFiles(files.filter((_, i) => i !== index))}
                          deleteIcon={<CancelIcon />}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>

                <Box display="flex" justifyContent="center" mt="20px">
                  <Button
                    type="submit"
                    color="secondary"
                    variant="contained"
                    disabled={isSubmitting || fileUploading}
                    sx={{
                      width: "100%",
                      py: 1.5,
                      px: 4,
                      fontSize: "1rem",
                    }}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Create Board"
                    )}
                  </Button>
                </Box>
              </form>
            )}
          </Formik>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

const boardSchema = yup.object().shape({
  boardName: yup.string().required("Board Name is required"),
  description: yup.string().required("Description is required"),
  priority: yup.string().required("Priority is required"),
  members: yup
    .array()
    .min(1, "Please select at least one member")
    .required("Members are required"),
  deadline: yup.date().required("Deadline is required"),
  documents: yup.array().optional(),
});

const initialValues = {
  boardName: "",
  description: "",
  priority: "Medium",
  members: [],
  deadline: null,
  documents: [],
};

export default AddBoard;