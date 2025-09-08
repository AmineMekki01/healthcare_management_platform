import React, { useState } from 'react';
import { Modal, Button, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function CancelAppointmentModal({ open, handleClose, handleCancel }) {
  const [reason, setReason] = useState('');
  const { t } = useTranslation('appointments');

  const onSubmit = () => {
    if (reason.trim()) {
      handleCancel(reason);
    } else {
      alert(t('modal.reasonRequired'));
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div style={{ padding: '20px', backgroundColor: 'white', margin: '100px auto', width: '400px', textAlign: 'center' }}>
        <h2>{t('modal.cancelTitle')}</h2>
        <TextField
          label={t('modal.reasonLabel')}
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div style={{ marginTop: '20px' }}>
          <Button onClick={handleClose} variant="contained" color="secondary" style={{ marginRight: '10px' }}>
            {t('modal.cancelButton')}
          </Button>
          <Button onClick={onSubmit} variant="contained" color="primary">
            {t('modal.confirmButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
