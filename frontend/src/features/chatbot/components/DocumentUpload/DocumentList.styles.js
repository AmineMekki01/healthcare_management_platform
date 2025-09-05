import styled from 'styled-components';

export const DocumentContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 4px;
    }
    
    &::-webkit-scrollbar-track {
        background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
    }

    /* Firefox */
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
`;

export const DocumentElement = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    &:hover {
        background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
        border-color: #4f46e5;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
    }

    /* No documents message styling */
    &:only-child {
        text-align: center;
        color: #6b7280;
        font-style: italic;
        cursor: default;
        
        &:hover {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-color: #e2e8f0;
            transform: none;
            box-shadow: none;
        }

        &::before {
            content: '📂';
            margin-right: 12px;
            font-size: 16px;
        }
    }
`;

export const DocumentInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
    cursor: pointer;
`;

export const DocumentName = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    
    &::before {
        content: '📄';
        margin-right: 8px;
        font-size: 14px;
    }
`;

export const DocumentMeta = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #64748b;
    font-weight: 400;
    
    span {
        white-space: nowrap;
    }
`;

export const StorageBadge = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    background-color: ${props => props.color}20;
    color: ${props => props.color};
    border: 1px solid ${props => props.color}40;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 4px;
    align-self: flex-start;
`;

export const DeleteButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    line-height: 1;
    transition: all 0.2s ease;
    margin-left: 12px;
    flex-shrink: 0;
    
    &:hover {
        background: #dc2626;
        transform: scale(1.1);
    }
    
    &:active {
        transform: scale(0.95);
    }
`;
