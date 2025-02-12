import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box
} from '@mui/material';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const LeaveFormModal = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    startDate: '',
    daysTaken: '',
    date: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      // Fetch the existing PDF
      const existingPdfBytes = await fetch(process.env.PUBLIC_URL + '/Shudu_Leave_Form_2025.pdf').then(res => res.arrayBuffer());
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Get the first page
      const page = pdfDoc.getPages()[0];
      
      // Embed the font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Get page dimensions
      const { width, height } = page.getSize();
      
      // Draw text on the page - adjusted coordinates based on the form layout
      // Full Name (next to "Full Name:")
      page.drawText(formData.fullName, {
        x: 150,
        y: height - 373, // Adjusted for the Full Name field
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });

      // Leave Start Date (in the table under "Leave Type")
      page.drawText(formData.startDate, {
        x: 195,
        y: height - 418, // Adjusted for the first row in the table
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });

      // Days Taken (in the table under "Days Taken")
      page.drawText(formData.daysTaken, {
        x: 350,
        y: height - 515, // Same height as start date, different x coordinate
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });

      // Current Date (next to "Date" under employee signature)
      page.drawText(formData.date, {
        x: 450,
        y: height - 380, // Adjusted for the date field next to signature
        size: 11,
        font: font,
        color: rgb(0, 0, 0),
      });

      // Save the modified PDF
      const filledPdfBytes = await pdfDoc.save();

      // Create a blob and download the filled PDF
      const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Filled_Leave_Form.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Detailed error:', error);
      alert('Error generating PDF. Please check console for details.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Leave Form Details</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Leave Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Days Taken"
            name="daysTaken"
            type="number"
            value={formData.daysTaken}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Generate PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveFormModal;