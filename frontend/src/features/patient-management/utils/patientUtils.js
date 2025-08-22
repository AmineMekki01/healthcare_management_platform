export const formatDisplayName = (patient) => {
    if (!patient) return '';
    const { firstName, lastName, middleName } = patient;
    return [firstName, middleName, lastName].filter(Boolean).join(' ');
};

export const getPatientInitials = (patient) => {
    if (!patient) return '';
    const { firstName, lastName } = patient;
    const initials = [firstName?.charAt(0), lastName?.charAt(0)]
        .filter(Boolean)
        .join('')
        .toUpperCase();
    return initials.slice(0, 2);
};

export const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    
    try {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        
        if (birthDate > today) return null;
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
        }
        
        return age;
    } catch (error) {
        return null;
    }
};

export const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
};


export const formatEmail = (email, maxLength = 30) => {
    if (!email) return '';
    if (email.length <= maxLength) return email;
    
    const [localPart, domain] = email.split('@');
    const truncatedLocal = localPart.slice(0, Math.max(3, maxLength - domain.length - 4));
    return `${truncatedLocal}...@${domain}`;
};

export const getStatusColor = (isActive) => {
    return isActive 
        ? { 
            background: 'rgba(34, 197, 94, 0.1)', 
            border: 'rgba(34, 197, 94, 0.2)',
            color: '#16a34a' 
        }
        : { 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: 'rgba(239, 68, 68, 0.2)',
            color: '#dc2626' 
        };
};


export const formatMedicalDate = (date) => {
    if (!date) return '';
    
    try {
        return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
        });
    } catch (error) {
        return '';
    }
};

export const formatDisplayDate = (date) => {
    if (!date) return '';
    
    try {
        return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
        });
    } catch (error) {
        return '';
    }
};

export const getAgeGroup = (age) => {
    if (age === null || age === undefined) return 'Unknown';
    if (age < 2) return 'Infant';
    if (age < 12) return 'Child';
    if (age < 18) return 'Adolescent';
    if (age < 65) return 'Adult';
    return 'Senior';
};

export const validatePatientForm = (patientData) => {
    const errors = {};
    const { 
        firstName, 
        lastName, 
        email, 
        phone, 
        dateOfBirth,
        gender 
    } = patientData;

    if (!firstName?.trim()) {
        errors.firstName = 'First name is required';
    } else if (firstName.trim().length < 2) {
        errors.firstName = 'First name must be at least 2 characters';
    }

    if (!lastName?.trim()) {
        errors.lastName = 'Last name is required';
    } else if (lastName.trim().length < 2) {
        errors.lastName = 'Last name must be at least 2 characters';
    }

    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
        }
    }

    if (phone) {
        const phoneRegex = /^\d{10,11}$/;
        const cleanedPhone = phone.replace(/\D/g, '');
        if (!phoneRegex.test(cleanedPhone)) {
        errors.phone = 'Phone number must be 10-11 digits';
        }
    }

    if (dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        
        if (birthDate > today) {
        errors.dateOfBirth = 'Date of birth cannot be in the future';
        } else if (calculateAge(dateOfBirth) > 150) {
        errors.dateOfBirth = 'Please enter a valid date of birth';
        }
    }

    if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
        errors.gender = 'Please select a valid gender';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const filterPatients = (patients, searchQuery = '', filters = {}) => {
    if (!Array.isArray(patients)) return [];
    
    let filtered = [...patients];

    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(patient => {
        const searchFields = [
            formatDisplayName(patient),
            patient.email,
            patient.phone?.replace(/\D/g, ''),
            patient.patientId,
            patient.id
        ].filter(Boolean);
        
        return searchFields.some(field => 
            field.toString().toLowerCase().includes(query)
        );
        });
    }

    if (filters.status) {
        filtered = filtered.filter(patient => 
        filters.status === 'active' ? patient.isActive : !patient.isActive
        );
    }

    if (filters.gender) {
        filtered = filtered.filter(patient => patient.gender === filters.gender);
    }

    if (filters.ageRange) {
        filtered = filtered.filter(patient => {
        const age = calculateAge(patient.dateOfBirth);
        if (age === null) return false;
        
        switch (filters.ageRange) {
            case 'child': return age < 18;
            case 'adult': return age >= 18 && age < 65;
            case 'senior': return age >= 65;
            default: return true;
        }
        });
    }

    return filtered;
};

export const generatePatientStats = (patients) => {
    if (!Array.isArray(patients)) {
        return {
        total: 0,
        active: 0,
        inactive: 0,
        newThisMonth: 0,
        genderDistribution: {},
        ageGroups: {}
        };
    }

    const total = patients.length;
    const active = patients.filter(p => p.isActive).length;
    const inactive = total - active;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = patients.filter(p => 
        new Date(p.createdAt) >= startOfMonth
    ).length;

    const genderDistribution = patients.reduce((acc, patient) => {
        const gender = patient.gender || 'Unknown';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
    }, {});

    const ageGroups = patients.reduce((acc, patient) => {
        const age = calculateAge(patient.dateOfBirth);
        const group = getAgeGroup(age);
        acc[group] = (acc[group] || 0) + 1;
        return acc;
    }, {});

    return {
        total,
        active,
        inactive,
        newThisMonth,
        genderDistribution,
        ageGroups
    };
};

export const formatPatientName = (patient) => {
    return formatDisplayName(patient);
};

export const getFullAddress = (patient) => {
    if (!patient) return '';
    
    const { address, city, state, zipCode, country } = patient;
    const addressParts = [address, city, state, zipCode, country].filter(Boolean);
    return addressParts.join(', ');
};
