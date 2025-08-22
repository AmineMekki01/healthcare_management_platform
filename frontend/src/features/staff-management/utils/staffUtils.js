export const staffUtils = {
    formatFullName: (firstName, lastName) => {
        const fullName = `${firstName || ''} ${lastName || ''}`.trim();
        return fullName || 'Unknown User';
    },

    generateInitials: (firstName, lastName) => {
        const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
        return `${firstInitial}${lastInitial}` || '?';
    },

    formatPhoneNumber: (phone) => {
        if (!phone) return 'N/A';
        
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
        }
        
        return phone;
    },

    formatEmail: (email) => {
        if (!email) return 'N/A';
        return email.toLowerCase().trim();
    },

    validateEmail: (email) => {
        if (!email) return false;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    validatePhoneNumber: (phone) => {
        if (!phone) return false;
        
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleaned = phone.replace(/\D/g, '');
        return phoneRegex.test(cleaned) && cleaned.length >= 10;
    },

    formatDate: (dateString, options = {}) => {
        if (!dateString) return 'N/A';
        
        try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
        } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
        }
    },

    formatDateTime: (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        
        try {
        const dateTime = new Date(dateTimeString);
        if (isNaN(dateTime.getTime())) return 'Invalid DateTime';
        
        return dateTime.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        } catch (error) {
        console.error('Error formatting datetime:', error);
        return 'Invalid DateTime';
        }
    },

    getTimeAgo: (dateString) => {
        if (!dateString) return 'Never';
        
        try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 30) return `${diffInDays}d ago`;
        
        return staffUtils.formatDate(dateString);
        } catch (error) {
        console.error('Error calculating time ago:', error);
        return 'Unknown';
        }
    },

    calculateExperience: (startDate) => {
        if (!startDate) return 'N/A';
        
        try {
        const start = new Date(startDate);
        const now = new Date();
        const diffInMs = now - start;
        const diffInMonths = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30));
        
        if (diffInMonths < 1) return 'Less than a month';
        if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''}`;
        
        const years = Math.floor(diffInMonths / 12);
        const months = diffInMonths % 12;
        
        let result = `${years} year${years > 1 ? 's' : ''}`;
        if (months > 0) {
            result += `, ${months} month${months > 1 ? 's' : ''}`;
        }
        
        return result;
        } catch (error) {
        console.error('Error calculating experience:', error);
        return 'Unknown';
        }
    },

    getStatusColor: (status) => {
        const statusColors = {
        active: '#10b981',
        inactive: '#6b7280',
        online: '#10b981',
        offline: '#ef4444',
        busy: '#f59e0b',
        available: '#10b981',
        break: '#8b5cf6',
        pending: '#f59e0b'
        };
        
        return statusColors[status?.toLowerCase()] || '#6b7280';
    },

    getRoleColor: (role) => {
        const roleColors = {
        receptionist: '#3b82f6',
        admin: '#ef4444',
        manager: '#8b5cf6',
        supervisor: '#f59e0b'
        };
        
        return roleColors[role?.toLowerCase()] || '#6b7280';
    },

    sortStaffByName: (staff) => {
        return [...staff].sort((a, b) => {
        const nameA = staffUtils.formatFullName(a.firstName, a.lastName);
        const nameB = staffUtils.formatFullName(b.firstName, b.lastName);
        return nameA.localeCompare(nameB);
        });
    },

    sortStaffByStatus: (staff) => {
        const statusOrder = { active: 1, busy: 2, break: 3, offline: 4, inactive: 5 };
        return [...staff].sort((a, b) => {
        const orderA = statusOrder[a.status] || 999;
        const orderB = statusOrder[b.status] || 999;
        return orderA - orderB;
        });
    },

    sortStaffByJoinDate: (staff, ascending = false) => {
        return [...staff].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return ascending ? dateA - dateB : dateB - dateA;
        });
    },

    filterStaffByStatus: (staff, status) => {
        if (!status || status === 'all') return staff;
        return staff.filter(member => member.status === status);
    },

    filterStaffByRole: (staff, role) => {
        if (!role || role === 'all') return staff;
        return staff.filter(member => member.role?.toLowerCase() === role.toLowerCase());
    },

    searchStaff: (staff, searchTerm) => {
        if (!searchTerm) return staff;
        
        const term = searchTerm.toLowerCase();
        return staff.filter(member => {
        const fullName = staffUtils.formatFullName(member.firstName, member.lastName).toLowerCase();
        const email = (member.email || '').toLowerCase();
        const phone = (member.phoneNumber || '').toLowerCase();
        const username = (member.username || '').toLowerCase();
        
        return fullName.includes(term) ||
                email.includes(term) ||
                phone.includes(term) ||
                username.includes(term);
        });
    },

    getStaffStatistics: (staff) => {
        const total = staff.length;
        const active = staff.filter(s => s.status === 'active').length;
        const inactive = staff.filter(s => s.status === 'inactive').length;
        const online = staff.filter(s => s.status === 'online').length;
        const busy = staff.filter(s => s.status === 'busy').length;
        
        return {
        total,
        active,
        inactive,
        online,
        busy,
        activePercentage: total > 0 ? Math.round((active / total) * 100) : 0,
        onlinePercentage: total > 0 ? Math.round((online / total) * 100) : 0
        };
    },

    transformProfileDataForApi: (profileData) => {
        return {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone_number: profileData.phoneNumber,
        bio: profileData.bio,
        profile_photo_url: profileData.profilePhotoUrl
        };
    },

    transformScheduleForApi: (schedule) => {
        return schedule.map(day => ({
        day_of_week: day.dayOfWeek,
        start_time: day.startTime,
        end_time: day.endTime,
        is_working_day: day.isWorkingDay,
        break_start: day.breakStart,
        break_end: day.breakEnd
        }));
    },

    transformScheduleFromApi: (schedule) => {
        if (!Array.isArray(schedule)) return [];
        
        return schedule.map(day => ({
        dayOfWeek: day.day_of_week,
        startTime: day.start_time,
        endTime: day.end_time,
        isWorkingDay: day.is_working_day,
        breakStart: day.break_start,
        breakEnd: day.break_end
        }));
    },

    transformInviteDataForApi: (inviteData) => {
        return {
        email: inviteData.email,
        first_name: inviteData.firstName,
        last_name: inviteData.lastName,
        message: inviteData.message,
        permissions: inviteData.permissions || [],
        work_schedule: inviteData.workSchedule || [],
        start_date: inviteData.startDate
        };
    },

    transformStatisticsData: (rawData) => {
        return {
        totalStaff: rawData.total_staff || 0,
        activeStaff: rawData.active_staff || 0,
        newHires: rawData.new_hires || 0,
        totalHours: rawData.total_hours || 0,
        averagePerformance: rawData.average_performance || 0,
        productivity: rawData.productivity || 0,
        attendanceRate: rawData.attendance_rate || 0,
        satisfactionScore: rawData.satisfaction_score || 0,
        trends: {
            staffGrowth: rawData.trends?.staff_growth || [],
            performanceTrend: rawData.trends?.performance_trend || [],
            attendanceTrend: rawData.trends?.attendance_trend || []
        }
        };
    },

    transformPerformanceData: (rawData) => {
        return {
        overallScore: rawData.overall_score || 0,
        tasksCompleted: rawData.tasks_completed || 0,
        averageResponseTime: rawData.average_response_time || 0,
        customerSatisfaction: rawData.customer_satisfaction || 0,
        punctuality: rawData.punctuality || 0,
        goals: {
            achieved: rawData.goals?.achieved || 0,
            total: rawData.goals?.total || 0,
            percentage: rawData.goals?.percentage || 0
        },
        metrics: {
            efficiency: rawData.metrics?.efficiency || 0,
            quality: rawData.metrics?.quality || 0,
            reliability: rawData.metrics?.reliability || 0
        }
        };
    },

    transformReportData: (rawData) => {
        return {
        summary: {
            totalStaff: rawData.summary?.total_staff || 0,
            activeStaff: rawData.summary?.active_staff || 0,
            averageExperience: rawData.summary?.average_experience || 0,
            turnoverRate: rawData.summary?.turnover_rate || 0
        },
        departments: rawData.departments || [],
        performance: rawData.performance || [],
        attendance: rawData.attendance || [],
        costs: {
            totalSalaries: rawData.costs?.total_salaries || 0,
            benefits: rawData.costs?.benefits || 0,
            training: rawData.costs?.training || 0,
            recruitment: rawData.costs?.recruitment || 0
        },
        recommendations: rawData.recommendations || []
        };
    },

    transformAvailabilityData: (rawData) => {
        if (!rawData || !Array.isArray(rawData.availability)) {
        return [];
        }
        
        return rawData.availability.map(slot => ({
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        status: slot.status,
        type: slot.type,
        notes: slot.notes
        }));
    },

    transformAvailabilityForApi: (availability) => {
        return availability.map(slot => ({
        date: slot.date,
        start_time: slot.startTime,
        end_time: slot.endTime,
        status: slot.status,
        type: slot.type,
        notes: slot.notes
        }));
    },

    generateScheduleSummary: (schedule) => {
        if (!Array.isArray(schedule) || schedule.length === 0) {
        return 'No schedule available';
        }
        
        const workingDays = schedule.filter(day => day.isWorkingDay);
        if (workingDays.length === 0) {
        return 'No working days scheduled';
        }
        
        const totalHours = workingDays.reduce((total, day) => {
        if (day.startTime && day.endTime) {
            const start = new Date(`2000-01-01 ${day.startTime}`);
            const end = new Date(`2000-01-01 ${day.endTime}`);
            const hours = (end - start) / (1000 * 60 * 60);
            return total + hours;
        }
        return total;
        }, 0);
        
        return `${workingDays.length} days/week, ${totalHours.toFixed(1)} hours total`;
    },

    validateStaffData: (staffData) => {
        const errors = [];
        
        if (!staffData.firstName || staffData.firstName.trim().length < 2) {
        errors.push('First name must be at least 2 characters');
        }
        
        if (!staffData.lastName || staffData.lastName.trim().length < 2) {
        errors.push('Last name must be at least 2 characters');
        }
        
        if (!staffData.email || !staffUtils.validateEmail(staffData.email)) {
        errors.push('Valid email is required');
        }
        
        if (staffData.phoneNumber && !staffUtils.validatePhoneNumber(staffData.phoneNumber)) {
        errors.push('Valid phone number is required');
        }
        
        return {
        isValid: errors.length === 0,
        errors
        };
    },

    calculateProductivityScore: (metrics) => {
        if (!metrics) return 0;
        
        const {
        tasksCompleted = 0,
        averageResponseTime = 0,
        customerSatisfaction = 0,
        punctuality = 0
        } = metrics;
        
        let score = 0;
        
        score += Math.min(tasksCompleted / 10, 1) * 25;
        score += Math.max(0, (100 - averageResponseTime) / 100) * 25;
        score += (customerSatisfaction / 100) * 25;
        score += (punctuality / 100) * 25;
        
        return Math.round(score);
    },

    getWorkloadStatus: (currentTasks, capacity) => {
        if (!capacity || capacity === 0) return 'unknown';
        
        const utilization = (currentTasks / capacity) * 100;
        
        if (utilization >= 100) return 'overloaded';
        if (utilization >= 80) return 'busy';
        if (utilization >= 60) return 'moderate';
        if (utilization >= 30) return 'light';
        return 'available';
    },

    formatContractType: (type) => {
        const types = {
        'full-time': 'Full Time',
        'part-time': 'Part Time',
        'contract': 'Contract',
        'temporary': 'Temporary',
        'intern': 'Intern'
        };
        
        return types[type?.toLowerCase()] || type || 'Unknown';
    },

    getDaysUntilAction: (actionDate) => {
        if (!actionDate) return null;
        
        try {
        const action = new Date(actionDate);
        const now = new Date();
        const diffInMs = action - now;
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
        
        return diffInDays;
        } catch (error) {
        console.error('Error calculating days until action:', error);
        return null;
        }
    },

    isUpcomingReview: (lastReviewDate, reviewInterval = 90) => {
        if (!lastReviewDate) return true;
        
        try {
        const lastReview = new Date(lastReviewDate);
        const now = new Date();
        const daysSinceReview = (now - lastReview) / (1000 * 60 * 60 * 24);
        
        return daysSinceReview >= (reviewInterval - 7);
        } catch (error) {
        console.error('Error checking review status:', error);
        return false;
        }
    }
};

export default staffUtils;
