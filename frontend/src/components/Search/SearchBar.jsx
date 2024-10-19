import React, { useState, useEffect, useCallback} from 'react';
import axios from './../axiosConfig';
import DoctorCard from '../Users/Doctor/DoctorCard';
import { AppContainer, SearchInputContainer, SearchInput, UserList, AnalyzeButton } from './SearchBar.styles';
import { debounce } from 'lodash';

const SearchBar = () => {

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [specialtyFromQuery, setSpecialtyFromQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [searchParams, setSearchParams] = useState({ query: '', specialty: '', location: '' });
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);

useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLatitude(position.coords.latitude);
        setUserLongitude(position.coords.longitude);
      },
      (error) => {
        console.error('Error getting user location:', error);
      }
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
}, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams({
        query: query,
        specialty: specialty,
        location: location
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [query, specialty, location]);

  const fetchUsers = async () => {
    const { query, specialty, location } = searchParams;
    if (query || specialty || location || (userLatitude && userLongitude)) {
      try {
        console.log("userLatitude : ", userLatitude)
        console.log("userLongitude : ", userLongitude)

        const response = await axios.get(
          `http://localhost:3001/api/v1/doctors`,
          {
            params: {
              query,
              specialty,
              location,
              latitude: userLatitude,
              longitude: userLongitude,
            },
          }
        );
        if (response.status === 200) {
          setUsers(response.data);
          console.log('response.data :', response.data);
        } else {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
      } catch (error) {
        console.error(
          'API error:',
          error.response ? error.response.data : error.message
        );
      }
    }
  };

  const debouncedFetchUsers = useCallback(debounce(() => {
    fetchUsers();
  }, 500), [searchParams]);

  useEffect(() => {
    debouncedFetchUsers();
  }, [debouncedFetchUsers, userLatitude, userLongitude]);

  useEffect(() => {
    if (searchParams.specialty) {
        fetchUsers();
      }
  }, [searchParams.specialty]);


  const analyzeAndRecommendDoctor = async () => {
    try {
      const specialtyResponse = await axios.post('http://localhost:8000/api/v1/analyze_symptoms_and_recommend_doctor', { userQuery });
      if (specialtyResponse.data && specialtyResponse.data.doctors && specialtyResponse.data.doctors.length > 0) {
        const newSpecialty = specialtyResponse.data.doctors[0].Specialty;
        setSearchParams(prev => ({ ...prev, specialty: newSpecialty }));

        const doctorsResponse = await axios.get(`http://localhost:3001/api/v1/doctors`, {
            params: { query: '', specialty: newSpecialty, location: '' }
        });

        if (doctorsResponse.status === 200) { 
            setUsers(doctorsResponse.data);
            console.log("doctorsResponse.data :",doctorsResponse.data)
        } else {
            console.error('Failed to fetch doctors:', doctorsResponse.status);
        }
      }
  } catch (error) {
      console.error('Error in analyzeAndRecommendDoctor:', error);
  }
};

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

        <SearchInput
            type="text"
            placeholder="Describe your symptoms..."
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
        />
        <AnalyzeButton onClick={analyzeAndRecommendDoctor}>Analyze Symptoms</AnalyzeButton>
      </SearchInputContainer>
      { (users ) && (
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
                imageUrl={user.ProfilePictureUrl}
                doctor_user_name={user.Username}
                number_of_raters={user.RatingCount}
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
