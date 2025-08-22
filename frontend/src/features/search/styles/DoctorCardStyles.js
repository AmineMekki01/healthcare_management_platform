import styled from 'styled-components';

export const CardContainer = styled.div`
    width: 320px;
    min-height: 480px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.1),
        0 8px 16px rgba(0, 0, 0, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    cursor: pointer;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, 
            ${props => props.specialtyColors?.primary ? `${props.specialtyColors.primary}08` : 'rgba(102, 126, 234, 0.02)'} 0%, 
            ${props => props.specialtyColors?.secondary ? `${props.specialtyColors.secondary}08` : 'rgba(118, 75, 162, 0.02)'} 100%);
        z-index: -1;
    }

    &:hover {
        transform: translateY(-12px) scale(1.03);
        box-shadow: 
            0 40px 80px rgba(0, 0, 0, 0.18),
            0 16px 32px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
        border: 1px solid ${props => props.specialtyColors?.primary ? `${props.specialtyColors.primary}66` : 'rgba(102, 126, 234, 0.4)'};
    }
    
    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, 
            ${props => props.specialtyColors?.primary || '#667eea'} 0%, 
            ${props => props.specialtyColors?.secondary || '#764ba2'} 50%, 
            ${props => props.specialtyColors?.primary || '#f093fb'} 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    &:hover::after {
        opacity: 1;
    }
`;

export const TopSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(135deg, 
        ${props => props.specialtyColors?.primary || '#667eea'} 0%, 
        ${props => props.specialtyColors?.secondary || '#764ba2'} 100%);
    padding: 25px 20px;
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 100%;
        height: 200%;
        background: rgba(255, 255, 255, 0.1);
        transform: rotate(45deg);
        transition: all 0.3s ease;
    }
    
    &:hover::before {
        right: -30%;
    }
`;

export const BadgeContainer = styled.div`
    position: absolute;
    top: 15px;
    left: 15px;
    right: 15px;
    display: flex;
    justify-content: space-between;
    z-index: 2;
`;

export const VerifiedBadge = styled.div`
    background: rgba(72, 187, 120, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    svg {
        font-size: 0.7rem;
    }
`;

export const ExperienceBadge = styled.div`
    background: rgba(237, 137, 54, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

export const DoctorImage = styled.img`
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.9);
    margin: 20px 0 15px 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    z-index: 1;
    position: relative;
    
    &:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }
`;

export const NameSpecialtyContainer = styled.div`
    text-align: center;
    z-index: 1;
    position: relative;
`;

export const DoctorName = styled.h3`
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

export const DoctorSpecialty = styled.p`
    margin: 8px 0 0;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
`;

export const SpecialtyTag = styled.div`
    background: rgba(255, 255, 255, 0.25);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-top: 8px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    text-transform: capitalize;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
    position: relative;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, 
            ${props => props.specialtyColors?.primary ? `${props.specialtyColors.primary}40` : 'rgba(255, 255, 255, 0.2)'} 0%, 
            ${props => props.specialtyColors?.secondary ? `${props.specialtyColors.secondary}40` : 'rgba(255, 255, 255, 0.1)'} 100%);
        border-radius: 20px;
        z-index: -1;
    }
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }
`;

export const InfoContainer = styled.div`
    padding: 25px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 15px;
`;

export const DoctorInfo = styled.p`
    margin: 8px 0;
    font-size: 0.95rem;
    color: #4a5568;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
    
    span {
        flex: 1;
    }
    
    svg {
        color: ${props => props.specialtyColors?.primary || '#667eea'};
        font-size: 1rem;
        flex-shrink: 0;
    }
`;

export const LocationInfo = styled(DoctorInfo)`
    svg {
        color: #e53e3e;
    }
`;

export const DoctorRating = styled.span`
    color: #f6ad55;
    font-weight: 700;
    font-size: 1.1rem;
`;

export const RatingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 15px;
    padding: 15px 20px;
    background: linear-gradient(135deg, rgba(246, 173, 85, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%);
    border-radius: 16px;
    border: 1px solid rgba(246, 173, 85, 0.2);
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        transition: left 0.5s ease;
    }
    
    &:hover::before {
        left: 100%;
    }
`;

export const NumberOfRaters = styled.span`
    font-size: 0.85rem;
    color: #718096;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.8);
    padding: 4px 8px;
    border-radius: 8px;
    backdrop-filter: blur(10px);
`;

export const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: rgba(248, 250, 252, 0.8);
    border-top: 1px solid rgba(226, 232, 240, 0.8);
    gap: 12px;
`;

export const BookButton = styled.div`
    flex: 1;
    
    a {
        display: block;
        background: linear-gradient(135deg, 
            ${props => props.specialtyColors?.primary || '#667eea'} 0%, 
            ${props => props.specialtyColors?.secondary || '#764ba2'} 100%);
        color: white;
        text-decoration: none;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.9rem;
        text-align: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px ${props => props.specialtyColors?.primary ? `${props.specialtyColors.primary}50` : 'rgba(102, 126, 234, 0.3)'};
        
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 30px ${props => props.specialtyColors?.primary ? `${props.specialtyColors.primary}66` : 'rgba(102, 126, 234, 0.4)'};
            filter: brightness(1.1);
        }
    }
`;

export const ContactButton = styled.button`
    background: ${props => props.specialtyColors?.primary ? `${props.specialtyColors.primary}15` : 'rgba(102, 126, 234, 0.1)'};
    border: 2px solid ${props => props.specialtyColors?.primary ? `${props.specialtyColors.primary}30` : 'rgba(102, 126, 234, 0.2)'};
    color: ${props => props.specialtyColors?.primary || '#667eea'};
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    
    &:hover {
        background: ${props => props.specialtyColors?.primary ? `${props.specialtyColors.primary}25` : 'rgba(102, 126, 234, 0.2)'};
        border-color: ${props => props.specialtyColors?.primary || '#667eea'};
        transform: translateY(-2px);
    }
    
    &.favorite {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.2);
        color: #e53e3e;
        
        &:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: #e53e3e;
        }
    }
    
    svg {
        font-size: 1rem;
    }
`;

export const VerticalLine = styled.div`
    height: 30px;
    width: 1px;
    background: linear-gradient(to bottom, transparent, rgba(226, 232, 240, 0.8), transparent);
    margin: 0;
`;

export const ActionLink = styled.a`
    border: none;
    color: #667eea;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    text-align: center;
    padding: 8px 16px;
    border-radius: 8px;
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.2);

    &:hover {
        color: #ffffff;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    }
`;
