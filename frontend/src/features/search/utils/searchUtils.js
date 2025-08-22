export const formatDoctorName = (doctor) => {
    if (!doctor) return '';
    
    const firstName = doctor.FirstName || doctor.first_name || '';
    const lastName = doctor.LastName || doctor.last_name || '';
    
    if (firstName || lastName) {
        return `Dr. ${firstName} ${lastName}`.trim();
    }
    
    return doctor.name || 'Unknown Doctor';
};

export const formatDoctorRating = (doctor) => {
    const rating = doctor.RatingScore || doctor.rating || doctor.doctor_rating || 0;
    const count = doctor.RatingCount || doctor.number_of_raters || 0;
    
    return {
        rating: Number(rating).toFixed(1),
        count: count,
        display: count > 0 ? `${Number(rating).toFixed(1)} (${count} reviews)` : 'No reviews yet'
    };
};

export const formatExperience = (years) => {
    if (!years || years <= 0) return 'New practitioner';
    
    if (years === 1) return '1 year experience';
    if (years < 5) return `${years} years experience`;
    if (years < 10) return `${years} years experience`;
    if (years < 20) return `${years}+ years experience`;
    
    return `${years}+ years of expertise`;
};

export const formatDistance = (distance) => {
    if (!distance || distance <= 0) return '';
    
    if (distance < 1) {
        return `${Math.round(distance * 1000)}m away`;
    } else if (distance < 10) {
        return `${distance.toFixed(1)}km away`;
    } else {
        return `${Math.round(distance)}km away`;
    }
};


export const getSpecialtyIcon = (specialty) => {
    const specialtyIcons = {
        'cardiology': '❤️',
        'dermatology': '🧴',
        'pediatrics': '👶',
        'orthopedics': '🦴',
        'neurology': '🧠',
        'psychiatry': '💭',
        'internal medicine': '🩺',
        'surgery': '⚕️',
        'family medicine': '👨‍👩‍👧‍👦',
        'gastroenterology': '🍽️',
        'endocrinology': '⚖️',
        'pulmonology': '🫁',
        'ophthalmology': '👁️',
        'ent': '👂',
        'gynecology': '👩',
        'urology': '🩻',
        'oncology': '🎗️',
        'radiology': '📡'
    };
    
    const key = specialty?.toLowerCase() || '';
    return specialtyIcons[key] || '🩺';
};

export const generateSearchSuggestions = (input) => {
    if (!input || input.length < 2) return [];
    
    const suggestions = [
        { type: 'specialty', value: 'Cardiology', match: 'heart|cardiac|cardio' },
        { type: 'specialty', value: 'Dermatology', match: 'skin|derma|rash|acne' },
        { type: 'specialty', value: 'Pediatrics', match: 'child|baby|pediatric|kid' },
        { type: 'specialty', value: 'Orthopedics', match: 'bone|joint|fracture|ortho' },
        { type: 'specialty', value: 'Neurology', match: 'brain|nerve|neuro|headache' },
        { type: 'specialty', value: 'Psychiatry', match: 'mental|depression|anxiety|stress' },
        { type: 'specialty', value: 'Internal Medicine', match: 'internal|general|checkup' },
        { type: 'specialty', value: 'Gastroenterology', match: 'stomach|digestion|gastro|nausea' },
        { type: 'specialty', value: 'Pulmonology', match: 'lung|breathing|cough|asthma' },
        { type: 'specialty', value: 'Endocrinology', match: 'diabetes|hormone|thyroid|endo' },
        
        { type: 'symptom', value: 'Chest pain', match: 'chest|heart pain' },
        { type: 'symptom', value: 'Headache', match: 'head|migraine' },
        { type: 'symptom', value: 'Fever', match: 'fever|temperature' },
        { type: 'symptom', value: 'Cough', match: 'cough|cold' },
        { type: 'symptom', value: 'Back pain', match: 'back|spine' },
        { type: 'symptom', value: 'Stomach ache', match: 'stomach|belly|abdomen' }
    ];
    
    const inputLower = input.toLowerCase();
    
    return suggestions
        .filter(suggestion => 
        suggestion.value.toLowerCase().includes(inputLower) || 
        new RegExp(suggestion.match, 'i').test(inputLower)
        )
        .slice(0, 5)
        .map(suggestion => ({
        text: suggestion.value,
        type: suggestion.type,
        icon: suggestion.type === 'specialty' ? getSpecialtyIcon(suggestion.value) : '🔍'
        }));
};

export const validateSearchFilters = (filters) => {
    const errors = [];
    const warnings = [];
    
    if (filters.minRating && (filters.minRating < 0 || filters.minRating > 5)) {
        errors.push('Rating must be between 0 and 5');
    }
    
    if (filters.maxDistance && (filters.maxDistance < 0 || filters.maxDistance > 500)) {
        errors.push('Distance must be between 0 and 500km');
    }
    
    if (filters.query && filters.query.length > 100) {
        errors.push('Search query is too long');
    }

    if (filters.query && filters.query.length < 2) {
        warnings.push('Search query is very short - results may be too broad');
    }
    
    if (filters.minRating && filters.minRating > 4.5) {
        warnings.push('High rating filter may significantly limit results');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};


export const calculateRelevanceScore = (doctor, searchParams) => {
    let score = 0;
    
    const rating = doctor.rating || 0;
    score += (rating / 5) * 30;
    
    const experience = doctor.experience || 0;
    score += Math.min(experience / 20, 1) * 20;
    
    if (searchParams.specialty) {
        const specialtyMatch = doctor.specialty?.toLowerCase().includes(searchParams.specialty.toLowerCase());
        if (specialtyMatch) score += 25;
    }
    
    if (doctor.distance) {
        const distanceScore = Math.max(0, 1 - (doctor.distance / 100));
        score += distanceScore * 15;
    }
    
    if (searchParams.query) {
        const fullName = formatDoctorName(doctor).toLowerCase();
        const queryMatch = fullName.includes(searchParams.query.toLowerCase());
        if (queryMatch) score += 10;
    }
    
    return Math.round(score);
};


export const groupDoctorsBySpecialty = (doctors) => {
    if (!Array.isArray(doctors)) return {};
    
    return doctors.reduce((groups, doctor) => {
        const specialty = doctor.specialty || 'Other';
        if (!groups[specialty]) {
        groups[specialty] = [];
        }
        groups[specialty].push(doctor);
        return groups;
    }, {});
};

export const getAvailableDoctors = (doctors) => {
    if (!Array.isArray(doctors)) return [];
    
    return doctors.filter(doctor => 
        doctor.acceptingPatients !== false && 
        doctor.status !== 'inactive'
    );
};


export const getTopRatedDoctors = (doctors, limit = 5) => {
    if (!Array.isArray(doctors)) return [];
    
    return doctors
        .filter(doctor => (doctor.rating || 0) > 0)
        .sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        
        if (ratingA !== ratingB) {
            return ratingB - ratingA;
        }
        
        const countA = a.ratingCount || 0;
        const countB = b.ratingCount || 0;
        return countB - countA;
        })
        .slice(0, limit);
};


export const formatSearchSummary = (doctors, filters) => {
    if (!Array.isArray(doctors)) return '';
    
    const count = doctors.length;
    
    if (count === 0) {
        return 'No doctors found matching your criteria';
    }
    
    let summary = `Found ${count} doctor${count === 1 ? '' : 's'}`;
    
    const appliedFilters = [];
    if (filters.specialty) appliedFilters.push(`in ${filters.specialty}`);
    if (filters.location) appliedFilters.push(`near ${filters.location}`);
    if (filters.minRating) appliedFilters.push(`rated ${filters.minRating}+ stars`);
    
    if (appliedFilters.length > 0) {
        summary += ` ${appliedFilters.join(', ')}`;
    }
    
    return summary;
};

export const generateSearchURL = (params) => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
        searchParams.set(key, value);
        }
    });
    
    return searchParams.toString();
};


export const parseSearchURL = (searchString) => {
    const params = new URLSearchParams(searchString);
    const result = {};
    
    for (const [key, value] of params) {
        if (['minRating', 'maxDistance', 'latitude', 'longitude'].includes(key)) {
        result[key] = parseFloat(value);
        } else if (['availableToday'].includes(key)) {
        result[key] = value === 'true';
        } else {
        result[key] = value;
        }
    }
    
    return result;
};

export const debounceSearch = (func, delay = 300) => {
    let timeoutId;
    
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

export const formatSearchError = (error) => {
    if (!error) return 'An unknown error occurred';
    
    const message = error.message || error.toString();
    
    if (message.includes('Network Error') || message.includes('fetch')) {
        return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    if (message.includes('timeout')) {
        return 'Search is taking longer than expected. Please try again.';
    }
    
    if (message.includes('permission') || message.includes('denied')) {
        return 'Permission denied. Please try again or contact support.';
    }
    
    if (message.includes('location') || message.includes('geolocation')) {
        return 'Unable to access your location. Please enter your location manually.';
    }
    
    if (message.length < 100 && !message.includes('Error:')) {
        return message;
    }
    
    return 'Something went wrong with your search. Please try again.';
};

export const getSearchMetrics = (startTime, resultCount) => {
    const duration = Date.now() - startTime;
    
    return {
        duration: duration,
        durationFormatted: duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`,
        resultCount: resultCount || 0,
        performance: duration < 500 ? 'excellent' : duration < 1000 ? 'good' : duration < 2000 ? 'fair' : 'slow'
    };
};
