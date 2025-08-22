import { format, parseISO, isValid, differenceInYears, startOfDay } from 'date-fns';

export const userValidation = {
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePhoneNumber(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone?.replace(/[\s\-\(\)]/g, ''));
  },

  validatePassword(password) {
    const minLength = password && password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
      strength: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  },

  validateUserProfile(profileData, userType) {
    const errors = {};

    if (!profileData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!profileData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!profileData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!this.validateEmail(profileData.email)) {
      errors.email = 'Invalid email format';
    }

    if (profileData.phoneNumber && !this.validatePhoneNumber(profileData.phoneNumber)) {
      errors.phoneNumber = 'Invalid phone number format';
    }

    if (userType === 'doctor') {
      if (!profileData.specialization?.trim()) {
        errors.specialization = 'Specialization is required';
      }
      if (!profileData.licenseNumber?.trim()) {
        errors.licenseNumber = 'License number is required';
      }
      if (profileData.consultationFee && (isNaN(profileData.consultationFee) || profileData.consultationFee < 0)) {
        errors.consultationFee = 'Valid consultation fee is required';
      }
    }

    if (userType === 'patient') {
      if (profileData.dateOfBirth && !isValid(parseISO(profileData.dateOfBirth))) {
        errors.dateOfBirth = 'Valid date of birth is required';
      }
    }

    if (userType === 'receptionist') {
      if (!profileData.department?.trim()) {
        errors.department = 'Department is required';
      }
      if (!profileData.position?.trim()) {
        errors.position = 'Position is required';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  validateAppointmentData(appointmentData) {
    const errors = {};

    if (!appointmentData.doctorId) {
      errors.doctorId = 'Doctor selection is required';
    }

    if (!appointmentData.patientId) {
      errors.patientId = 'Patient selection is required';
    }

    if (!appointmentData.date) {
      errors.date = 'Appointment date is required';
    } else if (new Date(appointmentData.date) < startOfDay(new Date())) {
      errors.date = 'Appointment date cannot be in the past';
    }

    if (!appointmentData.time) {
      errors.time = 'Appointment time is required';
    }

    if (!appointmentData.reasonForVisit?.trim()) {
      errors.reasonForVisit = 'Reason for visit is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export const userFormatting = {
  formatFullName(firstName, lastName) {
    const first = firstName?.trim() || '';
    const last = lastName?.trim() || '';
    return [first, last].filter(Boolean).join(' ') || 'Unknown User';
  },

  generateInitials(firstName, lastName) {
    const first = firstName?.trim()?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.trim()?.charAt(0)?.toUpperCase() || '';
    return (first + last) || 'U';
  },

  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phoneNumber;
  },

  formatUserStatus(status) {
    const statusMap = {
      'active': { label: 'Active', color: 'green' },
      'inactive': { label: 'Inactive', color: 'gray' },
      'suspended': { label: 'Suspended', color: 'red' },
      'pending': { label: 'Pending', color: 'yellow' },
      'verified': { label: 'Verified', color: 'blue' }
    };

    return statusMap[status?.toLowerCase()] || { label: status || 'Unknown', color: 'gray' };
  },

  formatUserType(userType) {
    const typeMap = {
      'doctor': 'Doctor',
      'patient': 'Patient',
      'receptionist': 'Receptionist',
      'admin': 'Administrator'
    };

    return typeMap[userType?.toLowerCase()] || userType || 'Unknown';
  },

  formatDate(date, formatStr = 'MMM dd, yyyy') {
    if (!date) return '';
    
    try {
      const parsedDate = typeof date === 'string' ? parseISO(date) : date;
      return isValid(parsedDate) ? format(parsedDate, formatStr) : '';
    } catch (error) {
      console.warn('Invalid date format:', date);
      return '';
    }
  },

  formatTime(time, formatStr = 'h:mm a') {
    if (!time) return '';
    
    try {
      if (typeof time === 'string') {
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return format(date, formatStr);
      }
      
      const parsedTime = typeof time === 'string' ? parseISO(time) : time;
      return isValid(parsedTime) ? format(parsedTime, formatStr) : '';
    } catch (error) {
      console.warn('Invalid time format:', time);
      return '';
    }
  },

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    
    try {
      const birthDate = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
      return isValid(birthDate) ? differenceInYears(new Date(), birthDate) : null;
    } catch (error) {
      console.warn('Invalid date of birth:', dateOfBirth);
      return null;
    }
  },

  formatContactInfo(user) {
    return {
      email: user.email || '',
      phone: this.formatPhoneNumber(user.phoneNumber),
      formattedPhone: this.formatPhoneNumber(user.phoneNumber),
      hasEmail: !!user.email,
      hasPhone: !!user.phoneNumber,
      isVerified: user.emailVerified || false
    };
  }
};


export const userTransformation = {
  transformProfileDataForApi(profileData, userType) {
    const baseTransform = {
      first_name: profileData.firstName?.trim(),
      last_name: profileData.lastName?.trim(),
      email: profileData.email?.trim().toLowerCase(),
      phone_number: profileData.phoneNumber?.replace(/\D/g, ''),
      bio: profileData.bio?.trim(),
      username: profileData.username?.trim()
    };

    Object.keys(baseTransform).forEach(key => {
      if (baseTransform[key] === undefined || baseTransform[key] === '') {
        delete baseTransform[key];
      }
    });

    if (userType === 'doctor') {
      return {
        ...baseTransform,
        specialization: profileData.specialization?.trim(),
        experience: parseInt(profileData.experience) || 0,
        qualification: profileData.qualification?.trim(),
        license_number: profileData.licenseNumber?.trim(),
        consultation_fee: parseFloat(profileData.consultationFee) || 0,
        languages: Array.isArray(profileData.languages) ? profileData.languages : []
      };
    }

    if (userType === 'patient') {
      return {
        ...baseTransform,
        date_of_birth: profileData.dateOfBirth,
        gender: profileData.gender?.toLowerCase(),
        blood_type: profileData.bloodType?.toUpperCase(),
        emergency_contact: profileData.emergencyContact || {},
        insurance_info: profileData.insuranceInfo || {}
      };
    }

    if (userType === 'receptionist') {
      return {
        ...baseTransform,
        department: profileData.department?.trim(),
        position: profileData.position?.trim(),
        assigned_doctor_id: profileData.assignedDoctorId,
        work_schedule: profileData.workSchedule || []
      };
    }

    return baseTransform;
  },

  transformAppointmentDataForApi(appointmentData) {
    return {
      doctor_id: appointmentData.doctorId,
      patient_id: appointmentData.patientId,
      appointment_date: appointmentData.date,
      appointment_time: appointmentData.time,
      title: appointmentData.title?.trim(),
      appointmentType: appointmentData.appointmentType || 'consultation',
      notes: appointmentData.notes?.trim(),
      duration: appointmentData.duration || 30,
      priority: appointmentData.priority || 'normal'
    };
  },

  transformScheduleData(scheduleData) {
    if (!scheduleData) return {};

    return {
      schedule: scheduleData.schedule || {},
      timeSlots: scheduleData.time_slots || [],
      breakTimes: scheduleData.break_times || [],
      workingDays: scheduleData.working_days || [],
      availabilities: scheduleData.availabilities || []
    };
  },

  transformScheduleForApi(schedule) {
    return {
      schedule: schedule.schedule || {},
      time_slots: schedule.timeSlots || [],
      break_times: schedule.breakTimes || [],
      working_days: schedule.workingDays || []
    };
  },

  transformStatsData(statsData) {
    if (!statsData) return {};

    return {
      totalAppointments: statsData.total_appointments || 0,
      completedAppointments: statsData.completed_appointments || 0,
      cancelledAppointments: statsData.cancelled_appointments || 0,
      pendingAppointments: statsData.pending_appointments || 0,
      appointmentRate: statsData.appointment_rate || 0,
      cancellationRate: statsData.cancellation_rate || 0,
      revenue: statsData.revenue || 0,
      averageRating: statsData.average_rating || 0,
      totalPatients: statsData.total_patients || 0,
      newPatients: statsData.new_patients || 0,
      returningPatients: statsData.returning_patients || 0
    };
  },

  transformUserStatsData(statsData, userType) {
    const baseStats = this.transformStatsData(statsData);

    if (userType === 'doctor') {
      return {
        ...baseStats,
        totalPatientsTreated: statsData.total_patients_treated || 0,
        averageConsultationTime: statsData.average_consultation_time || 0,
        specialtyRanking: statsData.specialty_ranking || null,
        reviewCount: statsData.review_count || 0
      };
    }

    if (userType === 'patient') {
      return {
        ...baseStats,
        totalVisits: statsData.total_visits || 0,
        lastVisit: statsData.last_visit || null,
        upcomingAppointments: statsData.upcoming_appointments || 0,
        favoriteDoctor: statsData.favorite_doctor || null,
        healthScore: statsData.health_score || null
      };
    }

    if (userType === 'receptionist') {
      return {
        ...baseStats,
        appointmentsScheduled: statsData.appointments_scheduled || 0,
        patientsCheckedIn: statsData.patients_checked_in || 0,
        callsHandled: statsData.calls_handled || 0,
        efficiency: statsData.efficiency || 0
      };
    }

    return baseStats;
  },

  transformReportData(reportData) {
    if (!reportData) return {};

    return {
      reportType: reportData.report_type || 'summary',
      generatedAt: reportData.generated_at || new Date().toISOString(),
      data: reportData.data || {},
      summary: reportData.summary || {},
      charts: reportData.charts || [],
      tables: reportData.tables || [],
      insights: reportData.insights || []
    };
  }
};


export const userFiltering = {
  filterUsersBySearch(users, searchTerm) {
    if (!searchTerm || !Array.isArray(users)) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(user => {
      const fullName = userFormatting.formatFullName(user.firstName, user.lastName).toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = (user.phoneNumber || '').replace(/\D/g, '');
      const specialization = (user.specialization || '').toLowerCase();

      return fullName.includes(term) ||
             email.includes(term) ||
             phone.includes(term) ||
             specialization.includes(term);
    });
  },

  filterUsersByType(users, userType) {
    if (!userType || userType === 'all') return users;
    return users.filter(user => user.userType === userType);
  },

  filterUsersByStatus(users, status) {
    if (!status || status === 'all') return users;
    return users.filter(user => user.isActive === (status === 'active'));
  },

  sortUsers(users, sortBy = 'name', sortOrder = 'asc') {
    const sortedUsers = [...users].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = userFormatting.formatFullName(a.firstName, a.lastName);
          bValue = userFormatting.formatFullName(b.firstName, b.lastName);
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'userType':
          aValue = a.userType || '';
          bValue = b.userType || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'lastActive':
          aValue = new Date(a.lastActive || 0);
          bValue = new Date(b.lastActive || 0);
          break;
        default:
          aValue = a[sortBy] || '';
          bValue = b[sortBy] || '';
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedUsers;
  },

  getFilterOptions(users) {
    const userTypes = [...new Set(users.map(user => user.userType).filter(Boolean))];
    const specializations = [...new Set(users.map(user => user.specialization).filter(Boolean))];
    const departments = [...new Set(users.map(user => user.department).filter(Boolean))];

    return {
      userTypes: userTypes.map(type => ({
        value: type,
        label: userFormatting.formatUserType(type)
      })),
      specializations: specializations.map(spec => ({
        value: spec,
        label: spec
      })),
      departments: departments.map(dept => ({
        value: dept,
        label: dept
      })),
      statuses: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    };
  }
};

export const userDisplay = {
  getUserAvatar(user, size = 40) {
    if (user.profilePhotoUrl) {
      return user.profilePhotoUrl;
    }

    const initials = userFormatting.generateInitials(user.firstName, user.lastName);
    const backgroundColor = userDisplay.getAvatarColor(user.userId || user.id);
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=${backgroundColor}&color=ffffff&bold=true`;
  },

  getAvatarColor(userId) {
    const colors = [
      '6366f1', 'ec4899', 'f59e0b', 'ef4444', '10b981',
      '3b82f6', '8b5cf6', 'f97316', '06b6d4', '84cc16'
    ];
    
    const hash = userId ? userId.toString().split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) : 0;
    
    return colors[Math.abs(hash) % colors.length];
  },

  getUserStatusBadge(user) {
    const status = user.isActive ? 'active' : 'inactive';
    const formatted = userFormatting.formatUserStatus(status);
    
    return {
      ...formatted,
      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${formatted.color}-100 text-${formatted.color}-800`
    };
  },

  getUserTypeBadge(userType) {
    const typeColors = {
      'doctor': 'blue',
      'patient': 'green',
      'receptionist': 'purple',
      'admin': 'red'
    };

    const color = typeColors[userType?.toLowerCase()] || 'gray';
    
    return {
      label: userFormatting.formatUserType(userType),
      color,
      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`
    };
  }
};

export const userPermissions = {
  canAccessFeature(user, feature) {
    const featurePermissions = {
      'user-management': ['admin', 'receptionist'],
      'appointment-management': ['doctor', 'receptionist'],
      'medical-records': ['doctor'],
      'billing': ['admin', 'receptionist'],
      'reports': ['admin', 'doctor'],
      'settings': ['admin']
    };

    return featurePermissions[feature]?.includes(user.userType) || false;
  },

  canPerformAction(user, action, targetUser = null) {
    switch (action) {
      case 'edit-profile':
        return user.userId === targetUser?.userId || user.userType === 'admin';
      case 'delete-user':
        return user.userType === 'admin';
      case 'create-appointment':
        return ['patient', 'receptionist'].includes(user.userType);
      case 'cancel-appointment':
        return ['patient', 'doctor', 'receptionist'].includes(user.userType);
      case 'view-medical-history':
        return user.userType === 'doctor' || user.userId === targetUser?.userId;
      default:
        return false;
    }
  },

  getAvailableActions(currentUser, targetUser) {
    const actions = [];

    if (this.canPerformAction(currentUser, 'edit-profile', targetUser)) {
      actions.push({ id: 'edit', label: 'Edit Profile', icon: 'edit' });
    }

    if (this.canPerformAction(currentUser, 'delete-user', targetUser)) {
      actions.push({ id: 'delete', label: 'Delete User', icon: 'delete', dangerous: true });
    }

    if (currentUser.userType === 'admin' || currentUser.userType === 'receptionist') {
      actions.push({ id: 'toggle-status', label: targetUser.isActive ? 'Deactivate' : 'Activate', icon: 'toggle' });
    }

    return actions;
  }
};

export const userUtils = {
  validation: userValidation,
  formatting: userFormatting,
  transformation: userTransformation,
  filtering: userFiltering,
  display: userDisplay,
  permissions: userPermissions,
  validateEmail: userValidation.validateEmail,
  validatePhoneNumber: userValidation.validatePhoneNumber,
  validateUserProfile: userValidation.validateUserProfile,
  formatFullName: userFormatting.formatFullName,
  generateInitials: userFormatting.generateInitials,
  formatPhoneNumber: userFormatting.formatPhoneNumber,
  formatDate: userFormatting.formatDate,
  calculateAge: userFormatting.calculateAge,
  transformProfileDataForApi: userTransformation.transformProfileDataForApi,
  transformAppointmentDataForApi: userTransformation.transformAppointmentDataForApi,
  transformScheduleData: userTransformation.transformScheduleData,
  transformScheduleForApi: userTransformation.transformScheduleForApi,
  transformStatsData: userTransformation.transformStatsData,
  transformUserStatsData: userTransformation.transformUserStatsData,
  transformReportData: userTransformation.transformReportData,
  getUserAvatar: userDisplay.getUserAvatar,
  getUserStatusBadge: userDisplay.getUserStatusBadge,
  getUserTypeBadge: userDisplay.getUserTypeBadge,
  canAccessFeature: userPermissions.canAccessFeature,
  canPerformAction: userPermissions.canPerformAction
};
