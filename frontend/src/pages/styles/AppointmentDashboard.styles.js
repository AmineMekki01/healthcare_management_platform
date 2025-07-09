import styled from "styled-components";

export const Title = styled.h2`
    color: #1a365d;
    text-align: center;
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 3rem;
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
    
    @media (max-width: 768px) {
        font-size: 2.2rem;
    }
`

export const Container = styled.div`
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    
    @media (max-width: 768px) {
        padding: 1rem;
    }
`

export const Flex = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
`

export const FilterContainer = styled.div`
    margin-bottom: 3rem;
    display: flex;
    justify-content: center;
    position: relative;
`

export const FilterInput = styled.input`
    width: 100%;
    max-width: 500px;
    padding: 1rem 1.5rem;
    font-size: 1.1rem;
    border: none;
    border-radius: 50px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:focus {
        outline: none;
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        background: rgba(255, 255, 255, 1);
    }
    
    &::placeholder {
        color: #a0aec0;
        font-style: italic;
    }
`

export const Line = styled.div`
    width: 80%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
    margin: 2rem auto;
`

export const SectionTitle = styled.h3`
    font-size: 1.8rem;
    font-weight: 600;
    color: #2d3748;
    margin: 3rem 0 1.5rem 0;
    padding: 1rem 2rem;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border-left: 5px solid #667eea;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        z-index: -1;
    }
    
    @media (max-width: 768px) {
        font-size: 1.5rem;
        padding: 0.8rem 1.5rem;
        margin: 2rem 0 1rem 0;
    }
`;

export const StatsContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
    
    @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
`;

export const StatCard = styled.div`
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    
    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }
`;

export const StatNumber = styled.div`
    font-size: 2.5rem;
    font-weight: 700;
    color: ${props => props.color || '#667eea'};
    margin-bottom: 0.5rem;
`;

export const StatLabel = styled.div`
    font-size: 0.9rem;
    color: #718096;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
`;

export const EmptyState = styled.div`
    text-align: center;
    padding: 4rem 2rem;
    color: #a0aec0;
    font-size: 1.2rem;
    font-style: italic;
    
    &::before {
        content: '📅';
        display: block;
        font-size: 4rem;
        margin-bottom: 1rem;
    }
`;

export const TabContainer = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 50px;
    padding: 0.5rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    max-width: 800px;
    margin: 0 auto 2rem auto;
    
    @media (max-width: 768px) {
        flex-wrap: wrap;
        border-radius: 20px;
        max-width: 100%;
    }
`;

export const Tab = styled.button`
    background: ${props => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'};
    color: ${props => props.active ? 'white' : '#4a5568'};
    border: none;
    padding: 1rem 2rem;
    border-radius: 50px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    position: relative;
    overflow: hidden;
    
    &:hover {
        background: ${props => props.active ? 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)' : 'rgba(102, 126, 234, 0.1)'};
        transform: translateY(-1px);
    }
    
    @media (max-width: 768px) {
        padding: 0.8rem 1.5rem;
        font-size: 0.9rem;
        flex: 1;
        min-width: 120px;
    }
`;

export const RoleSelector = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
    gap: 1rem;
    
    @media (max-width: 768px) {
        flex-direction: column;
        gap: 0.5rem;
    }
`;

export const RoleButton = styled.button`
    background: ${props => props.active ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'rgba(255, 255, 255, 0.9)'};
    color: ${props => props.active ? 'white' : '#4a5568'};
    border: 2px solid ${props => props.active ? 'transparent' : '#e2e8f0'};
    padding: 1rem 2rem;
    border-radius: 16px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        background: ${props => props.active ? 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)' : 'rgba(255, 255, 255, 1)'};
    }
    
    @media (max-width: 768px) {
        padding: 0.8rem 1.5rem;
        font-size: 0.9rem;
    }
`;

export const ContentContainer = styled.div`
    min-height: 400px;
`;

export const QuickActionContainer = styled.div`
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
    
    @media (max-width: 768px) {
        flex-direction: column;
        gap: 0.8rem;
    }
`;

export const QuickActionButton = styled.button`
    background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 16px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(237, 137, 54, 0.3);
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(237, 137, 54, 0.4);
        background: linear-gradient(135deg, #dd6b20 0%, #c05621 100%);
    }
    
    @media (max-width: 768px) {
        padding: 0.8rem 1.5rem;
    }
`;

export const AppointmentCounter = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: #4a5568;
    font-weight: 500;
    
    span {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 0.3rem 1rem;
        border-radius: 20px;
        margin-left: 0.5rem;
        font-weight: 600;
    }
`;