import styled from 'styled-components';

export const NavbarContainer = styled.nav`
    background: rgb(18, 31, 73);
    display: flex;
    flex-direction: column;
    min-width: max-content;
`;

export const LogoContainer = styled.div`
    max-width: 12vw;
    width: 12vw;
    // center logo in center 
    margin: 0 auto;
    img {
        padding : 1vw 1vw;
        max-width: 10vw; 
        margin: 0 auto;
    }
    
`;

export const MenuList = styled.ul`
    @media (max-width: 549px) {
        display: flex;  
        flex-direction: column;
        align-items: center;
      }
    
`;

export const MenuItem = styled.li`
    display: flex;
    flex-direction: row;
    padding: 0.5rem;
    cursor: pointer;
    color: #ccc;
    font-size: 0.875rem;
    align-items: center;
    gap: 1rem;

    a {
        transition: 0.2s;
        display: flex;
        
        span {
            margin-left: 0.5rem;
            @media (max-width: 549px) {
                display: none;
                }
        }

        
    }
`;

export const LogoutItem = styled(MenuItem)`
    margin-top: auto;
    @media (max-width: 549px) {
        display: flex;  
        flex-direction: column;
        align-items: center;
    }
`;
