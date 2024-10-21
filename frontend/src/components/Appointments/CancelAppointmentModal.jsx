import React, { useState } from 'react';
import { Modal, Button, TextField } from '@mui/material';

export default function CancelAppointmentModal({ open, handleClose, handleCancel }) {
  const [reason, setReason] = useState('');

  const onSubmit = () => {
    if (reason.trim()) {
      handleCancel(reason);
    } else {
      alert('Please provide a reason for cancellation.');
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div style={{ padding: '20px', backgroundColor: 'white', margin: '100px auto', width: '400px', textAlign: 'center' }}>
        <h2>Cancel Appointment</h2>
        <TextField
          label="Cancellation Reason"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div style={{ marginTop: '20px' }}>
          <Button onClick={handleClose} variant="contained" color="secondary" style={{ marginRight: '10px' }}>Cancel</Button>
          <Button onClick={onSubmit} variant="contained" color="primary">Confirm</Button>
        </div>
      </div>
    </Modal>
  );
}
