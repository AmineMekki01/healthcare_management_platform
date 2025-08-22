export const formatFullName = (firstName, lastName) => {
    const first = firstName?.trim() || '';
    const last = lastName?.trim() || '';
    
    if (!first && !last) return 'Unknown User';
    
    const formatName = (name) => {
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };
    
    return `${formatName(first)} ${formatName(last)}`.trim();
};

export const getUserInitials = (firstName, lastName) => {
    const first = (firstName?.trim() || '').charAt(0).toUpperCase();
    const last = (lastName?.trim() || '').charAt(0).toUpperCase();
    
    if (first && last) return `${first}${last}`;
    if (first) return first;
    if (last) return last;
    return '??';
};

export const validateEmail = (email) => {
    if (!email) {
        return { isValid: false, error: 'Email is required' };
    }
    
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(trimmedEmail)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }
    
    return { isValid: true };
};

export const validatePhoneNumber = (phone) => {
    if (!phone) {
        return { isValid: true };
    }
    
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    const phoneRegex = /^[\d]{7,15}$/;
    
    if (!phoneRegex.test(cleanPhone)) {
        return { 
        isValid: false, 
        error: 'Phone number must be 7-15 digits long' 
        };
    }
    
    return { isValid: true };
};

    export const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    if (cleanPhone.length === 10) {
        return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
    }
    
    if (cleanPhone.length > 10) {
        return `+${cleanPhone}`;
    }
    
    return phone;
};

export const validateProfileData = (profileData) => {
    const errors = {};
    const warnings = {};
    
    if (!profileData.firstName?.trim()) {
        errors.firstName = 'First name is required';
    } else if (profileData.firstName.length < 2) {
        warnings.firstName = 'First name should be at least 2 characters';
    }
    
    if (!profileData.lastName?.trim()) {
        errors.lastName = 'Last name is required';
    } else if (profileData.lastName.length < 2) {
        warnings.lastName = 'Last name should be at least 2 characters';
    }
    
    const emailValidation = validateEmail(profileData.email);
    if (!emailValidation.isValid) {
        errors.email = emailValidation.error;
    }
    
    const phoneValidation = validatePhoneNumber(profileData.phoneNumber);
    if (!phoneValidation.isValid) {
        errors.phoneNumber = phoneValidation.error;
    }
    
    if (profileData.bio && profileData.bio.length > 500) {
        errors.bio = 'Bio must be less than 500 characters';
    }
    
    if (profileData.streetAddress && profileData.streetAddress.length > 200) {
        errors.streetAddress = 'Street address is too long';
    }
    
    if (profileData.zipCode && !/^\d{5}(-\d{4})?$/.test(profileData.zipCode)) {
        warnings.zipCode = 'ZIP code format may be invalid';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings,
        hasWarnings: Object.keys(warnings).length > 0
    };
};


export const validateProfilePicture = (file) => {
    if (!file) {
        return { isValid: false, error: 'No file selected' };
    }
    
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    if (file.size > maxSize) {
        return {
        isValid: false,
        error: 'File size must be less than 5MB'
        };
    }
    
    if (!allowedTypes.includes(file.type.toLowerCase())) {
        return {
        isValid: false,
        error: 'Only JPEG, PNG, and WebP images are allowed'
        };
    }
    
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
        return {
        isValid: false,
        error: 'Invalid file extension. Use .jpg, .png, or .webp'
        };
    }
    
    return { isValid: true };
    };


export const generateProfilePicturePreview = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
        reject(new Error('No file provided'));
        return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};


export const formatSpecialty = (specialty) => {
    if (!specialty) return 'General Practice';
    
    const specialtyMap = {
        'ent': 'Ear, Nose & Throat',
        'obgyn': 'Obstetrics & Gynecology',
        'ob/gyn': 'Obstetrics & Gynecology',
        'er': 'Emergency Medicine',
        'icu': 'Intensive Care',
        'ccm': 'Critical Care Medicine'
    };
    
    const lower = specialty.toLowerCase();
    if (specialtyMap[lower]) {
        return specialtyMap[lower];
    }
    
    return specialty
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const formatExperience = (years) => {
    if (!years || years <= 0) return 'New practitioner';
    
    if (years === 1) return '1 year experience';
    if (years < 5) return `${years} years experience`;
    if (years < 10) return `${years} years experience`;
    if (years < 20) return `${years}+ years experience`;
    
    return `${years}+ years of expertise`;
};

export const formatScheduleTime = (time) => {
    if (!time) return '';
    
    try {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
        return time;
    }
};


export const formatScheduleDuration = (minutes) => {
    if (!minutes) return '';
    
    if (minutes < 60) {
        return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
};


export const generateScheduleSummary = (weeklySchedule) => {
    if (!Array.isArray(weeklySchedule) || weeklySchedule.length === 0) {
        return 'No schedule set';
    }
    
    const workingDays = weeklySchedule.filter(day => day.enabled);
    
    if (workingDays.length === 0) {
        return 'No working days set';
    }
    
    if (workingDays.length === 7) {
        return 'Available every day';
    }
    
    const dayNames = workingDays.map(day => day.weekday.slice(0, 3));
    
    if (workingDays.length <= 3) {
        return `Available ${dayNames.join(', ')}`;
    }
    
    return `Available ${workingDays.length} days/week`;
};

export const validateSchedule = (weeklySchedule) => {
    const errors = [];
    const warnings = [];
    
    if (!Array.isArray(weeklySchedule)) {
        errors.push('Invalid schedule format');
        return { isValid: false, errors, warnings };
    }
    
    weeklySchedule.forEach((day, index) => {
        if (!day.weekday) {
        errors.push(`Day ${index + 1}: Weekday is required`);
        }
        
        if (day.enabled) {
        if (!day.start || !day.end) {
            errors.push(`${day.weekday}: Start and end times are required`);
        }
        
        if (day.start && day.end) {
            const startMinutes = parseTime(day.start);
            const endMinutes = parseTime(day.end);
            
            if (startMinutes >= endMinutes) {
            errors.push(`${day.weekday}: End time must be after start time`);
            }
            
            if (endMinutes - startMinutes < 30) {
            warnings.push(`${day.weekday}: Very short working hours (less than 30 minutes)`);
            }
        }
        
        if (day.slot_duration && (day.slot_duration < 5 || day.slot_duration > 240)) {
            warnings.push(`${day.weekday}: Unusual slot duration (${day.slot_duration} minutes)`);
        }
        }
    });
    
    const enabledDays = weeklySchedule.filter(day => day.enabled).length;
    if (enabledDays === 0) {
        warnings.push('No working days enabled');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        hasWarnings: warnings.length > 0
    };
};

export const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    } catch {
        return 0;
    }
};

export const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const generateTimeSlots = (daySchedule, bookedSlots = []) => {
    if (!daySchedule || !daySchedule.enabled) return [];
    
    const slots = [];
    const startMinutes = parseTime(daySchedule.start);
    const endMinutes = parseTime(daySchedule.end);
    const slotDuration = daySchedule.slot_duration || 30;
    
    for (let current = startMinutes; current < endMinutes; current += slotDuration) {
        const slotStart = formatTime(current);
        const slotEnd = formatTime(current + slotDuration);
        
        const isBooked = bookedSlots.some(bookedSlot => 
        bookedSlot.start === slotStart || 
        (parseTime(bookedSlot.start) < current + slotDuration && 
        parseTime(bookedSlot.end) > current)
        );
        
        slots.push({
        start: slotStart,
        end: slotEnd,
        available: !isBooked,
        duration: slotDuration
        });
    }
    
    return slots;
};


export const calculateScheduleStats = (weeklySchedule) => {
    if (!Array.isArray(weeklySchedule)) {
        return {
        totalWorkingDays: 0,
        totalWorkingHours: 0,
        averageHoursPerDay: 0,
        earliestStart: null,
        latestEnd: null
        };
    }
    
    const workingDays = weeklySchedule.filter(day => day.enabled);
    let totalMinutes = 0;
    let earliestStart = null;
    let latestEnd = null;
    
    workingDays.forEach(day => {
        const startMinutes = parseTime(day.start);
        const endMinutes = parseTime(day.end);
        
        totalMinutes += (endMinutes - startMinutes);
        
        if (earliestStart === null || startMinutes < parseTime(earliestStart)) {
        earliestStart = day.start;
        }
        
        if (latestEnd === null || endMinutes > parseTime(latestEnd)) {
        latestEnd = day.end;
        }
    });
    
    const totalWorkingHours = totalMinutes / 60;
    const averageHoursPerDay = workingDays.length > 0 ? totalWorkingHours / workingDays.length : 0;
    
    return {
        totalWorkingDays: workingDays.length,
        totalWorkingHours: Math.round(totalWorkingHours * 10) / 10,
        averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
        earliestStart: earliestStart ? formatScheduleTime(earliestStart) : null,
        latestEnd: latestEnd ? formatScheduleTime(latestEnd) : null
    };
};

export const formatProfessionalItem = (item, type) => {
    const baseFormat = {
        id: item.id || Date.now(),
        name: item.name?.trim() || '',
        ...item
    };
    
    switch (type) {
        case 'hospital':
        return {
            ...baseFormat,
            position: item.position?.trim() || '',
            department: item.department?.trim() || '',
            startDate: item.startDate || '',
            endDate: item.endDate || '',
            current: item.current || false
        };
        
        case 'award':
        return {
            ...baseFormat,
            organization: item.organization?.trim() || '',
            year: item.year || new Date().getFullYear(),
            description: item.description?.trim() || ''
        };
        
        case 'certification':
        return {
            ...baseFormat,
            issuingOrganization: item.issuingOrganization?.trim() || '',
            issueDate: item.issueDate || '',
            expiryDate: item.expiryDate || '',
            credentialId: item.credentialId?.trim() || ''
        };
        
        case 'language':
        return {
            ...baseFormat,
            proficiency: item.proficiency || 'conversational'
        };
        
        default:
        return baseFormat;
    }
};


export const validateProfessionalItems = (items, type) => {
    if (!Array.isArray(items)) {
        return { isValid: true, errors: [], warnings: [] };
    }
    
    const errors = [];
    const warnings = [];
    
    items.forEach((item, index) => {
        if (!item.name?.trim()) {
        errors.push(`${type} ${index + 1}: Name is required`);
        }
        
        if (type === 'hospital' && item.current && item.endDate) {
        warnings.push(`${type} ${index + 1}: Current position shouldn't have end date`);
        }
        
        if (type === 'certification' && item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        
        if (expiryDate < today) {
            warnings.push(`${type} ${index + 1}: Certification appears to be expired`);
        }
        }
        
        if (type === 'award' && item.year) {
        const currentYear = new Date().getFullYear();
        if (item.year > currentYear) {
            errors.push(`${type} ${index + 1}: Award year cannot be in the future`);
        }
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        hasWarnings: warnings.length > 0
    };
};

export const exportSettingsData = (settingsData) => {
    const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {
        personalInfo: settingsData.personalInfo || {},
        professionalInfo: settingsData.professionalInfo || {},
        schedule: settingsData.schedule || {},
        preferences: settingsData.preferences || {}
        }
    };
    
    return JSON.stringify(exportData, null, 2);
};

export const parseSettingsImport = (jsonString) => {
    try {
        const parsed = JSON.parse(jsonString);
        
        if (!parsed.data) {
        throw new Error('Invalid settings file format');
        }
        
        return {
        isValid: true,
        data: parsed.data,
        exportDate: parsed.exportDate,
        version: parsed.version
        };
    } catch (error) {
        return {
        isValid: false,
        error: 'Invalid JSON format or corrupted file'
        };
    }
};


export const generateChangesSummary = (oldData, newData) => {
    const changes = [];
    
    if (oldData.firstName !== newData.firstName) {
        changes.push(`First name: "${oldData.firstName}" → "${newData.firstName}"`);
    }
    
    if (oldData.lastName !== newData.lastName) {
        changes.push(`Last name: "${oldData.lastName}" → "${newData.lastName}"`);
    }
    
    if (oldData.email !== newData.email) {
        changes.push(`Email: "${oldData.email}" → "${newData.email}"`);
    }
    
    if (oldData.phoneNumber !== newData.phoneNumber) {
        changes.push(`Phone: "${oldData.phoneNumber || 'Not set'}" → "${newData.phoneNumber || 'Not set'}"`);
    }
        
    return changes;
};


export const formatSettingsError = (error, context = 'settings operation') => {
    if (!error) return 'An unknown error occurred';
    
    const message = error.message || error.toString();
    
    if (message.includes('Network Error') || message.includes('fetch')) {
        return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
        return 'You don\'t have permission to perform this action. Please try logging in again.';
    }
    
    if (message.includes('validation') || message.includes('required')) {
        return message;
    }
    
    if (context.includes('upload') && message.includes('size')) {
        return 'File size is too large. Please choose a smaller image.';
    }
    
    if (message.length < 100 && !message.includes('Error:')) {
        return message;
    }
    
    return `Something went wrong with your ${context}. Please try again or contact support if the problem persists.`;
};
