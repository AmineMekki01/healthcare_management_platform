import React from 'react';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Carousel } from 'react-responsive-carousel';
import { useRecoilValue } from 'recoil';
import TestimonialsItem from './TestimonialsItem';
import { getTestimonialsPosts } from '../../recoil/selectors/testimonialsSelectors';

import './TestimonalsStyles.css';
const Testimonials = () => {
  const testimonials = useRecoilValue(getTestimonialsPosts);

  return (
    <>
      <Carousel
        showArrows={true}
        infiniteLoop={true}
        showThumbs={false}
        showStatus={false}
        autoPlay={true}
        interval={6500}
      >
        {testimonials.map((testimonial) => (
          <TestimonialsItem testimonial={testimonial} />
        ))}
      </Carousel>
    </>
  );
}

export default Testimonials;
