import styled from 'styled-components';

export const NavbarContainer = styled.nav`
    background: rgb(18, 31, 73);
    display: flex;
    flex-direction: column;
    min-width: max-content;
`;

export const LogoContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    width: 8vw;
    padding: 10px 10px;
    @media (max-width: 549px) {
        width: 36px;
    }
    img {
        @media (max-width: 549px) {

            min-width: 36px;
        }
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
        align-items: center;
        span {
            margin-left: 0.5rem;
            @media (max-width: 549px) {
                display: none;
                }
        }

        
    }
`;

export const LowerMenuList = styled(MenuItem)`
    margin-top: auto;
    display: flex;  
    flex-direction: column;
    align-items: flex-start;
    @media (max-width: 549px) {
        display: flex;  
        flex-direction: column;
        align-items: center;
    }
`;

export const UserInfoContainer = styled.div`
    display: flex;
    margin-top: auto;
    text-align: center;
   
`;

export const UserInfo = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-left: 0.5rem;
    color: #ccc;
    font-size: 0.5rem;
    text-align: left;
    @media (max-width: 549px) {
        display: none;
    }
`;

export const UserInfoImage = styled.img`
    width: 30px;
    height: 30px;
    border-radius: 50%;
`;