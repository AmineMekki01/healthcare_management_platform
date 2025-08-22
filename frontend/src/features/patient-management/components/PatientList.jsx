import React, { useState } from 'react';
import styled from 'styled-components';
import {FaTh, FaList, FaPlus } from 'react-icons/fa';
import PatientCard from './PatientCard';
import { 
    formatPhoneNumber, 
    formatPatientName, 
    calculateAge, 
    formatMedicalDate,
    generatePatientStats,
    filterPatients 
} from '../utils/patientUtils';

const Container = styled.div`
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 24px;
`;

const HeaderTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const Title = styled.h2`
    margin: 0;
    font-size: 24px;
    font-weight: 600;
`;

const HeaderActions = styled.div`
    display: flex;
    gap: 12px;
`;

const ActionButton = styled.button`
    padding: 10px 20px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    gap: 8px;
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
    }
    
    &.primary {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
    }
`;

const SearchFilterContainer = styled.div`
    display: flex;
    gap: 16px;
    align-items: center;
`;

const SearchContainer = styled.div`
    flex: 1;
    position: relative;
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 16px;
    backdrop-filter: blur(10px);
    
    &::placeholder {
        color: rgba(255, 255, 255, 0.7);
    }
    
    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.15);
    }
`;

const FiltersContainer = styled.div`
    display: flex;
    gap: 12px;
`;

const FilterSelect = styled.select`
    padding: 8px 12px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    backdrop-filter: blur(10px);
    min-width: 120px;
    
    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
    }
    
    option {
        background: #1a202c;
        color: white;
    }
`;

const ViewToggle = styled.div`
    display: flex;
    gap: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 4px;
`;

const ViewButton = styled.button`
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: rgba(255, 255, 255, 0.15);
    }
`;

const Body = styled.div`
    padding: 24px;
`;

const StatsContainer = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 24px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;
`;

const StatItem = styled.div`
    text-align: center;
`;

const StatNumber = styled.div`
    font-size: 20px;
    font-weight: 700;
    color: #1a202c;
`;

const StatLabel = styled.div`
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const ListContainer = styled.div`
    display: ${props => props.$view === 'grid' ? 'grid' : 'flex'};
    ${props => props.$view === 'grid' ? 
        'grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));' : 
        'flex-direction: column;'
    }
    gap: 16px;
`;

const TableContainer = styled.div`
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
`;

const TableHeader = styled.thead`
    background: #f8fafc;
`;

const TableRow = styled.tr`
    border-bottom: 1px solid #e2e8f0;
    
    &:hover {
        background: #f8fafc;
    }
    
    &:last-child {
        border-bottom: none;
    }
`;

const TableHeaderCell = styled.th`
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: #1a202c;
    font-size: 14px;
`;

const TableCell = styled.td`
    padding: 12px 16px;
    color: #64748b;
    font-size: 14px;
    cursor: pointer;
`;

const PatientStatus = styled.span`
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    background: ${props => props.$isActive ? 
        'rgba(34, 197, 94, 0.1)' : 
        'rgba(239, 68, 68, 0.1)'
    };
    color: ${props => props.$isActive ? '#16a34a' : '#dc2626'};
    border: 1px solid ${props => props.$isActive ? 
        'rgba(34, 197, 94, 0.2)' : 
        'rgba(239, 68, 68, 0.2)'
    };
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

const PatientList = ({
    patients = [],
    loading = false,
    onPatientSelect,
    onPatientEdit,
    onAddPatient,
    showStats = true,
    showFilters = true,
    showSearch = true,
    title = "Patients",
    className
    }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        ageRange: '',
        gender: ''
    });
    const [view, setView] = useState('grid');

    const filteredPatients = filterPatients(patients, searchQuery, filters);
    const stats = generatePatientStats(filteredPatients);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
        ...prev,
        [filterName]: value
        }));
    };

    const handlePatientClick = (patient) => {
        onPatientSelect?.(patient);
    };

    const handlePatientEdit = (patient) => {
        onPatientEdit?.(patient);
    };

    const renderTableView = () => (
        <TableContainer>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Patient ID</TableHeaderCell>
                <TableHeaderCell>Contact</TableHeaderCell>
                <TableHeaderCell>Age</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Last Visit</TableHeaderCell>
            </TableRow>
            </TableHeader>
            <tbody>
            {filteredPatients.map((patient) => (
                <TableRow 
                key={patient.id || patient.patientId} 
                onClick={() => handlePatientClick(patient)}
                >
                <TableCell>
                    <strong>{formatPatientName(patient)}</strong>
                </TableCell>
                <TableCell>{patient.patientId || patient.id}</TableCell>
                <TableCell>
                    {patient.email}<br />
                    <small>{formatPhoneNumber(patient.phone)}</small>
                </TableCell>
                <TableCell>
                    {calculateAge(patient.dateOfBirth)} years
                    {patient.gender && <><br /><small>{patient.gender}</small></>}
                </TableCell>
                <TableCell>
                    <PatientStatus $isActive={patient.isActive}>
                    {patient.isActive ? 'Active' : 'Inactive'}
                    </PatientStatus>
                </TableCell>
                <TableCell>
                    {patient.lastVisit ? 
                    formatMedicalDate(patient.lastVisit) : 
                    'Never'
                    }
                </TableCell>
                </TableRow>
            ))}
            </tbody>
        </Table>
        </TableContainer>
    );

    const renderGridView = () => (
        <ListContainer $view="grid">
        {filteredPatients.map((patient) => (
            <PatientCard
            key={patient.id || patient.patientId}
            patient={patient}
            onView={handlePatientClick}
            onEdit={handlePatientEdit}
            />
        ))}
        </ListContainer>
    );

    if (loading) {
        return (
        <Container className={className}>
            <LoadingState>Loading patients...</LoadingState>
        </Container>
        );
    }

    return (
        <Container className={className}>
        <Header>
            <HeaderTop>
            <Title>{title}</Title>
            <HeaderActions>
                <ViewToggle>
                <ViewButton 
                    $active={view === 'grid'} 
                    onClick={() => setView('grid')}
                    title="Grid View"
                >
                    <FaTh />
                </ViewButton>
                <ViewButton 
                    $active={view === 'table'} 
                    onClick={() => setView('table')}
                    title="Table View"
                >
                    <FaList />
                </ViewButton>
                </ViewToggle>
                {onAddPatient && (
                <ActionButton className="primary" onClick={onAddPatient}>
                    <FaPlus />
                    Add Patient
                </ActionButton>
                )}
            </HeaderActions>
            </HeaderTop>

            <SearchFilterContainer>
            {showSearch && (
                <SearchContainer>
                <SearchInput
                    type="text"
                    placeholder="Search patients by name, email, phone, or ID..."
                    value={searchQuery}
                    onChange={handleSearch}
                />
                </SearchContainer>
            )}

            {showFilters && (
                <FiltersContainer>
                <FilterSelect
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </FilterSelect>

                <FilterSelect
                    value={filters.ageRange}
                    onChange={(e) => handleFilterChange('ageRange', e.target.value)}
                >
                    <option value="">All Ages</option>
                    <option value="child">Children (0-17)</option>
                    <option value="adult">Adults (18-64)</option>
                    <option value="senior">Seniors (65+)</option>
                </FilterSelect>

                <FilterSelect
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </FilterSelect>
                </FiltersContainer>
            )}
            </SearchFilterContainer>
        </Header>

        <Body>
            {showStats && (
            <StatsContainer>
                <StatItem>
                <StatNumber>{stats.total}</StatNumber>
                <StatLabel>Total</StatLabel>
                </StatItem>
                <StatItem>
                <StatNumber>{stats.active}</StatNumber>
                <StatLabel>Active</StatLabel>
                </StatItem>
                <StatItem>
                <StatNumber>{stats.inactive}</StatNumber>
                <StatLabel>Inactive</StatLabel>
                </StatItem>
                <StatItem>
                <StatNumber>{stats.newThisMonth}</StatNumber>
                <StatLabel>New This Month</StatLabel>
                </StatItem>
            </StatsContainer>
            )}

            {filteredPatients.length === 0 ? (
            <EmptyState>
                <EmptyIcon>👥</EmptyIcon>
                <EmptyTitle>
                {searchQuery || Object.values(filters).some(Boolean) ? 
                    'No patients found' : 
                    'No patients yet'
                }
                </EmptyTitle>
                <EmptyDescription>
                {searchQuery || Object.values(filters).some(Boolean) ? 
                    'Try adjusting your search or filters' : 
                    'Add your first patient to get started'
                }
                </EmptyDescription>
            </EmptyState>
            ) : (
            view === 'table' ? renderTableView() : renderGridView()
            )}
        </Body>
        </Container>
    );
};

export default PatientList;
