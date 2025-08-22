import axios from '../../../components/axiosConfig';

class SearchService {
  constructor() {
    this.baseURL = '/api/v1';
    this.aiServiceURL = 'http://localhost:8000/api/v1';
  }

  async searchDoctors(params = {}) {
    try {
      const searchParams = this.buildSearchParams(params);
      const response = await axios.get(`${this.baseURL}/doctors`, { params: searchParams });
      
      console.log('Search response:', response.data);
      
      const doctors = this.normalizeSearchResults(response.data);
      return this.sortDoctorsByRelevance(doctors, params);
    } catch (error) {
      console.error('Failed to search doctors:', error);
      throw new Error('Failed to search doctors. Please try again.');
    }
  }

  async analyzeSymptoms(userQuery, location = null) {
    if (!userQuery?.trim()) {
      throw new Error('Please describe your symptoms');
    }

    try {
      const payload = {
        userQuery: userQuery.trim(),
        ...(location && {
          latitude: location.latitude,
          longitude: location.longitude
        })
      };

      const response = await axios.post(`${this.aiServiceURL}/analyze_symptoms_and_recommend_doctor`, payload);
      return this.processSymptomAnalysis(response.data);
    } catch (error) {
      console.error('Failed to analyze symptoms:', error);
      throw new Error('Failed to analyze symptoms. Please try again.');
    }
  }

  async getDoctorById(doctorId) {
    if (!doctorId) {
      throw new Error('Doctor ID is required');
    }

    try {
      const response = await axios.get(`${this.baseURL}/doctors/${doctorId}`);
      console.log('Doctor details response:', response.data);
      return this.normalizeDoctorData(response.data);
    } catch (error) {
      console.error('Failed to get doctor details:', error);
      throw new Error('Failed to load doctor details');
    }
  }

  async getNearbyDoctors(location, radius = 50) {
    if (!location?.latitude || !location?.longitude) {
      throw new Error('Location is required');
    }

    try {
      const params = {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: radius
      };

      const response = await axios.get(`${this.baseURL}/doctors/nearby`, { params });
      return this.normalizeSearchResults(response.data);
    } catch (error) {
      console.error('Failed to get nearby doctors:', error);
      throw new Error('Failed to find nearby doctors');
    }
  }

  buildSearchParams(params) {
    const searchParams = {};
    
    if (params.query?.trim()) {
      searchParams.search = params.query.trim();
    }
    
    if (params.specialty?.trim()) {
      searchParams.specialty = params.specialty.trim();
    }
    
    if (params.location?.trim()) {
      searchParams.location = params.location.trim();
    }
    
    if (params.latitude && params.longitude) {
      searchParams.latitude = params.latitude;
      searchParams.longitude = params.longitude;
    }

    if (params.minRating) {
      searchParams.minRating = params.minRating;
    }
    
    if (params.maxDistance) {
      searchParams.maxDistance = params.maxDistance;
    }
    
    if (params.availableToday) {
      searchParams.availableToday = params.availableToday;
    }

    return searchParams;
  }

  normalizeSearchResults(data) {
    if (Array.isArray(data)) {
      return data.map(doctor => this.normalizeDoctorData(doctor));
    } else if (data == null) {
      return [];
    } else {
      return [this.normalizeDoctorData(data)];
    }
  }

  normalizeDoctorData(doctor) {
    return {
      id: doctor.DoctorId || doctor.UserId || doctor.id,
      userId: doctor.UserId || doctor.DoctorId || doctor.id,
      firstName: doctor.FirstName || doctor.first_name || '',
      lastName: doctor.LastName || doctor.last_name || '',
      fullName: `Dr. ${(doctor.FirstName || doctor.first_name || '')} ${(doctor.LastName || doctor.last_name || '')}`.trim(),
      specialty: doctor.Specialty || doctor.specialty || '',
      experience: doctor.Experience || doctor.years_experience || 0,
      rating: doctor.RatingScore || doctor.rating || doctor.doctor_rating || 0,
      ratingCount: doctor.RatingCount || doctor.number_of_raters || 0,
      location: doctor.Location || doctor.location || '',
      profilePicture: doctor.ProfilePictureUrl || doctor.imageUrl || '',
      username: doctor.Username || doctor.doctor_user_name || '',
      verified: doctor.verified || true,
      availableToday: doctor.availableToday || false,
      distance: doctor.distance || null,
      
      ...doctor
    }; 
  }

  sortDoctorsByRelevance(doctors, params = {}) {
    if (!Array.isArray(doctors)) return [];

    return doctors.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      scoreA += (a.rating || 0) * 0.4;
      scoreB += (b.rating || 0) * 0.4;

      scoreA += Math.min((a.experience || 0) / 20, 1) * 0.3;
      scoreB += Math.min((b.experience || 0) / 20, 1) * 0.3;

      if (params.specialty && a.specialty?.toLowerCase().includes(params.specialty.toLowerCase())) {
        scoreA += 0.2;
      }
      if (params.specialty && b.specialty?.toLowerCase().includes(params.specialty.toLowerCase())) {
        scoreB += 0.2;
      }

      if (a.distance && b.distance) {
        scoreA += (1 - Math.min(a.distance / 100, 1)) * 0.1;
        scoreB += (1 - Math.min(b.distance / 100, 1)) * 0.1;
      }

      return scoreB - scoreA;
    });
  }

  processSymptomAnalysis(data) {
    return {
      analysis: data.analysis || '',
      recommendedSpecialty: data.recommendedSpecialty || data.recommended_specialty || '',
      urgency: data.urgency || 'normal',
      symptoms: data.symptoms || [],
      doctors: this.normalizeSearchResults(data.doctors || data.recommendedDoctors || []),
      suggestions: data.suggestions || []
    };
  }

  filterDoctors(doctors, filters = {}) {
    if (!Array.isArray(doctors)) return [];

    const { query = '', specialty = '', location = '', minRating = 0, maxDistance = null } = filters;

    return doctors.filter((doctor) => {
      const nameMatch = !query || 
        doctor.firstName?.toLowerCase().includes(query.toLowerCase()) ||
        doctor.lastName?.toLowerCase().includes(query.toLowerCase()) ||
        doctor.fullName?.toLowerCase().includes(query.toLowerCase());
      
      const specialtyMatch = !specialty || 
        doctor.specialty?.toLowerCase().includes(specialty.toLowerCase());
      
      const locationMatch = !location || 
        doctor.location?.toLowerCase().includes(location.toLowerCase());

      const ratingMatch = !minRating || (doctor.rating || 0) >= minRating;
      
      const distanceMatch = !maxDistance || !doctor.distance || doctor.distance <= maxDistance;

      return nameMatch && specialtyMatch && locationMatch && ratingMatch && distanceMatch;
    });
  }

  getPopularSpecialties() {
    return [
      'Cardiology', 
      'Dermatology', 
      'Pediatrics', 
      'Orthopedics', 
      'Neurology', 
      'Psychiatry', 
      'Internal Medicine', 
      'Surgery',
      'Family Medicine',
      'Gastroenterology',
      'Endocrinology',
      'Pulmonology'
    ];
  }

  getSearchSuggestions() {
    return [
      {
        id: 1,
        title: 'General Health Checkup',
        specialty: 'Internal Medicine',
        description: 'Regular health monitoring and preventive care',
        keywords: ['checkup', 'physical', 'routine', 'preventive']
      },
      {
        id: 2,
        title: 'Heart Problems',
        specialty: 'Cardiology', 
        description: 'Chest pain, irregular heartbeat, blood pressure issues',
        keywords: ['chest pain', 'heart', 'palpitations', 'blood pressure']
      },
      {
        id: 3,
        title: 'Skin Issues',
        specialty: 'Dermatology',
        description: 'Rashes, acne, moles, skin conditions',
        keywords: ['rash', 'acne', 'skin', 'mole', 'eczema']
      },
      {
        id: 4,
        title: 'Mental Health',
        specialty: 'Psychiatry',
        description: 'Anxiety, depression, stress management',
        keywords: ['anxiety', 'depression', 'stress', 'mental health']
      },
      {
        id: 5,
        title: 'Children\'s Health',
        specialty: 'Pediatrics',
        description: 'Child development, vaccinations, pediatric care',
        keywords: ['child', 'baby', 'vaccination', 'pediatric']
      },
      {
        id: 6,
        title: 'Bone & Joint Problems',
        specialty: 'Orthopedics',
        description: 'Fractures, joint pain, sports injuries',
        keywords: ['joint pain', 'fracture', 'sports injury', 'bone']
      },
      {
        id: 7,
        title: 'Digestive Issues',
        specialty: 'Gastroenterology',
        description: 'Stomach pain, digestion problems, acid reflux',
        keywords: ['stomach', 'digestion', 'acid reflux', 'nausea']
      },
      {
        id: 8,
        title: 'Breathing Problems',
        specialty: 'Pulmonology',
        description: 'Asthma, cough, shortness of breath',
        keywords: ['asthma', 'cough', 'breathing', 'shortness of breath']
      }
    ];
  }

  async getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let message = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        options
      );
    });
  }

  getSpecialtyColors(specialty) {
    const colorMap = {
      cardiology: { primary: '#e53e3e', secondary: '#fc8181' },
      dermatology: { primary: '#38b2ac', secondary: '#4fd1c7' },
      pediatrics: { primary: '#3182ce', secondary: '#63b3ed' },
      orthopedics: { primary: '#805ad5', secondary: '#b794f6' },
      neurology: { primary: '#d69e2e', secondary: '#f6e05e' },
      psychiatry: { primary: '#38a169', secondary: '#68d391' },
      'internal medicine': { primary: '#667eea', secondary: '#764ba2' },
      surgery: { primary: '#e53e3e', secondary: '#feb2b2' },
      'family medicine': { primary: '#48bb78', secondary: '#9ae6b4' },
      gastroenterology: { primary: '#ed8936', secondary: '#fbb348' },
      endocrinology: { primary: '#9f7aea', secondary: '#c3aed6' },
      pulmonology: { primary: '#319795', secondary: '#81e6d9' }
    };

    const specialtyKey = specialty?.toLowerCase() || '';
    return colorMap[specialtyKey] || { primary: '#667eea', secondary: '#764ba2' };
  }

  generateSearchAnalytics(doctors, params) {
    if (!Array.isArray(doctors)) return {};

    const specialties = {};
    const locations = {};
    let totalRating = 0;
    let ratedDoctors = 0;

    doctors.forEach(doctor => {
      if (doctor.specialty) {
        specialties[doctor.specialty] = (specialties[doctor.specialty] || 0) + 1;
      }
      
      if (doctor.location) {
        locations[doctor.location] = (locations[doctor.location] || 0) + 1;
      }
      
      if (doctor.rating > 0) {
        totalRating += doctor.rating;
        ratedDoctors++;
      }
    });

    return {
      totalResults: doctors.length,
      averageRating: ratedDoctors > 0 ? (totalRating / ratedDoctors).toFixed(1) : 0,
      specialtyDistribution: specialties,
      locationDistribution: locations,
      searchParams: params
    };
  }
}

const searchService = new SearchService();

export const searchDoctors = (params) => searchService.searchDoctors(params);
export const analyzeSymptoms = (query, location) => searchService.analyzeSymptoms(query, location);
export const getDoctorById = (id) => searchService.getDoctorById(id);
export const getNearbyDoctors = (location, radius) => searchService.getNearbyDoctors(location, radius);

export { searchService };
export default searchService;
