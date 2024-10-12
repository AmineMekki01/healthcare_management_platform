import styled from 'styled-components';

export const NavbarContainer = styled.nav`
    background: linear-gradient(to bottom, #1a237e, #3949ab);
    display: flex;
    flex-direction: column;
    min-width: 220px;
    transition: all 0.3s ease;

    @media (max-width: 768px) {
        min-width: 80px;
    }
`;

export const LogoContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    width: 8vw;
    padding: 20px 0;
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
    padding: 0;
    margin: 0;
    list-style-type: none;

    @media (max-width: 549px) {
        display: flex;  
        flex-direction: column;
        align-items: center;
      }
    
`;

export const MenuItem = styled.li`
    list-style-type: none;
    
    a {
        display: flex;
        align-items: center;
        padding: 12px 20px;
        color: #fff;
        text-decoration: none;
        transition: all 0.3s ease;

        &:hover, &.active {
            background-color: rgba(255, 255, 255, 0.1);
        }

        img {
            width: 24px;
            height: 24px;
            margin-right: 15px;
            @media (max-width: 768px) {
                margin: auto;
            }
        }

        span {
            font-size: 16px;
            
            @media (max-width: 768px) {
                display: none;
            }
        }
    }
`;

export const LogoutMenuItem = styled(MenuItem)`
    @media (max-width: 768px) {
        a {
            img {
                margin: auto;
            }   
        }
    }
`;  


export const MenuGroup = styled.div`
    margin-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 10px;

    &:last-child {
        border-bottom: none;
    }
`;

export const LowerMenuList = styled.div`
    margin-top: auto;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

export const UserInfoContainer = styled.div`
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: #fff;
`;

export const UserInfoImage = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 15px;
   
`;

export const UserInfo = styled.div`
    display: flex;
    flex-direction: column;

    span {
        font-size: 14px;
        font-weight: bold;
    }

    @media (max-width: 768px) {
        display: none;
    }
`;