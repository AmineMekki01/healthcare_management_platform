import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import axios from "./../components/axiosConfig";
import { FaUserMd, FaCalendarAlt } from 'react-icons/fa';

const DiagnosisContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
`;

const Card = styled.div`
  background-color: #ffffff;
  max-width: 800px;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  color: #333;
  margin-bottom: 20px;
  border-bottom: 2px solid #6DC8B7;
  padding-bottom: 10px;
`;

const Detail = styled.p`
  font-size: 16px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 15px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const IconWrapper = styled.span`
  color: #6DC8B7;
  margin-right: 10px;
  font-size: 18px;
`;

const Label = styled.span`
  font-weight: bold;
  color: #333;
`;

const Value = styled.span`
  color: #555;
`;

const BackButton = styled.button`
  background-color: #6DC8B7;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 20px;

  &:hover {
    background-color: #5ab3a1;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 24px;
  color: #6DC8B7;
`;

export default function DiagnosisPage() {
  const { diagnosisId } = useParams();
  const [diagnosisInfo, setDiagnosisInfo] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getDiagnosisInfo = async () => {
      try {
        const response = await axios.get(`/api/v1/patients/diagnosis-info/${diagnosisId}`);
        console.log("response.data : ", response.data);
        setDiagnosisInfo(response.data);
      } catch (error) {
        console.error("Failed to retrieve Diagnosis Info : ", error);
        setError('Failed to load diagnosis information.');
      }
    };
    getDiagnosisInfo();
  }, [diagnosisId]);

  if (error) {
    return (
      <DiagnosisContainer>
        <Card>
          <p>{error}</p>
        </Card>
      </DiagnosisContainer>
    );
  }

  if (!diagnosisInfo) {
    return (
      <LoadingContainer>
        Loading...
      </LoadingContainer>
    );
  }

  const formattedDate = new Date(diagnosisInfo.CreatedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <DiagnosisContainer>
      <Card>
        <Title>{diagnosisInfo.DiagnosisName}</Title>

        <InfoRow>
          <IconWrapper>
            <FaUserMd />
          </IconWrapper>
          <Label>Diagnosed by:&nbsp;</Label>
          <Value>{diagnosisInfo.DiagnosisDoctorName}</Value>
        </InfoRow>

        <InfoRow>
          <IconWrapper>
            <FaCalendarAlt />
          </IconWrapper>
          <Label>Date:&nbsp;</Label>
          <Value>{formattedDate}</Value>
        </InfoRow>

        <Detail>{diagnosisInfo.DiagnosisDetails}</Detail>

        <BackButton onClick={() => navigate(-1)}>Back to Profile</BackButton>
      </Card>
    </DiagnosisContainer>
  );
}
