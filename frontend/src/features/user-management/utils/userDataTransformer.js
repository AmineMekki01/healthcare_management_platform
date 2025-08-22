export const standardizeUserData = (userData, userType) => {
  if (!userData) return null;

  const getFieldValue = (obj, ...fieldNames) => {
    for (const fieldName of fieldNames) {
      if (obj[fieldName] !== undefined && obj[fieldName] !== null) {
        return obj[fieldName];
      }
    }
    return '';
  };

  const standardized = {
    id: getFieldValue(userData, 'doctorId', 'receptionistId', 'patientId'),
    username: getFieldValue(userData, 'username'),
    firstName: getFieldValue(userData, 'firstName'),
    lastName: getFieldValue(userData, 'lastName'),
    email: getFieldValue(userData, 'email'),
    phoneNumber: getFieldValue(userData, 'phoneNumber'),
    bio: getFieldValue(userData, 'bio'),

    profilePictureUrl: getFieldValue(userData, 
      'profilePictureUrl'
    ),
    
    streetAddress: getFieldValue(userData, 'streetAddress'),
    cityName: getFieldValue(userData, 'cityName'),
    stateName: getFieldValue(userData, 'stateName'),
    zipCode: getFieldValue(userData, 'zipCode'),
    countryName: getFieldValue(userData, 'countryName'),
    location: getFieldValue(userData, 'location'),

    birthDate: getFieldValue(userData, 'birthDate', 'birth_date'),
    sex: getFieldValue(userData, 'sex'),
    age: getFieldValue(userData, 'age'),

    isActive: userData.isActive || false,
    emailVerified: userData.emailVerified || false,

    createdAt: getFieldValue(userData, 'createdAt', 'created_at'),
    updatedAt: getFieldValue(userData, 'updatedAt', 'updated_at'),
  };

  if (userType === 'doctor') {
    standardized.specialty = getFieldValue(userData, 'specialty');
    standardized.experience = getFieldValue(userData, 'experience');
    standardized.medicalLicense = getFieldValue(userData, 'medical_license');
    standardized.ratingScore = userData.ratingScore || 0;
    standardized.ratingCount = userData.ratingCount || 0;
    standardized.latitude = userData.latitude || 0;
    standardized.longitude = userData.longitude || 0;

    standardized.hospitals = userData.hospitals || [];
    standardized.organizations = userData.organizations || [];
    standardized.awards = userData.awards || [];
    standardized.certifications = userData.certifications || [];
    standardized.languages = userData.Languages || userData.languages || [];
  }

  if (userType === 'patient') {
    standardized.patientId = getFieldValue(userData, 'PatientID', 'patient_id');
  }

  if (userType === 'receptionist') {
    standardized.receptionistId = getFieldValue(userData, 'ReceptionistID', 'receptionist_id');
    standardized.assignedDoctorId = getFieldValue(userData, 'AssignedDoctorID', 'assigned_doctor_id');
  }

  return standardized;
};

export const transformForBackend = (formData, userType) => {
  if (!formData) return {};

  return {
    first_name: formData.firstName || formData.FirstName || '',
    last_name: formData.lastName || formData.LastName || '',
    email: formData.email || formData.Email || '',
    phone_number: formData.phoneNumber || formData.PhoneNumber || '',
    bio: formData.bio || formData.Bio || '',
    street_address: formData.streetAddress || formData.StreetAddress || '',
    city_name: formData.cityName || formData.CityName || '',
    state_name: formData.stateName || formData.StateName || '',
    zip_code: formData.zipCode || formData.ZipCode || '',
    country_name: formData.countryName || formData.CountryName || '',
  };
};


export const prepareForDisplay = (userData) => {
  if (!userData) return {};

  return {
    ...userData,
    fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User',
    initials: `${(userData.firstName || '').charAt(0)}${(userData.lastName || '').charAt(0)}`.toUpperCase() || 'UN',
    displayAddress: [
      userData.streetAddress,
      userData.cityName,
      userData.stateName,
      userData.zipCode,
      userData.countryName
    ].filter(Boolean).join(', '),
    hasProfilePicture: Boolean(userData.profilePictureUrl),
  };
};

export default {
  standardizeUserData,
  transformForBackend,
  prepareForDisplay,
};
