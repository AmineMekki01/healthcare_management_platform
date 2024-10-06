import React, { useState, useEffect, Suspense } from 'react';
import {RecoilRoot} from "recoil";
import Testimonials from "../components/Testimonals/Testimonals";
import stetoImage from "./../assets/images/no_background_doc_steto.png";
import stetoImageSized from "./../assets/images/no_small_background_doc_steto.png";
import styled from 'styled-components';
import AgePieChart from '../components/common/Charts/AgePieChart';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
  width: 100%;
  padding-top: 0;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: none;
`;

const HeaderText = styled.div`
  width: 50%;
  padding: 1rem;
  height: 100%;
  @media (max-width: 700px) {
    width: 90%;
    margin-top: 1rem;
    background : rgba(218, 224, 222, 0.6) ;
  }
`;

const HeaderMedia = styled.div`
  width: 50%;
  height: 100%;

  .header-image {
    max-width: 90%;  
    height: auto;     
  }

  @media (max-width: 700px) {
    display: none;
  }
`;

const MainTitle = styled.p`
  width: 90%;
  margin: 0 auto;
  font-size: 3vw;
  @media (max-width: 750px) {
    font-size: 1.5rem;
  }
`;

const Mainpara = styled.p`
  width: 90%;
  margin: 0 auto;
  font-size: 1.5vw;
  @media (max-width: 750px) {
    font-size: 1rem;

  }
`;

const Services = styled.div`
  display: flex;  
  width: 100%;
  justify-content: center;  
  align-items: stretch;
  flex-wrap: wrap;  
  padding: 1rem;
  height: 100%;
  min-height: 500px;

`;

const Service = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1rem;
 
`;

const ServiceIcon = styled.div`
  width: 200px;
  height: 200px;
  min-width: 200px;
  min-height: 200px;
  max-width: 200px;
  max-height: 200px;
  .service-image {
    max-width: 200px;  
    height: 200px;     
  }
`;

const ServiceTitle = styled.p`
  max-width: 200px;
  font-size: 2rem; 
  font-weight: bold;  
  text-align: center;
`;

const ServiceDescription = styled.p`
  width: 100%;
  max-width: 200px;
  font-size: 1rem;
  min-font-size: 1rem;
  text-align: center;
`;

const ChartsContainer = styled.div`
  display : flex;
  flex-direction: column;

`;

const Charts = styled.div`
  display : flex;
  align-items: center;
  @media (max-width: 720px) {
    flex-direction: column;
  }

`;

const TestimonialContainer = styled.div`
  width : 90%;
  height: 450px;
  max-width: 600px;

`;

const TestimonialBox = styled.div`
  height: 100%;
`;


function HomePage() {
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 550);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 550);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const imageSource = isSmallScreen ? stetoImageSized : stetoImage;

  const patientData = {
    labels: ['0-18', '19-30', '31-45', '46-60', '61+'],
    values: [10, 20, 30, 20, 20],
  };

  const doctorData = {
    labels: ['0-18', '19-30', '31-45', '46-60', '61+'],
    values: [5, 10, 15, 30, 40],
  };

  return (
    <PageContainer className='pt-6 space-y-4'>

      <HeaderContainer>
        <HeaderText>
          <MainTitle>Finding a doctor you can build a good relationship with is good for your health.</MainTitle>
          <Mainpara>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s. </Mainpara> 
        </HeaderText>

        <HeaderMedia>
          <img class="header-image"src={imageSource} alt="Doctor" />

        </HeaderMedia>

      </HeaderContainer>
      
      <Services>

        <MainTitle className='flex justify-center'>What We Have For You</MainTitle>

        <Service>
          <ServiceIcon>
            <img class="service-image" src={stetoImageSized} alt="Doctor" />
          </ServiceIcon>
          <ServiceTitle>Service 1</ServiceTitle>
          <ServiceDescription>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            malesuada lorem maximus mauris scelerisque, at rutrum nulla
            dictum.
          </ServiceDescription>
        </Service>

        <Service>
          <ServiceIcon>
            <img class="service-image" src={stetoImageSized} alt="Doctor" />
          </ServiceIcon>
          <ServiceTitle>Service 2</ServiceTitle>
          <ServiceDescription>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            malesuada lorem maximus mauris scelerisque, at rutrum nulla
            dictum.
          </ServiceDescription>
        </Service>
        
        <Service>
          <ServiceIcon>
            <img class="service-image" src={stetoImageSized} alt="Doctor" />
          </ServiceIcon>
          <ServiceTitle>Service 3</ServiceTitle>
          <ServiceDescription>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            malesuada lorem maximus mauris scelerisque, at rutrum nulla
            dictum.
          </ServiceDescription>
        </Service>

        <Service>
          <ServiceIcon>
            <img class="service-image" src={stetoImageSized} alt="Doctor" />
          </ServiceIcon>
          <ServiceTitle>Service 4</ServiceTitle>
          <ServiceDescription>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            malesuada lorem maximus mauris scelerisque, at rutrum nulla
            dictum.
          </ServiceDescription>
        </Service>

        <Service>
          <ServiceIcon>
            <img class="service-image" src={stetoImageSized} alt="Doctor" />
          </ServiceIcon>
          <ServiceTitle>Service 5</ServiceTitle>
          <ServiceDescription>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            malesuada lorem maximus mauris scelerisque, at rutrum nulla
            dictum.
          </ServiceDescription>
        </Service>
      </Services>

      <ChartsContainer>
        <MainTitle className='flex justify-center'>People That Trusts Us</MainTitle>
        <Charts>
          <AgePieChart data={patientData} title='Patients' />
          <AgePieChart data={doctorData} title='Doctors' />
        </Charts>
      </ChartsContainer>

      <TestimonialContainer>

        <MainTitle className='flex justify-center'>Testimonials</MainTitle>
        <TestimonialBox >
          <RecoilRoot>
            <Suspense fallback={<span>Loading...</span>}>
            <Testimonials />
            </Suspense>
          </RecoilRoot>
            <p />
        </TestimonialBox>
      </TestimonialContainer>

    </PageContainer>
  );
}

export default HomePage;
