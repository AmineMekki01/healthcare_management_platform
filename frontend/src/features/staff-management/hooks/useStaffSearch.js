import { useState, useCallback, useMemo } from 'react';
import { staffUtils } from '../utils';

const useStaffSearch = (initialStaff = []) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        role: 'all',
        dateRange: null
    });
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    const filteredAndSortedStaff = useMemo(() => {
        let result = [...initialStaff];

        if (searchQuery) {
        result = staffUtils.searchStaff(result, searchQuery);
        }

        if (filters.status && filters.status !== 'all') {
        result = staffUtils.filterStaffByStatus(result, filters.status);
        }

        if (filters.role && filters.role !== 'all') {
        result = staffUtils.filterStaffByRole(result, filters.role);
        }

        if (filters.dateRange) {
        result = result.filter(staff => {
            if (!staff.createdAt) return false;
            const staffDate = new Date(staff.createdAt);
            const { startDate, endDate } = filters.dateRange;
            return staffDate >= startDate && staffDate <= endDate;
        });
        }

        switch (sortBy) {
        case 'name':
            result = staffUtils.sortStaffByName(result);
            break;
        case 'status':
            result = staffUtils.sortStaffByStatus(result);
            break;
        case 'joinDate':
            result = staffUtils.sortStaffByJoinDate(result, sortOrder === 'asc');
            break;
        default:
            break;
        }

        if (sortBy !== 'status' && sortBy !== 'joinDate' && sortOrder === 'desc') {
        result = result.reverse();
        }

        return result;
    }, [initialStaff, searchQuery, filters, sortBy, sortOrder]);

    const searchStats = useMemo(() => {
        return {
        total: initialStaff.length,
        filtered: filteredAndSortedStaff.length,
        hasActiveFilters: searchQuery || 
                        filters.status !== 'all' || 
                        filters.role !== 'all' || 
                        filters.dateRange !== null
        };
    }, [initialStaff, filteredAndSortedStaff, searchQuery, filters]);

    const updateSearch = useCallback((query) => {
        setSearchQuery(query || '');
    }, []);

    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({
        ...prev,
        [key]: value
        }));
    }, []);

    const updateSort = useCallback((field, order = null) => {
        setSortBy(field);
        if (order) {
        setSortOrder(order);
        } else {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        }
    }, []);

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setFilters({
        status: 'all',
        role: 'all',
        dateRange: null
        });
        setSortBy('name');
        setSortOrder('asc');
    }, []);

    const setDateRangeFilter = useCallback((startDate, endDate) => {
        setFilters(prev => ({
        ...prev,
        dateRange: startDate && endDate ? { startDate, endDate } : null
        }));
    }, []);

    return {
        searchQuery,
        filters,
        sortBy,
        sortOrder,
        filteredAndSortedStaff,
        searchStats,
        
        updateSearch,
        updateFilter,
        updateSort,
        clearFilters,
        setDateRangeFilter
    };
};

export default useStaffSearch;
