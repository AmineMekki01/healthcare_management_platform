import styled from 'styled-components';

export const UploadContainer = styled.div`
  width: 100%;
  max-width: 100%;
  margin: 0;
`;

export const DropZone = styled.div`
  border: 2px dashed ${props => 
    props.isDragOver ? '#4F46E5' : 
    props.hasFiles ? '#10B981' : '#D1D5DB'
  };
  border-radius: 8px;
  padding: ${props => props.hasFiles ? '12px' : '16px'};
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => 
    props.isDragOver ? '#F0F4FF' : 
    props.hasFiles ? '#F0FDF4' : '#FAFAFA'
  };
  min-height: ${props => props.hasFiles ? 'auto' : '100px'};
  max-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: ${props => props.hasFiles ? 'flex-start' : 'center'};
  align-items: center;
  position: relative;
  overflow-y: auto;
  
  /* Custom scrollbar for file list */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(248, 250, 252, 0.5);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.5);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.7);
  }
  
  &:hover {
    border-color: ${props => props.hasFiles ? '#10B981' : '#4F46E5'};
    background: ${props => props.hasFiles ? '#F0FDF4' : '#F8FAFC'};
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  }
`;

export const HiddenInput = styled.input`
  display: none;
`;

export const UploadIcon = styled.div`
  color: ${props => props.hasFiles ? '#10B981' : '#6B7280'};
  margin-bottom: 6px;
  transition: color 0.3s ease;
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

export const UploadText = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 3px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

export const UploadSubtext = styled.p`
  font-size: 11px;
  color: #6B7280;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

export const FileInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  margin-bottom: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  width: 100%;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const FileName = styled.div`
  font-weight: 500;
  color: #374151;
  font-size: 11px;
  margin-bottom: 1px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  word-break: break-word;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const FileSize = styled.div`
  font-size: 10px;
  color: #6B7280;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

export const RemoveButton = styled.button`
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: #DC2626;
    transform: scale(1.1);
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 12px;
  justify-content: center;
`;

export const UploadButton = styled.button`
  background: ${props => props.primary ? '#4F46E5' : 'transparent'};
  color: ${props => props.primary ? 'white' : '#6B7280'};
  border: ${props => props.primary ? 'none' : '1px solid #D1D5DB'};
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  &:hover {
    background: ${props => props.primary ? '#4338CA' : '#F9FAFB'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Legacy exports for backward compatibility (in case they're used elsewhere)
export const UploadFileForm = UploadContainer;
export const UploadFileFormInput = HiddenInput;
export const UploadFileFormSubmitButton = UploadButton;
export const CustomUploadLabel = DropZone;