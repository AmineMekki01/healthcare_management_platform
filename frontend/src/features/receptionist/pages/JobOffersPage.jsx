import React, { useEffect, useState, useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import receptionistHiringService from '../services/receptionistHiringService';
import receptionistStatusService from '../services/receptionistStatusService';
import { AuthContext } from '../../auth/context/AuthContext';

const JobOffersPage = () => {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();

  const { setAssignedDoctorId } = useContext(AuthContext) || {};

  const receptionistId = localStorage.getItem('receptionistId') || localStorage.getItem('userId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proposals, setProposals] = useState([]);
  const [assignmentStatus, setAssignmentStatus] = useState(null);

  const effectiveAssignedDoctorId = useMemo(() => {
    return assignmentStatus?.assignedDoctor?.doctorId || localStorage.getItem('assignedDoctorId');
  }, [assignmentStatus]);

  const dismissedOfferDoctorId = useMemo(() => {
    return assignmentStatus?.lastDismissal?.doctor?.doctorId || null;
  }, [assignmentStatus]);

  const loadProposals = useCallback(async () => {
    if (!receptionistId) {
      setError(t('receptionist.jobOffers.errors.missingReceptionistId'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [status, data] = await Promise.all([
        receptionistStatusService.getAssignmentStatus(receptionistId),
        receptionistHiringService.listProposals(receptionistId),
      ]);

      setAssignmentStatus(status);

      const assignedDoctorIdFromApi = status?.assignedDoctor?.doctorId || null;
      if (assignedDoctorIdFromApi) {
        localStorage.setItem('assignedDoctorId', assignedDoctorIdFromApi);
        if (setAssignedDoctorId) setAssignedDoctorId(assignedDoctorIdFromApi);
      } else {
        localStorage.removeItem('assignedDoctorId');
        if (setAssignedDoctorId) setAssignedDoctorId(null);
      }

      setProposals(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || t('receptionist.jobOffers.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [receptionistId, t, setAssignedDoctorId]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const handleAccept = async (proposal) => {
    if (!proposal?.proposalId) return;

    if (effectiveAssignedDoctorId) {
      window.alert(t('receptionist.jobOffers.messages.alreadyAssigned'));
      return;
    }

    const msg = window.prompt(t('receptionist.jobOffers.messages.acceptPrompt'));

    try {
      setLoading(true);
      await receptionistHiringService.respondToProposal(receptionistId, proposal.proposalId, 'accept', msg || null);

      localStorage.setItem('assignedDoctorId', proposal.doctorId);
      const name = proposal?.doctor ? `Dr ${proposal.doctor.firstName} ${proposal.doctor.lastName}` : '';
      if (name) localStorage.setItem('assignedDoctorName', name);

      if (setAssignedDoctorId) {
        setAssignedDoctorId(proposal.doctorId);
      }

      window.alert(t('receptionist.jobOffers.messages.accepted'));
      navigate('/receptionist-dashboard');
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || t('receptionist.jobOffers.errors.actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (proposal) => {
    if (!proposal?.proposalId) return;

    const msg = window.prompt(t('receptionist.jobOffers.messages.rejectPrompt'));

    try {
      setLoading(true);
      await receptionistHiringService.respondToProposal(receptionistId, proposal.proposalId, 'reject', msg || null);
      window.alert(t('receptionist.jobOffers.messages.rejected'));
      await loadProposals();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || t('receptionist.jobOffers.errors.actionFailed'));
    } finally {
      setLoading(false);
    }
  };

  const renderStatusChip = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'accepted') return <Chip label={t('receptionist.jobOffers.status.accepted')} color="success" size="small" />;
    if (s === 'rejected') return <Chip label={t('receptionist.jobOffers.status.rejected')} color="error" size="small" />;
    if (s === 'withdrawn') return <Chip label={t('receptionist.jobOffers.status.withdrawn')} color="default" size="small" />;
    return <Chip label={t('receptionist.jobOffers.status.sent')} color="warning" size="small" />;
  };

  const formatProposalDate = (proposal) => {
    const raw = proposal?.createdAt || proposal?.created_at || null;
    if (!raw) return '';

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';

    return d.toLocaleDateString(i18n?.language || undefined);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc', py: 3 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {t('receptionist.jobOffers.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('receptionist.jobOffers.subtitle')}
            </Typography>
          </Box>

          <Button variant="contained" onClick={loadProposals} disabled={loading}>
            {t('buttons.refresh')}
          </Button>
        </Box>

        {assignmentStatus?.assignedDoctor?.firstName && assignmentStatus?.assignedDoctor?.lastName && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('receptionist.jobOffers.messages.assignedTo', {
              doctor: `Dr ${assignmentStatus.assignedDoctor.firstName} ${assignmentStatus.assignedDoctor.lastName}`,
            })}
          </Alert>
        )}

        {!effectiveAssignedDoctorId && assignmentStatus?.lastDismissal?.dismissedAt && assignmentStatus?.lastDismissal?.reason && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('receptionist.jobOffers.messages.lastDismissal', {
              date: new Date(assignmentStatus.lastDismissal.dismissedAt).toLocaleString(),
              reason: assignmentStatus.lastDismissal.reason,
            })}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : proposals.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {t('receptionist.jobOffers.empty.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('receptionist.jobOffers.empty.subtitle')}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {proposals.map((p) => {
              const doctorName = p?.doctor
                ? `Dr ${p.doctor.firstName} ${p.doctor.lastName}`
                : t('receptionist.jobOffers.labels.unknownDoctor');

              const location = p?.doctor
                ? [p.doctor.cityName, p.doctor.stateName, p.doctor.countryName].filter(Boolean).join(', ')
                : '';

              const isPending = String(p?.status || '').toLowerCase() === 'sent';
              const proposalDate = formatProposalDate(p);
              const isDismissedForThisOffer =
                !effectiveAssignedDoctorId &&
                !!dismissedOfferDoctorId &&
                String(p?.doctorId || '') === String(dismissedOfferDoctorId) &&
                String(p?.status || '').toLowerCase() === 'accepted' &&
                !!assignmentStatus?.lastDismissal?.dismissedAt &&
                !!assignmentStatus?.lastDismissal?.reason;

              return (
                <Card key={p.proposalId}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {doctorName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {p?.doctor?.specialty ? p.doctor.specialty : t('receptionist.jobOffers.labels.noSpecialty')}
                        </Typography>
                        {location && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {location}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {renderStatusChip(p.status)}
                        {!!proposalDate && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, textAlign: 'right' }}>
                            {t('receptionist.jobOffers.labels.sentOn')}: {proposalDate}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {isDismissedForThisOffer && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Alert severity="warning">
                          {t('receptionist.jobOffers.messages.dismissedForOffer', {
                            date: new Date(assignmentStatus.lastDismissal.dismissedAt).toLocaleString(),
                            reason: assignmentStatus.lastDismissal.reason,
                          })}
                        </Alert>
                      </>
                    )}

                    {p?.initialMessage && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {p.initialMessage}
                        </Typography>
                      </>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleReject(p)}
                        disabled={!isPending || loading}
                      >
                        {t('receptionist.jobOffers.actions.reject')}
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => handleAccept(p)}
                        disabled={!isPending || loading || !!effectiveAssignedDoctorId}
                      >
                        {t('receptionist.jobOffers.actions.accept')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default JobOffersPage;
