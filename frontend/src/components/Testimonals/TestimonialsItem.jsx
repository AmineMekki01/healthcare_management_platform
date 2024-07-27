import React from 'react';
import styled from 'styled-components';

const TestimonialCard = styled.div`
  position: relative;
  width: 90%;
  margin: 80px auto 0;
  background-color: #F9F9F9;
  border: 3px solid #E5E5E5;
  height: 350px;
`;


const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  height: 100%;
  width : 90%;
  margin: 0 auto 30px;

  @media (max-width: 350px) {
    max-height: 200px;
    // overflow: hidden;
  }
`;

const ImageContainer = styled.img`
  position: absolute;
  top: -80px; 
  transform: translateX(-50%);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  z-index: 10;
`;

const EmptyBox = styled.div`
 width: 100%;
 height: 80px;
`;

const TestimonialsItem = (props) => {
  const shortenText = (text, startingPoint, maxLength) => {
    return text.length > maxLength ? text.slice(startingPoint, maxLength) : text;
  }

  return (
    <TestimonialCard>
      <ImageContainer src={props.testimonial.thumbnail} alt={props.testimonial.author}/>
      <EmptyBox></EmptyBox>
      <ContentContainer>
        <h3>{props.testimonial.author}</h3>
        <h4>{props.testimonial.jobTitle}</h4>
        <p>{`${shortenText(props.testimonial.content, 0, 370)} ...`}</p>
      </ContentContainer>
    </TestimonialCard>
  );
}

export default TestimonialsItem;