import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import StaffCard from './StaffCard';


const ListContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 
              0 4px 16px rgba(99, 102, 241, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.8);
`;

const ListHeader = styled.div`
  padding: 28px 32px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.5) 100%);
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ListTitle = styled.h2`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  letter-spacing: -0.01em;
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
  padding: 8px 16px;
  border: none;
  background: ${props => props.$active ? '#6366f1' : 'white'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active ? '#4f46e5' : '#f8fafc'};
    color: ${props => props.$active ? 'white' : '#6366f1'};
  }
`;

const ActionButton = styled.button`
  padding: 10px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    border-color: #6366f1;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.05);
    transform: translateY(-1px);
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
  min-width: 240px;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
  
  &:hover {
    border-color: #cbd5e1;
  }
  
  &::placeholder {
    color: #94a3b8;
  }
`;

const FilterSelect = styled.select`
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
  
  &:hover {
    border-color: #cbd5e1;
  }
`;

const ListBody = styled.div`
  padding: 28px 32px;
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
  padding: 8px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #1e293b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  &:hover {
    border-color: #cbd5e1;
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
  padding: 10px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: ${props => props.$active ? '#6366f1' : 'white'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    border-color: #6366f1;
    background: ${props => props.$active ? '#4f46e5' : '#f8fafc'};
    color: ${props => props.$active ? 'white' : '#6366f1'};
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const PaginationInfo = styled.span`
  color: #64748b;
  font-size: 14px;
  margin: 0 12px;
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
  onStaffSelect,
  onStaffEdit,
  onViewSchedule,
  onDismiss,
  onBulkAction,
  loading = false,
  showSearch = true,
  showFilters = true,
  showBulkActions = true,
  showPagination = true,
  compact = false,
  title,
  className 
}) => {
  const { t } = useTranslation('staff');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [view, setView] = useState(compact ? 'compact' : 'grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStaffSet, setSelectedStaffSet] = useState(new Set());
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
        )
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(s => s.role === roleFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'role':
          return (a.role || '').localeCompare(b.role || '');
        case 'experience':
          return (b.experience || 0) - (a.experience || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [staff, searchQuery, roleFilter, sortBy]);

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueRoles = [...new Set(staff.map(s => s.role).filter(Boolean))];

  const handleStaffSelect = (staffMember) => {
    if (onStaffSelect) {
      onStaffSelect(staffMember);
    }
  };


  const handleBulkAction = (action) => {
    if (onBulkAction && selectedStaffSet.size > 0) {
      onBulkAction(Array.from(selectedStaffSet), action);
      setSelectedStaffSet(new Set());
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setCurrentPage(1);
  };

  return (
    <ListContainer className={className}>
      <ListHeader>
        <HeaderTop>
          <ListTitle>{title || t('list.title')}</ListTitle>
          <ListActions>
            <ViewToggle>
              <ViewButton 
                $active={view === 'grid'} 
                onClick={() => setView('grid')}
              >
                {t('list.views.grid')}
              </ViewButton>
              <ViewButton 
                $active={view === 'list'} 
                onClick={() => setView('list')}
              >
                {t('list.views.list')}
              </ViewButton>
              {!compact && (
                <ViewButton 
                  $active={view === 'compact'} 
                  onClick={() => setView('compact')}
                >
                  {t('list.views.compact')}
                </ViewButton>
              )}
            </ViewToggle>
            <ActionButton onClick={resetFilters}>
              {t('actions.clearFilters')}
            </ActionButton>
          </ListActions>
        </HeaderTop>

        {showSearch && (
          <SearchAndFilters>
            <SearchInput
              type="text"
              placeholder={t('list.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {showFilters && (
              <>
                <FilterSelect
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">{t('list.filters.allRoles')}</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>
                      {t(`roles.${role}`, role.charAt(0).toUpperCase() + role.slice(1))}
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
            {loading ? t('list.loading') : t('list.staffMembersFound', { count: filteredStaff.length })}
            {selectedStaffSet.size > 0 && ` (${t('list.selected', { count: selectedStaffSet.size })})`}
          </ResultsInfo>
          
          <SortSelect
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">{t('list.sort.name')}</option>
            <option value="role">{t('list.sort.role')}</option>
            <option value="experience">{t('list.sort.experience')}</option>
          </SortSelect>
        </ListControls>

        {showBulkActions && selectedStaffSet.size > 0 && (
          <BulkActions $visible={selectedStaffSet.size > 0}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              {t('list.selected', { count: selectedStaffSet.size })}
            </span>
            <BulkActionButton onClick={() => handleBulkAction('export')}>
              {t('list.bulkActions.export')}
            </BulkActionButton>
            <BulkActionButton 
              className="danger" 
              onClick={() => handleBulkAction('delete')}
            >
              {t('list.bulkActions.delete')}
            </BulkActionButton>
          </BulkActions>
        )}

        {loading && (
          <LoadingState>{t('list.loading')}</LoadingState>
        )}

        {!loading && filteredStaff.length === 0 && (
          <EmptyState>
            <EmptyIcon>👥</EmptyIcon>
            <EmptyTitle>{t('list.noStaffFound')}</EmptyTitle>
            <EmptyDescription>
              {staff.length === 0 
                ? t('list.noStaffAdded')
                : t('list.adjustFilters')
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
                onClick={() => onStaffSelect && onStaffSelect(staffMember)}
                onEdit={onStaffEdit}
                onViewSchedule={onViewSchedule}
                onDismiss={onDismiss}
                showRole={true}
                showSchedule={true}
              />
            ))}
          </StaffGrid>
        )}

        {showPagination && totalPages > 1 && (
          <Pagination>
            <PaginationButton 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              {t('list.pagination.previous')}
            </PaginationButton>
            
            <PaginationInfo>
              {t('list.pagination.pageInfo', { current: currentPage, total: totalPages })}
            </PaginationInfo>
            
            <PaginationButton 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              {t('list.pagination.next')}
            </PaginationButton>
          </Pagination>
        )}
      </ListBody>
    </ListContainer>
  );
};

export default StaffList;
