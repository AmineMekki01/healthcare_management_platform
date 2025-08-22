import styled from 'styled-components';

export const ChatInterfaceContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    border: 1px solid #e2e8f0;

    @media (max-width: 650px) {
        border-radius: 0;
        height: 100vh;
    }
`;

export const ChatInterfaceMessages = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    gap: 16px;
    scroll-behavior: smooth;
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 6px;
    }
    
    &::-webkit-scrollbar-track {
        background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }

    /* Firefox */
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
`;

export const ChatInterfaceMessageLlm = styled.div`
    max-width: 85%;
    padding: 16px 20px;
    border-radius: 18px 18px 18px 4px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
    color: #334155;
    font-size: 15px;
    line-height: 1.6;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin-right: auto;
    position: relative;
    
    &::before {
        content: '';
        position: absolute;
        left: -1px;
        top: 0;
        width: 3px;
        height: 100%;
        background: linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%);
        border-radius: 0 0 0 18px;
    }

    /* Markdown styling */
    h1, h2, h3, h4, h5, h6 {
        color: #1e293b;
        margin: 16px 0 8px 0;
        font-weight: 600;
    }

    p {
        margin: 8px 0;
    }

    ul, ol {
        margin: 8px 0;
        padding-left: 20px;
    }

    code {
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 14px;
        color: #e11d48;
    }

    pre {
        background: #f1f5f9;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 12px 0;
    }

    blockquote {
        border-left: 3px solid #e2e8f0;
        padding-left: 16px;
        margin: 12px 0;
        color: #64748b;
    }
`;

export const ChatInterfaceMessageUser = styled.div`
    max-width: 80%;
    padding: 16px 20px;
    border-radius: 18px 18px 4px 18px;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
    font-size: 15px;
    line-height: 1.5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin-left: auto;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    font-weight: 500;
`;

export const FilesUploadTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

export const FileUploadContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    background: rgba(255, 255, 255, 0.5);
    max-height: 300px;
    min-height: 180px;
    overflow-y: auto;
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 6px;
    }
    
    &::-webkit-scrollbar-track {
        background: rgba(248, 250, 252, 0.5);
        border-radius: 3px;
        margin: 4px 0;
    }
    
    &::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
        border-radius: 3px;
        transition: background 0.2s ease;
    }
    
    &::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.5) 100%);
    }
`;

export const ChatInputContainer = styled.div`
    display: flex;
    align-items: center;
    padding: 20px 24px;
    gap: 12px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-top: 1px solid #e2e8f0;
`;

export const FileUploadButton = styled.button`
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border: 1px solid #cbd5e1;
    color: #64748b;
    font-size: 20px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
        color: #475569;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
        transform: translateY(0);
    }
`;

export const FileUpload = styled.label`
    cursor: pointer;
`;

export const ChatInterfaceForm = styled.form`
    display: flex;
    flex: 1;
    align-items: center;
    background: white;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    transition: all 0.2s ease;
    overflow: hidden;
    
    &:focus-within {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
`;

export const ChatInterfaceInput = styled.input`
    flex: 1;
    padding: 14px 16px;
    border: none;
    background: transparent;
    font-size: 15px;
    color: #334155;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    &::placeholder {
        color: #94a3b8;
    }
    
    &:focus {
        outline: none;
    }
`;

export const ChatInterfaceSubmitButton = styled.button`
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    margin: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:hover {
        background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    
    &:active {
        transform: translateY(0);
    }
    
    .span1 {
        transform: rotate(0deg);
        transition: transform 0.2s ease;
    }
    
    &:hover .span1 {
        transform: rotate(-45deg);
    }
`;

export const Header = styled.div`
    display: none;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-bottom: 1px solid #e2e8f0;
    backdrop-filter: blur(10px);

    @media (max-width: 650px) {
        display: flex;
    }
`;

export const BackButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    color: #4f46e5;
    cursor: pointer;
    padding: 4px 8px;
    margin-right: 12px;
    border-radius: 6px;
    transition: all 0.2s ease;
    
    &:hover {
        background: rgba(79, 70, 229, 0.1);
        transform: translateX(-2px);
    }
`;

export const ChatTitle = styled.h1`
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;
