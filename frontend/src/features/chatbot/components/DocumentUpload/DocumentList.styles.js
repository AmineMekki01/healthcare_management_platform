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
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    &:hover {
        background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
        border-color: #4f46e5;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
        color: #1e293b;
    }

    &::before {
        content: '📄';
        margin-right: 12px;
        font-size: 16px;
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
            color: #6b7280;
        }

        &::before {
            content: '📂';
        }
    }
`;
