import React, { useState, useEffect } from 'react';
import axios from 'axios';

import DoctorCard from '../Users/Doctor/DoctorCard';
import { AppContainer, SearchInputContainer, SearchInput, UserList } from './SearchBar.styles';

const SearchBar = () => {

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');

  
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let url = 'http://localhost:3001/api/v1/doctors';
        if (query || specialty || location) {
          url += `?query=${query}&specialty=${specialty}&location=${location}`;
        }
        const response = await axios.get(url);
        console.log(response.data);
        setUsers(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUsers();
  }, [query, specialty, location]);


  return (
    <AppContainer className="app mt-6">
      <SearchInputContainer>
        <SearchInput
          type="text"
          placeholder="Search by Name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <SearchInput
          type="text"
          placeholder="Search by Specialty..."
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        />
        <SearchInput
          type="text"
          placeholder="Search by Location..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

    
      </SearchInputContainer>
      { (query || specialty || location) && (
      <UserList className='flex flex-wrap justify-center'>
        {users && users.filter((user) => 
            (
              ((user && user.FirstName) || '').toLowerCase().startsWith(query.toLowerCase()) &&
              ((user && user.Specialty) || '').toLowerCase().startsWith(specialty.toLowerCase()) &&
              ((user && user.Location) || '').toLowerCase().includes(location.toLowerCase())
            )
          ).map((user, index) => {
          return (
    
            <li key={index}>
              <DoctorCard
                doctorId={user.DoctorId}
                first_name={user.FirstName} 
                last_name={user.LastName} 
                specialty={user.Specialty} 
                years_experience={user.Experience} 
                doctor_rating={user.RatingScore} 
                location={user.Location}
                imageUrl={user.image_url}
                doctor_user_name={user.Username}
              />
            </li>
          );
        })}
      </UserList>
    )}

    </AppContainer>
  );
};

export default SearchBar;
