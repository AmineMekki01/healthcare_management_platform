import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import StaffCard from './StaffCard';


const ListContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ListHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ListTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
`;

const ListActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ViewToggle = styled.div`
  display: flex;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
`;

const ViewButton = styled.button`
  padding: 8px 12px;
  border: none;
  background: ${props => props.$active ? '#667eea' : 'white'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active ? '#667eea' : '#f8fafc'};
  }
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    color: #667eea;
  }
`;

const SearchAndFilters = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #1a202c;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #1a202c;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ListBody = styled.div`
  padding: 24px;
`;

const ListControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ResultsInfo = styled.div`
  color: #64748b;
  font-size: 14px;
`;


const SortSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #1a202c;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const StaffGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => {
    switch (props.$view) {
      case 'grid':
        return 'repeat(auto-fill, minmax(320px, 1fr))';
      case 'list':
        return '1fr';
      case 'compact':
        return 'repeat(auto-fill, minmax(280px, 1fr))';
      default:
        return 'repeat(auto-fill, minmax(320px, 1fr))';
    }
  }};
  gap: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1a202c;
`;

const EmptyDescription = styled.p`
  margin: 0;
  font-size: 14px;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #64748b;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
`;

const PaginationButton = styled.button`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: ${props => props.$active ? '#667eea' : 'white'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    border-color: #667eea;
    background: ${props => props.$active ? '#667eea' : '#f8fafc'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BulkActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 16px;
  
  ${props => !props.$visible && 'display: none;'}
`;

const BulkActionButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    color: #667eea;
  }
  
  &.danger:hover {
    border-color: #ef4444;
    color: #ef4444;
  }
`;

const StaffList = ({ 
  staff = [], 
  loading = false,
  onStaffSelect,
  onStaffEdit,
  onViewSchedule,
  onManagePermissions,
  onActivate,
  onDeactivate, 
  onDismiss,
  onBulkAction,
  showSearch = true,
  showFilters = true,
  showBulkActions = true,
  compact = false,
  title = "Staff Members",
  className 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [view, setView] = useState(compact ? 'compact' : 'grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState(new Set());
  const itemsPerPage = 12;
  console.log('StaffList rendered with staff:', staff);
  const filteredStaff = useMemo(() => {
    if (!Array.isArray(staff)) {
      console.warn('Staff prop is not an array:', staff);
      return [];
    }
    
    let filtered = [...staff];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(query) ||
        s.firstName?.toLowerCase().includes(query) ||
        s.lastName?.toLowerCase().includes(query) ||
        s.username?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.phone?.includes(query) ||
        s.id?.toString().includes(query) ||
        s.specializations?.some(spec => 
          (typeof spec === 'string' ? spec : spec.name)?.toLowerCase().includes(query)
        ) ||
        s.permissions?.some(perm => 
          (typeof perm === 'string' ? perm : perm.permission_type)?.toLowerCase().includes(query)
        )
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(s => s.role === roleFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (departmentFilter) {
      filtered = filtered.filter(s => s.department === departmentFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'role':
          return (a.role || '').localeCompare(b.role || '');
        case 'department':
          return (a.department || '').localeCompare(b.department || '');
        case 'experience':
          return (b.experience || 0) - (a.experience || 0);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [staff, searchQuery, roleFilter, statusFilter, departmentFilter, sortBy]);

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueRoles = [...new Set(staff.map(s => s.role).filter(Boolean))];
  const uniqueStatuses = [...new Set(staff.map(s => s.status).filter(Boolean))];
  const uniqueDepartments = [...new Set(staff.map(s => s.department).filter(Boolean))];

  const handleStaffSelect = (staffMember) => {
    if (onStaffSelect) {
      onStaffSelect(staffMember);
    }
  };

  const handleBulkSelect = (staffId, selected) => {
    const newSelected = new Set(selectedStaff);
    if (selected) {
      newSelected.add(staffId);
    } else {
      newSelected.delete(staffId);
    }
    setSelectedStaff(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStaff.size === paginatedStaff.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(paginatedStaff.map(s => s.id)));
    }
  };

  const handleBulkAction = (action) => {
    if (onBulkAction && selectedStaff.size > 0) {
      onBulkAction(Array.from(selectedStaff), action);
      setSelectedStaff(new Set());
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
    setDepartmentFilter('');
    setCurrentPage(1);
  };

  return (
    <ListContainer className={className}>
      <ListHeader>
        <HeaderTop>
          <ListTitle>{title}</ListTitle>
          <ListActions>
            <ViewToggle>
              <ViewButton 
                $active={view === 'grid'} 
                onClick={() => setView('grid')}
              >
                Grid
              </ViewButton>
              <ViewButton 
                $active={view === 'list'} 
                onClick={() => setView('list')}
              >
                List
              </ViewButton>
              {!compact && (
                <ViewButton 
                  $active={view === 'compact'} 
                  onClick={() => setView('compact')}
                >
                  Compact
                </ViewButton>
              )}
            </ViewToggle>
            <ActionButton onClick={resetFilters}>
              Clear Filters
            </ActionButton>
          </ListActions>
        </HeaderTop>

        {showSearch && (
          <SearchAndFilters>
            <SearchInput
              type="text"
              placeholder="Search staff by name, email, phone, or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {showFilters && (
              <>
                <FilterSelect
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </FilterSelect>

                <FilterSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </FilterSelect>

                <FilterSelect
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </FilterSelect>
              </>
            )}
          </SearchAndFilters>
        )}
      </ListHeader>

      <ListBody>
        <ListControls>
          <ResultsInfo>
            {loading ? 'Loading...' : `${filteredStaff.length} staff members found`}
            {selectedStaff.size > 0 && ` (${selectedStaff.size} selected)`}
          </ResultsInfo>
          
          <SortSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="role">Sort by Role</option>
            <option value="department">Sort by Department</option>
            <option value="experience">Sort by Experience</option>
            <option value="status">Sort by Status</option>
          </SortSelect>
        </ListControls>

        {showBulkActions && selectedStaff.size > 0 && (
          <BulkActions $visible={selectedStaff.size > 0}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              {selectedStaff.size} selected
            </span>
            <BulkActionButton onClick={() => handleBulkAction('activate')}>
              Activate
            </BulkActionButton>
            <BulkActionButton onClick={() => handleBulkAction('deactivate')}>
              Deactivate
            </BulkActionButton>
            <BulkActionButton onClick={() => handleBulkAction('export')}>
              Export
            </BulkActionButton>
            <BulkActionButton 
              className="danger" 
              onClick={() => handleBulkAction('delete')}
            >
              Delete
            </BulkActionButton>
          </BulkActions>
        )}

        {loading && (
          <LoadingState>Loading staff members...</LoadingState>
        )}

        {!loading && filteredStaff.length === 0 && (
          <EmptyState>
            <EmptyIcon>👥</EmptyIcon>
            <EmptyTitle>No staff members found</EmptyTitle>
            <EmptyDescription>
              {staff.length === 0 
                ? "No staff members have been added yet." 
                : "Try adjusting your search terms or filters."
              }
            </EmptyDescription>
          </EmptyState>
        )}

        {!loading && paginatedStaff.length > 0 && (
          <StaffGrid $view={view}>
            {paginatedStaff.map((staffMember) => (
              <StaffCard
                key={staffMember.id}
                staff={staffMember}
                onClick={handleStaffSelect}
                onEdit={onStaffEdit}
                onViewSchedule={onViewSchedule}
                onManagePermissions={onManagePermissions}
                onActivate={onActivate}
                onDeactivate={onDeactivate}
                onDismiss={onDismiss}
                showRole={true}
                showStatus={true}
                showSpecializations={true}
                showSchedule={true}
              />
            ))}
          </StaffGrid>
        )}

        {!loading && totalPages > 1 && (
          <Pagination>
            <PaginationButton
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </PaginationButton>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <PaginationButton
                  key={page}
                  $active={currentPage === page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PaginationButton>
              );
            })}
            
            {totalPages > 5 && (
              <>
                <span style={{ color: '#64748b' }}>...</span>
                <PaginationButton
                  $active={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </PaginationButton>
              </>
            )}
            
            <PaginationButton
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </PaginationButton>
          </Pagination>
        )}
      </ListBody>
    </ListContainer>
  );
};

export default StaffList;
