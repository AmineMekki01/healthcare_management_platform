import styled from 'styled-components';

export const MentionDropdown = styled.div`
  position: fixed !important;
  background: white !important;
  border: 2px solid #007bff !important;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
  max-height: 200px;
  overflow-y: auto;
  min-width: 280px;
  z-index: 99999 !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
`;

export const MentionItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  background: ${props => props.isSelected ? '#f8f9fa' : 'white'};
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

export const MentionName = styled.div`
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  margin-bottom: 4px;
`;

export const MentionDetails = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  line-height: 1.3;
`;

export const MentionHighlight = styled.span`
  background: #fff3cd;
  color: #856404;
  font-weight: 600;
`;
