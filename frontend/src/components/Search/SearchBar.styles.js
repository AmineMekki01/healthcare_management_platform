import styled from 'styled-components';
 
// Color palette
// #fff #E7E8EA
// #F9A11B #FEC47B
// #F05423 #F69963
// #6DC8B7 #AADCD3
// #121F49 #696E8E

export const AppContainer = styled.div`
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    padding: 40px 20px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

export const SearchPageHeader = styled.div`
    text-align: center;
    margin-bottom: 3rem;
    
    h1 {
        font-size: 3rem;
        font-weight: 700;
        color: #1a365d;
        margin-bottom: 1rem;
        position: relative;
        
        &::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 4px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 2px;
        }
    }
    
    p {
        font-size: 1.2rem;
        color: #4a5568;
        font-weight: 400;
        opacity: 0.9;
    }
    
    @media (max-width: 768px) {
        h1 {
            font-size: 2.2rem;
        }
        
        p {
            font-size: 1rem;
        }
    }
`;

export const SearchInputContainer = styled.div`
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    display: flex;
    width: 90%;
    max-width: 1200px;
    padding: 40px;
    flex-direction: column;
    gap: 20px;
    border-radius: 24px;
    box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.1),
        0 8px 16px rgba(0, 0, 0, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.2);
    margin-bottom: 40px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
        transform: translateY(-4px);
        box-shadow: 
            0 24px 48px rgba(0, 0, 0, 0.12),
            0 12px 24px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }
`;

export const SearchInputsRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 20px;
    
    @media (max-width: 1024px) {
        grid-template-columns: 1fr 1fr;
    }
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

export const SearchInput = styled.input`
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    height: 56px;
    padding: 0 20px;
    border-radius: 16px;
    font-size: 1rem;
    font-weight: 500;
    color: #2d3748;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &::placeholder {
        color: #a0aec0;
        font-style: italic;
    }

    &:focus {
        outline: none;
        border-color: #667eea;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 
            0 0 0 4px rgba(102, 126, 234, 0.1),
            0 8px 32px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }
`;

export const SymptomInputContainer = styled.div`
    display: flex;
    gap: 15px;
    align-items: center;
    
    @media (max-width: 768px) {
        flex-direction: column;
        gap: 15px;
    }
`;

export const SymptomInput = styled(SearchInput)`
    flex: 1;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    border: 2px solid rgba(102, 126, 234, 0.2);
    
    &:focus {
        border-color: #667eea;
        background: rgba(255, 255, 255, 0.95);
    }
`;

export const AnalyzeButton = styled.button`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    height: 56px;
    padding: 0 32px;
    border-radius: 16px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 
            0 12px 40px rgba(102, 126, 234, 0.4),
            0 4px 20px rgba(102, 126, 234, 0.2);
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    }
    
    &:active {
        transform: translateY(0);
    }
    
    @media (max-width: 768px) {
        width: 100%;
        height: 48px;
    }
`;

export const UserList = styled.ul`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 30px;
    width: 90%;
    max-width: 1200px;
    padding: 0;
    list-style-type: none;
    margin: 0;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 20px;
    }
`;

export const ResultsHeader = styled.div`
    width: 90%;
    max-width: 1200px;
    margin-bottom: 20px;
    
    h2 {
        font-size: 1.8rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.5rem;
        text-align: center;
    }
    
    p {
        text-align: center;
        color: #718096;
        font-size: 1rem;
    }
`;

export const LoadingSpinner = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
    
    &::after {
        content: '';
        width: 40px;
        height: 40px;
        border: 4px solid rgba(102, 126, 234, 0.2);
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

export const EmptyState = styled.div`
    text-align: center;
    padding: 4rem 2rem;
    color: #a0aec0;
    font-size: 1.2rem;
    font-style: italic;
    
    &::before {
        content: '🔍';
        display: block;
        font-size: 4rem;
        margin-bottom: 1rem;
    }
    
    h3 {
        color: #4a5568;
        font-size: 1.5rem;
        margin-bottom: 1rem;
    }
    
    p {
        color: #718096;
        font-size: 1rem;
    }
`;

export const QuickFiltersContainer = styled.div`
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 20px;
    
    @media (max-width: 768px) {
        gap: 8px;
    }
`;

export const QuickFilterButton = styled.button`
    background: rgba(102, 126, 234, 0.1);
    border: 2px solid rgba(102, 126, 234, 0.2);
    color: #667eea;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(102, 126, 234, 0.2);
        border-color: #667eea;
        transform: translateY(-2px);
    }
    
    &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-color: transparent;
    }
`;

export const SearchSuggestions = styled.div`
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 20px;
    margin-bottom: 20px;
    
    h3 {
        color: #2d3748;
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 15px;
        text-align: center;
    }
`;

export const SuggestionGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

export const SuggestionCard = styled.div`
    background: rgba(102, 126, 234, 0.05);
    border: 1px solid rgba(102, 126, 234, 0.1);
    border-radius: 12px;
    padding: 15px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(102, 126, 234, 0.1);
        border-color: #667eea;
        transform: translateY(-2px);
    }
    
    h4 {
        color: #667eea;
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 8px;
    }
    
    p {
        color: #718096;
        font-size: 0.9rem;
        margin: 0;
    }
`;

export const ClearButton = styled.button`
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid rgba(239, 68, 68, 0.2);
    color: #e53e3e;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: #e53e3e;
        transform: translateY(-2px);
    }
    
    @media (max-width: 768px) {
        width: 100%;
    }
`;

export const SearchActionsContainer = styled.div`
    display: flex;
    gap: 15px;
    align-items: center;
    
    @media (max-width: 768px) {
        flex-direction: column;
        gap: 10px;
    }
`;