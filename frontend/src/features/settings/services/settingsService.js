import axios from '../../../components/axiosConfig';

class SettingsService {
    constructor() {
        this.baseURL = '/api/v1';
    }

    async getPersonalInfo(userId, userType) {
        if (!userId || !userType) {
        throw new Error('User ID and user type are required');
        }

        try {
        const response = await axios.get(`${this.baseURL}/user/${userId}`, {
            params: {
              userType: userType,
            }
        });
        return response.data;
        } catch (error) {
        console.error('Failed to get personal info:', error);
        throw new Error('Failed to load personal information');
        }
    }

    async updatePersonalInfo(userId, profileData, userType) {
        if (!userId || !userType) {
        throw new Error('User ID and user type are required');
        }

        try {
        const response = await axios.put(`${this.baseURL}/user/${userId}`,
            profileData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                params: {
                    userType: userType,
                },
            }
        );
        return response.data;
        } catch (error) {
            console.error('Failed to update personal info:', error);
            throw new Error('Failed to update personal information');
        }
    }

    async uploadProfilePicture(userId, file) {
        if (!userId || !file) {
        throw new Error('User ID and file are required');
        }

        const validation = this.validateProfilePicture(file);
        if (!validation.isValid) {
        throw new Error(validation.error);
        }

        try {
        const formData = new FormData();
        formData.append('profile_picture', file);

        const response = await axios.post(`${this.baseURL}/profile/${userId}/photo`, formData, {
            headers: {
            'Content-Type': 'multipart/form-data',
            },
        });

        return {
            imageUrl: response.data.imageUrl || response.data.profile_picture_url,
            message: 'Profile picture updated successfully'
        };
        } catch (error) {
        console.error('Failed to upload profile picture:', error);
        throw new Error('Failed to upload profile picture');
        }
    }

    async getFollowedDoctors(userId) {
        if (!userId) {
        throw new Error('User ID is required');
        }

        try {
        const response = await axios.get(`${this.baseURL}/user-followings/${userId}`);
        return response.data.followingUsers;
        } catch (error) {
        console.error('Failed to get followed doctors:', error);
        throw new Error('Failed to load followed doctors');
        }
    }

    async unfollowDoctor(userId, doctorId) {
        if (!userId || !doctorId) {
        throw new Error('User ID and Doctor ID are required');
        }

        try {
        await axios.delete(`${this.baseURL}/unfollow-doctor`, {
            params: {
                userId,
                doctorId,
            },
        });
        return { success: true, message: 'Doctor unfollowed successfully' };
        } catch (error) {
        console.error('Failed to unfollow doctor:', error);
        throw new Error('Failed to unfollow doctor');
        }
    }

    async getDoctorAdditionalInfo(userId) {
        if (!userId) {
        throw new Error('User ID is required');
        }

        try {
        const response = await axios.get(`${this.baseURL}/doctor/additional-info/${userId}`);
        return response.data;
        } catch (error) {
        console.error('Failed to get doctor additional info:', error);
        throw new Error('Failed to load professional information');
        }
    }

    async updateDoctorAdditionalInfo(userId, additionalInfo) {
        if (!userId) {
        throw new Error('User ID is required');
        }

        try {
        const response = await axios.put(`${this.baseURL}/doctor/additional-info/${userId}`, additionalInfo);
        return response.data;
        } catch (error) {
        console.error('Failed to update doctor additional info:', error);
        throw new Error('Failed to update professional information');
        }
    }

    async getDoctorSchedule(userId, dateRange = {}) {
        if (!userId) {
        throw new Error('User ID is required');
        }

        try {
        const params = this.buildScheduleParams(dateRange);
        const response = await axios.get(`${this.baseURL}/doctors/${userId}/schedule`, { params });
        return this.normalizeScheduleData(response.data);
        } catch (error) {
        console.error('Failed to get doctor schedule:', error);
        throw new Error('Failed to load schedule');
        }
    }

    async updateDoctorSchedule(userId, scheduleData) {
        if (!userId) {
        throw new Error('User ID is required');
        }

        try {
        const formattedData = this.formatScheduleDataForAPI(scheduleData);
        const response = await axios.put(`${this.baseURL}/doctors/${userId}/schedule`, formattedData);
        return this.normalizeScheduleData(response.data);
        } catch (error) {
        console.error('Failed to update doctor schedule:', error);
        throw new Error('Failed to update schedule');
        }
    }

    async addScheduleException(userId, exception) {
        if (!userId) {
        throw new Error('User ID is required');
        }

        try {
        const formattedData = this.formatExceptionDataForAPI(exception);
        const response = await axios.post(`${this.baseURL}/doctors/${userId}/schedule/exceptions`, formattedData);
        return this.normalizeExceptionData(response.data);
        } catch (error) {
        console.error('Failed to add schedule exception:', error);
        throw new Error('Failed to add schedule exception');
        }
    }

    async removeScheduleException(userId, exceptionId) {
        if (!userId || !exceptionId) {
        throw new Error('User ID and Exception ID are required');
        }

        try {
        await axios.delete(`${this.baseURL}/doctors/${userId}/schedule/exceptions/${exceptionId}`);
        return { success: true, message: 'Schedule exception removed' };
        } catch (error) {
        console.error('Failed to remove schedule exception:', error);
        throw new Error('Failed to remove schedule exception');
        }
    }

    normalizeProfileData(data) {
        return {
        id: data.id || data.user_id,
        firstName: data.first_name || data.FirstName || '',
        lastName: data.last_name || data.LastName || '',
        email: data.email || data.Email || '',
        phoneNumber: data.phone_number || data.PhoneNumber || '',
        bio: data.bio || data.Bio || '',
        streetAddress: data.street_address || data.StreetAddress || '',
        cityName: data.city_name || data.CityName || '',
        zipCode: data.zip_code || data.ZipCode || '',
        countryName: data.country_name || data.CountryName || '',
        profilePictureUrl: data.profile_picture_url || data.ProfilePictureUrl || '',
        userType: data.user_type || data.UserType || '',
        
        ...data
        };
    }

    formatProfileDataForAPI(profileData) {
        return {
        first_name: profileData.firstName || profileData.first_name,
        last_name: profileData.lastName || profileData.last_name,
        email: profileData.email,
        phone_number: profileData.phoneNumber || profileData.phone_number,
        bio: profileData.bio,
        street_address: profileData.streetAddress || profileData.street_address,
        city_name: profileData.cityName || profileData.city_name,
        zip_code: profileData.zipCode || profileData.zip_code,
        country_name: profileData.countryName || profileData.country_name
        };
    }

    normalizeDoctorData(doctor) {
        return {
        id: doctor.DoctorId || doctor.doctor_id || doctor.id,
        userId: doctor.UserId || doctor.user_id,
        firstName: doctor.FirstName || doctor.first_name || '',
        lastName: doctor.LastName || doctor.last_name || '',
        fullName: `Dr. ${(doctor.FirstName || doctor.first_name || '')} ${(doctor.LastName || doctor.last_name || '')}`.trim(),
        specialty: doctor.Specialty || doctor.specialty || '',
        experience: doctor.Experience || doctor.experience || 0,
        rating: doctor.RatingScore || doctor.rating || 0,
        ratingCount: doctor.RatingCount || doctor.rating_count || 0,
        location: doctor.Location || doctor.location || '',
        profilePictureUrl: doctor.ProfilePictureUrl || doctor.profile_picture_url || '',
        username: doctor.Username || doctor.username || '',
        
        ...doctor
        };
    }

    normalizeDoctorAdditionalInfo(data) {
        return {
        hospitals: data.hospitals || [],
        organizations: data.organizations || [],
        awards: data.awards || [],
        certifications: data.certifications || [],
        languages: data.languages || [],
        education: data.education || [],
        publications: data.publications || [],
        specializations: data.specializations || []
        };
    }

    formatDoctorAdditionalInfo(additionalInfo) {
        return {
        hospitals: additionalInfo.hospitals || [],
        organizations: additionalInfo.organizations || [],
        awards: additionalInfo.awards || [],
        certifications: additionalInfo.certifications || [],
        languages: additionalInfo.languages || [],
        education: additionalInfo.education || [],
        publications: additionalInfo.publications || [],
        specializations: additionalInfo.specializations || []
        };
    }

    buildScheduleParams(dateRange) {
        const params = {};
        
        if (dateRange.startDate) {
        params.start_date = dateRange.startDate;
        }
        
        if (dateRange.endDate) {
        params.end_date = dateRange.endDate;
        }
        
        if (dateRange.month !== undefined) {
        params.month = dateRange.month;
        }
        
        if (dateRange.year !== undefined) {
        params.year = dateRange.year;
        }
        
        return params;
    }

    normalizeScheduleData(data) {
        return {
        weeklySchedule: data.weekly_schedule || data.weeklySchedule || [],
        exceptions: data.exceptions || [],
        timeSlots: data.time_slots || data.timeSlots || [],
        timezone: data.timezone || 'UTC',
        lastUpdated: data.last_updated || data.lastUpdated,
        isActive: data.is_active !== false
        };
    }

    formatScheduleDataForAPI(scheduleData) {
        return {
        weekly_schedule: scheduleData.weeklySchedule || scheduleData.weekly_schedule,
        exceptions: scheduleData.exceptions || [],
        timezone: scheduleData.timezone || 'UTC'
        };
    }

    formatExceptionDataForAPI(exception) {
        return {
        date: exception.date,
        start_time: exception.startTime || exception.start_time,
        end_time: exception.endTime || exception.end_time,
        type: exception.type || 'off',
        reason: exception.reason || ''
        };
    }

    normalizeExceptionData(exception) {
        return {
        id: exception.id,
        date: exception.date,
        startTime: exception.start_time || exception.startTime,
        endTime: exception.end_time || exception.endTime,
        type: exception.type || 'off',
        reason: exception.reason || '',
        
        ...exception
        };
    }

    validateProfilePicture(file) {
        const maxSize = 5 * 1024 * 1024;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (file.size > maxSize) {
        return {
            isValid: false,
            error: 'File size must be less than 5MB'
        };
        }

        if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'Only JPEG, PNG, and WebP images are allowed'
        };
        }

        return { isValid: true };
    }

    validateProfileData(profileData) {
        const errors = [];
        
        if (!profileData.firstName?.trim()) {
        errors.push('First name is required');
        }
        
        if (!profileData.lastName?.trim()) {
        errors.push('Last name is required');
        }
        
        if (!profileData.email?.trim()) {
        errors.push('Email is required');
        } else if (!this.isValidEmail(profileData.email)) {
        errors.push('Please enter a valid email address');
        }
        
        if (profileData.phoneNumber && !this.isValidPhoneNumber(profileData.phoneNumber)) {
        errors.push('Please enter a valid phone number');
        }
        
        return {
        isValid: errors.length === 0,
        errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhoneNumber(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    getUserInitials(firstName, lastName) {
        const first = (firstName || '').charAt(0).toUpperCase();
        const last = (lastName || '').charAt(0).toUpperCase();
        return `${first}${last}` || '??';
    }

    formatFullName(firstName, lastName) {
        return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown User';
    }

    getAvailableTimeSlots(schedule, date) {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        
        const daySchedule = schedule.weeklySchedule?.find(
        day => day.weekday === dayOfWeek && day.enabled
        );
        
        if (!daySchedule) return [];
        
        const exception = schedule.exceptions?.find(ex => ex.date === date);
        if (exception && exception.type === 'off') return [];
        
        return this.generateTimeSlots(daySchedule, exception);
    }

    generateTimeSlots(daySchedule, exception = null) {
        const slots = [];
        const startTime = exception?.startTime || daySchedule.start;
        const endTime = exception?.endTime || daySchedule.end;
        const duration = daySchedule.slot_duration || 30;
        
        let current = this.parseTime(startTime);
        const end = this.parseTime(endTime);
        
        while (current < end) {
        const slotStart = this.formatTime(current);
        const slotEnd = this.formatTime(current + duration);
        
        slots.push({
            start: slotStart,
            end: slotEnd,
            available: true
        });
        
        current += duration;
        }
        
        return slots;
    }

    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
}

const settingsService = new SettingsService();
export const getPersonalInfo = (userId) => settingsService.getPersonalInfo(userId);
export const updatePersonalInfo = (userId, data) => settingsService.updatePersonalInfo(userId, data);
export const uploadProfilePicture = (userId, file) => settingsService.uploadProfilePicture(userId, file);
export const getFollowedDoctors = (userId) => settingsService.getFollowedDoctors(userId);
export const unfollowDoctor = (userId, doctorId) => settingsService.unfollowDoctor(userId, doctorId);

export { settingsService };
export default settingsService;
