
import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../auth/context/AuthContext';
import { settingsService } from '../services/settingsService';
import {
    validateProfileData,
    validateProfilePicture,
    validateSchedule,
    validateProfessionalItems,
    formatSettingsError,
    generateChangesSummary,
    getUserInitials,
    formatFullName
} from '../utils/settingsUtils';

export const useSettings = (initialSection = 'personal') => {
    const { t } = useTranslation('settings');
    const { userId, userType, setUserFullName, setUserProfilePhotoUrl } = useContext(AuthContext);
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    const [personalInfo, setPersonalInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        bio: '',
        streetAddress: '',
        cityName: '',
        zipCode: '',
        countryName: '',
        profilePictureUrl: ''
    });
    
    const [followedDoctors, setFollowedDoctors] = useState([]);
    const [professionalInfo, setProfessionalInfo] = useState({
        hospitals: [],
        organizations: [],
        awards: [],
        certifications: [],
        languages: []
    });
    
    const [scheduleData, setScheduleData] = useState({
        weeklySchedule: [],
        timezone: 'UTC'
    });
    
    const [activeSection, setActiveSection] = useState(initialSection);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ show: false, action: null, data: null });
    
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    const abortControllerRef = useRef(null);
    const originalDataRef = useRef({});

    const loadPersonalInfo = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const profile = await settingsService.getPersonalInfo(userId);
            setPersonalInfo(profile);
            originalDataRef.current.personalInfo = { ...profile };
        } catch (err) {
            const errorMessage = formatSettingsError(err, 'loading personal information');
            setError(errorMessage);
            console.error('Failed to load personal info:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const updatePersonalInfo = useCallback(async (updatedInfo = personalInfo) => {
        if (!userId) return;

        const validation = validateProfileData(updatedInfo);
        if (!validation.isValid) {
            setError(validation.errors.join(', '));
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const updated = await settingsService.updatePersonalInfo(userId, updatedInfo);
            setPersonalInfo(updated);
            
            const fullName = formatFullName(updated.firstName, updated.lastName);
            setUserFullName(fullName);
            
            setSuccess(t('personalInfo.success.profileUpdated'));
            setHasUnsavedChanges(false);
            originalDataRef.current.personalInfo = { ...updated };

            const changes = generateChangesSummary(originalDataRef.current.personalInfo, updated);
            if (changes.length > 0) {
                console.log('Profile changes:', changes);
            }

        } catch (err) {
            const errorMessage = formatSettingsError(err, 'updating personal information');
            setError(errorMessage);
            console.error('Failed to update personal info:', err);
        } finally {
            setSaving(false);
        }
    }, [userId, personalInfo, setUserFullName, t]);

    const uploadProfilePicture = useCallback(async (file) => {
        if (!userId || !file) return;

        const validation = validateProfilePicture(file);
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }

        setSaving(true);
        setError(null);
        setUploadProgress(0);

        try {
            const result = await settingsService.uploadProfilePicture(userId, file);
        
            setPersonalInfo(prev => ({
                ...prev,
                profilePictureUrl: result.imageUrl
            }));
            
            setUserProfilePhotoUrl(result.imageUrl);
            
            setSuccess(t('personalInfo.success.profileUpdated'));
            setProfilePictureFile(null);
            setProfilePicturePreview(null);

        } catch (err) {
            const errorMessage = formatSettingsError(err, 'uploading profile picture');
            setError(errorMessage);
            console.error('Failed to upload profile picture:', err);
        } finally {
            setSaving(false);
            setUploadProgress(0);
        }
    }, [userId, setUserProfilePhotoUrl, t]);

    const loadFollowedDoctors = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const doctors = await settingsService.getFollowedDoctors(userId);
            setFollowedDoctors(doctors);
        } catch (err) {
            const errorMessage = formatSettingsError(err, 'loading followed doctors');
            setError(errorMessage);
            console.error('Failed to load followed doctors:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);


    const unfollowDoctor = useCallback(async (doctorId) => {
        if (!userId || !doctorId) return;

        setSaving(true);
        setError(null);

        try {
            await settingsService.unfollowDoctor(userId, doctorId);
            
            setFollowedDoctors(prev => prev.filter(doctor => 
                doctor.id !== doctorId && doctor.userId !== doctorId
            ));
            
            setSuccess(t('followedDoctors.success.unfollowed', { doctorName: 'Doctor' }));
        } catch (err) {
            const errorMessage = formatSettingsError(err, 'unfollowing doctor');
            setError(errorMessage);
            console.error('Failed to unfollow doctor:', err);
        } finally {
            setSaving(false);
        }
    }, [userId, t]);


    const loadProfessionalInfo = useCallback(async () => {
        if (!userId || userType !== 'doctor') return;

        setLoading(true);
        setError(null);

        try {
            const info = await settingsService.getDoctorAdditionalInfo(userId);
            setProfessionalInfo(info);
            originalDataRef.current.professionalInfo = { ...info };
        } catch (err) {
            const errorMessage = formatSettingsError(err, 'loading professional information');
            setError(errorMessage);
            console.error('Failed to load professional info:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, userType]);


    const updateProfessionalInfo = useCallback(async (updatedInfo = professionalInfo) => {
        if (!userId || userType !== 'doctor') return;

        const validations = {
        hospitals: validateProfessionalItems(updatedInfo.hospitals, 'hospital'),
        awards: validateProfessionalItems(updatedInfo.awards, 'award'),
        certifications: validateProfessionalItems(updatedInfo.certifications, 'certification'),
        languages: validateProfessionalItems(updatedInfo.languages, 'language')
        };

        const allErrors = Object.values(validations).flatMap(v => v.errors);
        if (allErrors.length > 0) {
            setError(allErrors.join(', '));
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const updated = await settingsService.updateDoctorAdditionalInfo(userId, updatedInfo);
            setProfessionalInfo(updated);
            
            setSuccess(t('doctorInfo.success.informationUpdated'));
            setHasUnsavedChanges(false);
            originalDataRef.current.professionalInfo = { ...updated };

        } catch (err) {
            const errorMessage = formatSettingsError(err, 'updating professional information');
            setError(errorMessage);
            console.error('Failed to update professional info:', err);
        } finally {
            setSaving(false);
        }
    }, [userId, userType, professionalInfo, t]);

    const loadSchedule = useCallback(async (dateRange = {}) => {
        if (!userId || userType !== 'doctor') return;

        setLoading(true);
        setError(null);

        try {
            const schedule = await settingsService.getDoctorSchedule(userId, dateRange);
            setScheduleData(schedule);
            originalDataRef.current.scheduleData = { ...schedule };
        } catch (err) {
            const errorMessage = formatSettingsError(err, 'loading schedule');
            setError(errorMessage);
            console.error('Failed to load schedule:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, userType]);

    const updateSchedule = useCallback(async (updatedSchedule = scheduleData) => {
        if (!userId || userType !== 'doctor') return;

        const validation = validateSchedule(updatedSchedule.weeklySchedule);
        if (!validation.isValid) {
            setError(validation.errors.join(', '));
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const updated = await settingsService.updateDoctorSchedule(userId, updatedSchedule);
            setScheduleData(updated);
            
            setSuccess(t('availability.success.scheduleSaved'));
            setHasUnsavedChanges(false);
            originalDataRef.current.scheduleData = { ...updated };

        } catch (err) {
            const errorMessage = formatSettingsError(err, 'updating schedule');
            setError(errorMessage);
            console.error('Failed to update schedule:', err);
        } finally {
            setSaving(false);
        }
    }, [userId, userType, scheduleData, t]);

    const changeSection = useCallback((newSection) => {
        if (hasUnsavedChanges) {
            setConfirmDialog({
                show: true,
                action: 'changeSection',
                data: newSection,
                message: 'You have unsaved changes. Do you want to discard them?'
            });
        } else {
            setActiveSection(newSection);
        }
    }, [hasUnsavedChanges]);

    const handlePersonalInfoChange = useCallback((field, value) => {
        setPersonalInfo(prev => ({
            ...prev,
            [field]: value
        }));
        setHasUnsavedChanges(true);
        
        if (error) {
            setError(null);
        }
    }, [error]);


    const handleProfessionalInfoChange = useCallback((category, items) => {
        setProfessionalInfo(prev => ({
            ...prev,
            [category]: items
        }));
        setHasUnsavedChanges(true);
        
        if (error) {
            setError(null);
        }
    }, [error]);


    const handleScheduleChange = useCallback((field, value) => {
        setScheduleData(prev => ({
        ...prev,
        [field]: value
        }));
        setHasUnsavedChanges(true);
        
        if (error) {
        setError(null);
        }
    }, [error]);

    const resetChanges = useCallback(() => {
        if (originalDataRef.current.personalInfo) {
            setPersonalInfo({ ...originalDataRef.current.personalInfo });
        }
        if (originalDataRef.current.professionalInfo) {
            setProfessionalInfo({ ...originalDataRef.current.professionalInfo });
        }
        if (originalDataRef.current.scheduleData) {
            setScheduleData({ ...originalDataRef.current.scheduleData });
        }
        
        setHasUnsavedChanges(false);
        setError(null);
    }, []);

    const clearMessages = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    const handleConfirmDialog = useCallback((confirmed) => {
        const { action, data } = confirmDialog;
        
        if (confirmed) {
            switch (action) {
                case 'changeSection':
                    setHasUnsavedChanges(false);
                    setActiveSection(data);
                    break;
                case 'unfollowDoctor':
                    unfollowDoctor(data);
                    break;
            }
        }
        
        setConfirmDialog({ show: false, action: null, data: null });
    }, [confirmDialog, unfollowDoctor]);

    useEffect(() => {
        switch (activeSection) {
        case 'personal':
            loadPersonalInfo();
            break;
        case 'doctors':
            loadFollowedDoctors();
            break;
        case 'additionalDoctorsInfo':
            if (userType === 'doctor') {
                loadProfessionalInfo();
            }
            break;
        case 'availability':
            if (userType === 'doctor') {
                loadSchedule();
            }
            break;
        }
    }, [activeSection, userType, loadPersonalInfo, loadFollowedDoctors, loadProfessionalInfo, loadSchedule]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        return () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        };
    }, []);

    const isLoading = loading || saving;
    const userInitials = getUserInitials(personalInfo.firstName, personalInfo.lastName);
    const userFullName = formatFullName(personalInfo.firstName, personalInfo.lastName);

    return {
        loading: isLoading,
        error,
        success,
        personalInfo,
        followedDoctors,
        professionalInfo,
        scheduleData,
        activeSection,
        hasUnsavedChanges,
        confirmDialog,
        profilePictureFile,
        profilePicturePreview,
        uploadProgress,
        updatePersonalInfo,
        uploadProfilePicture,
        handlePersonalInfoChange,
        loadFollowedDoctors,
        unfollowDoctor,
        updateProfessionalInfo,
        handleProfessionalInfoChange,
        updateSchedule,
        handleScheduleChange,
        changeSection: setActiveSection,
        resetChanges,
        clearMessages,
        handleConfirmDialog,
        setProfilePictureFile,
        setProfilePicturePreview,
        userInitials,
        userFullName,
        getUserInitials: () => userInitials,
        getFullName: () => userFullName,
        validateProfile: () => validateProfileData(personalInfo),
        validateSchedule: () => validateSchedule(scheduleData.weeklySchedule)
    };
};

export default useSettings;
