
import profilePhoto from './../../assets/images/profile_photo.jpeg';
const testimonalsList = [
    { id: 1, author: 'Bruce Lee', jobTitle: 'Philosopher', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque nibh elit, tempor in bibendum in, pretium ut quam. Ut feugiat risus quis hendrerit consequat. In quam nunc, eleifend eu dui ut, vehicula suscipit lorem.', thumbnail: profilePhoto },
    { id: 2, author: 'Chuck Norris', jobTitle: 'Martial Artist', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque nibh elit, tempor in bibendum in, pretium ut quam. Ut feugiat risus quis hendrerit consequat. In quam nunc, eleifend eu dui ut, vehicula suscipit lorem.', thumbnail: profilePhoto },
    { id: 3, author: 'Mr. T', jobTitle: 'Bodyguard', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque nibh elit, tempor in bibendum in, pretium ut quam. Ut feugiat risus quis hendrerit consequat. In quam nunc, eleifend eu dui ut, vehicula suscipit lorem.', thumbnail: profilePhoto },
];

export const getTestimonals = async () => new Promise(resolve => setTimeout(() => resolve(testimonalsList), 0));