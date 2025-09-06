import React from 'react';
import styled from 'styled-components';
import { FaPhone, FaEnvelope, FaCalendarAlt, FaUser, FaEdit, FaEye } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { 
    formatDisplayName, 
    getPatientInitials, 
    calculateAge, 
    formatPhoneNumber, 
    formatMedicalDate 
} from '../utils/patientUtils';

const Card = styled.div`
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid #e2e8f0;
    position: relative;
    overflow: hidden;
    
    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: ${props => props.$isActive ? 
        'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' : 
        'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
        };
    }
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
`;

const PatientInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

const PatientAvatar = styled.div`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: ${props => props.$isActive ? 
        'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 
        'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    };
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    font-weight: 600;
    box-shadow: 0 4px 12px ${props => props.$isActive ? 
        'rgba(34, 197, 94, 0.3)' : 
        'rgba(239, 68, 68, 0.3)'
    };
`;

const PatientDetails = styled.div`
    flex: 1;
`;

const PatientName = styled.h3`
    margin: 0 0 4px 0;
    font-size: 20px;
    font-weight: 600;
    color: #1a202c;
`;

const PatientId = styled.p`
    margin: 0 0 4px 0;
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const PatientStatus = styled.span`
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    background: ${props => props.$isActive ? 
        'rgba(34, 197, 94, 0.1)' : 
        'rgba(239, 68, 68, 0.1)'
    };
    color: ${props => props.$isActive ? '#16a34a' : '#dc2626'};
    border: 1px solid ${props => props.$isActive ? 
        'rgba(34, 197, 94, 0.2)' : 
        'rgba(239, 68, 68, 0.2)'
    };
`;

const CardActions = styled.div`
    display: flex;
    gap: 8px;
`;

const ActionButton = styled.button`
    padding: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        border-color: #667eea;
        color: #667eea;
        background: #f8fafc;
    }
`;

const CardBody = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const InfoRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #64748b;
`;

const InfoIcon = styled.span`
    width: 16px;
    color: #667eea;
`;

const InfoText = styled.span`
    flex: 1;
`;

const AgeText = styled.span`
    font-weight: 500;
    color: #1a202c;
`;

const PatientCard = ({ 
    patient, 
    onView, 
    onEdit, 
    onClick,
    showActions = true,
    className 
    }) => {
    const { t } = useTranslation('common');
    const fullName = formatDisplayName(patient);
    const initials = getPatientInitials(patient);
    const age = calculateAge(patient.dateOfBirth);
    const formattedPhone = formatPhoneNumber(patient.phone);
    
    const handleView = (e) => {
        e.stopPropagation();
        onView?.(patient);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit?.(patient);
    };

    const handleCardClick = () => {
        onClick?.(patient);
    };

    return (
        <Card 
        $isActive={patient.isActive}
        onClick={handleCardClick}
        className={className}
        >
        <CardHeader>
            <PatientInfo>
            <PatientAvatar $isActive={patient.isActive}>
                {initials}
            </PatientAvatar>
            <PatientDetails>
                <PatientName>{fullName}</PatientName>
                <PatientId>ID: {patient.patientId || patient.id}</PatientId>
                <PatientStatus $isActive={patient.isActive}>
                {patient.isActive ? t('status.active') : t('status.inactive')}
                </PatientStatus>
            </PatientDetails>
            </PatientInfo>
            
            {showActions && (
            <CardActions>
                <ActionButton onClick={handleView} title={t('actions.viewDetails')}>
                <FaEye />
                </ActionButton>
                <ActionButton onClick={handleEdit} title={t('actions.editPatient')}>
                <FaEdit />
                </ActionButton>
            </CardActions>
            )}
        </CardHeader>

        <CardBody>
            {patient.email && (
            <InfoRow>
                <InfoIcon>
                <FaEnvelope />
                </InfoIcon>
                <InfoText>{patient.email}</InfoText>
            </InfoRow>
            )}
            
            {patient.phone && (
            <InfoRow>
                <InfoIcon>
                <FaPhone />
                </InfoIcon>
                <InfoText>{formattedPhone}</InfoText>
            </InfoRow>
            )}
            
            {age && (
            <InfoRow>
                <InfoIcon>
                <FaUser />
                </InfoIcon>
                <InfoText>
                <AgeText>{t('patient.yearsOld', { age })}</AgeText>
                {patient.gender && ` • ${patient.gender}`}
                </InfoText>
            </InfoRow>
            )}
            
            {patient.lastVisit && (
            <InfoRow>
                <InfoIcon>
                <FaCalendarAlt />
                </InfoIcon>
                <InfoText>
                {t('patient.nextAppointment')}: {formatMedicalDate(patient.nextAppointment)}
                </InfoText>
            </InfoRow>
            )}
        </CardBody>
        </Card>
    );
};

export default PatientCard;
