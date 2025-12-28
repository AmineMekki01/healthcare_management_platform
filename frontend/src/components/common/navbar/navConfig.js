import React from 'react';
import {
  Home as HomeIcon,
  Feed as FeedIcon,
  Person as PersonIcon,
  PersonSearch as DoctorSearchIcon,
  FolderShared as DocumentsIcon,
  Textsms as MessagesIcon,
  CalendarMonth as CalendarIcon,
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  ManageAccounts as ManageIcon,
  LocalHospital as HospitalIcon,
  MedicalServices as MedicalIcon,
  Assignment as ReportsIcon,
  Groups as StaffIcon,
  Create as CreateIcon,
  Newspaper as NewsIcon,
  SmartToy as ChatBotIcon,
  Business as TalentPoolIcon,
  SupervisorAccount as StaffManagementIcon,
  AccountCircle as ProfileIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

export const getProfileHrefForMode = (mode, userId) => {
  if (mode === 'doctor') {
    return `/doctor-profile/${userId}`;
  }
  if (mode === 'receptionist') {
    return `/receptionist-profile/${userId}`;
  }
  return `/patient-profile/${userId}`;
};

export const getSettingsHref = (userId) => `/settings/${userId}`;

export const buildNavConfig = ({
  tNav,
  userId,
  userType,
  activeMode,
  isReceptionistAssigned,
  logout,
}) => {
  const baseDrawerItems = [
    {
      label: tNav('home'),
      href: '/',
      icon: <HomeIcon />,
      roles: ['doctor', 'patient', 'receptionist'],
    },
    {
      label: tNav('findDoctors'),
      href: '/SearchBar',
      icon: <DoctorSearchIcon />,
      roles: ['doctor', 'patient', 'receptionist'],
    },
    {
      label: tNav('myDocuments'),
      href: '/records',
      icon: <DocumentsIcon />,
      roles: ['doctor', 'patient', 'receptionist'],
    },
    {
      label: tNav('messages'),
      href: '/Messages',
      icon: <MessagesIcon />,
      roles: ['doctor', 'patient', 'receptionist'],
    },
    {
      label: tNav('healthFeed'),
      href: '/feed',
      icon: <FeedIcon />,
      roles: ['patient', 'receptionist'],
    },
  ];

  const patientDrawerItems = [
    {
      label: tNav('myAppointments'),
      href: '/appointments',
      icon: <CalendarIcon />,
      roles: ['patient'],
    },
  ];

  const receptionistDrawerItems = [
    ...(isReceptionistAssigned
      ? [
          {
            label: tNav('receptionistDashboard'),
            href: '/receptionist-dashboard',
            icon: <DashboardIcon />,
            roles: ['receptionist'],
          },
          {
            label: tNav('patientManagement'),
            icon: <ManageIcon />,
            hasSubItems: true,
            roles: ['receptionist'],
            subItems: [
              {
                label: tNav('patientSearch'),
                href: '/receptionist/patients',
                icon: <DoctorSearchIcon />,
                roles: ['receptionist'],
              },
              {
                label: tNav('createPatient'),
                href: '/receptionist/create-patient',
                icon: <PersonIcon />,
                roles: ['receptionist'],
              },
              {
                label: tNav('scheduleAppointment'),
                href: '/receptionist/create-appointment',
                icon: <CalendarIcon />,
                roles: ['receptionist'],
              },
            ],
          },
        ]
      : []),
    {
      label: tNav('jobOffers'),
      href: '/receptionist/job-offers',
      icon: <WorkIcon />,
      roles: ['receptionist'],
    },
  ];

  const doctorDrawerItems = [
    {
      label: tNav('medicalTools'),
      icon: <MedicalIcon />,
      hasSubItems: true,
      roles: ['doctor'],
      subItems: [
        {
          label: tNav('aiAssistant'),
          href: '/ChatBot',
          icon: <ChatBotIcon />,
          roles: ['doctor'],
        },
      ],
    },
    {
      label: tNav('practiceManagement'),
      icon: <HospitalIcon />,
      hasSubItems: true,
      roles: ['doctor'],
      subItems: [
        {
          label: tNav('myAppointments'),
          href: '/appointments',
          icon: <CalendarIcon />,
          roles: ['doctor'],
        },
        {
          label: tNav('medicalReports'),
          href: `/medical-report/${userId}`,
          icon: <ReportsIcon />,
          roles: ['doctor'],
        },
      ],
    },
    {
      label: tNav('staffManagement'),
      icon: <StaffIcon />,
      hasSubItems: true,
      roles: ['doctor'],
      subItems: [
        {
          label: tNav('talentPool'),
          href: '/receptionist-talent-pool',
          icon: <TalentPoolIcon />,
          roles: ['doctor'],
        },
        {
          label: tNav('staffManagement'),
          href: '/staff-management',
          icon: <StaffManagementIcon />,
          roles: ['doctor'],
        },
        {
          label: tNav('receptionistHistory'),
          href: '/staff-management/history',
          icon: <ReportsIcon />,
          roles: ['doctor'],
        },
      ],
    },
    {
      label: tNav('contentManagement'),
      icon: <CreateIcon />,
      hasSubItems: true,
      roles: ['doctor'],
      subItems: [
        {
          label: tNav('createPost'),
          href: '/create-post',
          icon: <CreateIcon />,
          roles: ['doctor'],
        },
        {
          label: tNav('myPosts'),
          href: '/doctor-posts',
          icon: <NewsIcon />,
          roles: ['doctor'],
        },
        {
          label: tNav('healthFeed'),
          href: '/feed',
          icon: <FeedIcon />,
          roles: ['doctor'],
        },
      ],
    },
  ];

  const modeDrawerItems =
    activeMode === 'doctor'
      ? doctorDrawerItems
      : activeMode === 'receptionist'
        ? receptionistDrawerItems
        : patientDrawerItems;

  const drawerItems = [...baseDrawerItems, ...modeDrawerItems];

  const bottomTabsBase = [
    {
      label: tNav('home'),
      value: '/',
      icon: <HomeIcon />,
    },
    {
      label: tNav('findDoctors'),
      value: '/SearchBar',
      icon: <DoctorSearchIcon />,
    },
    {
      label: tNav('messages'),
      value: '/Messages',
      icon: <MessagesIcon />,
    },
  ];

  const bottomTabsModeSpecific =
    activeMode === 'receptionist'
      ? [
          isReceptionistAssigned
            ? {
                label: tNav('receptionistDashboard'),
                value: '/receptionist-dashboard',
                icon: <DashboardIcon />,
              }
            : {
                label: tNav('jobOffers'),
                value: '/receptionist/job-offers',
                icon: <WorkIcon />,
              },
        ]
      : [
          {
            label: activeMode === 'doctor' ? tNav('schedule') : tNav('appointments'),
            value: '/appointments',
            icon: <CalendarIcon />,
          },
        ];

  const bottomTabs = [...bottomTabsBase, ...bottomTabsModeSpecific];

  const profileHref = getProfileHrefForMode(activeMode || userType, userId);

  const bottomMenuItems = [
    ...(activeMode === 'doctor'
      ? [
          {
            label: tNav('aiAssistant'),
            href: '/ChatBot',
            icon: <ChatBotIcon />,
          },
          {
            label: tNav('medicalReports'),
            href: `/medical-report/${userId}`,
            icon: <ReportsIcon />,
          },
          {
            label: tNav('talentPool'),
            href: '/receptionist-talent-pool',
            icon: <TalentPoolIcon />,
          },
          {
            label: tNav('staffManagement'),
            href: '/staff-management',
            icon: <StaffManagementIcon />,
          },
          {
            label: tNav('receptionistHistory'),
            href: '/staff-management/history',
            icon: <ReportsIcon />,
          },
          {
            label: tNav('createPost'),
            href: '/create-post',
            icon: <CreateIcon />,
          },
          {
            label: tNav('myPosts'),
            href: '/doctor-posts',
            icon: <NewsIcon />,
          },
        ]
      : []),

    ...(activeMode === 'receptionist'
      ? [
          {
            label: tNav('jobOffers'),
            href: '/receptionist/job-offers',
            icon: <WorkIcon />,
          },
          ...(isReceptionistAssigned
            ? [
                {
                  label: tNav('patientSearch'),
                  href: '/receptionist/patients',
                  icon: <DoctorSearchIcon />,
                },
                {
                  label: tNav('createPatient'),
                  href: '/receptionist/create-patient',
                  icon: <PersonIcon />,
                },
                {
                  label: tNav('scheduleAppointment'),
                  href: '/receptionist/create-appointment',
                  icon: <CalendarIcon />,
                },
              ]
            : []),
        ]
      : []),

    {
      label: tNav('messages'),
      href: '/Messages',
      icon: <MessagesIcon />,
    },
    {
      label: tNav('healthFeed'),
      href: '/feed',
      icon: <FeedIcon />,
    },
    {
      label: tNav('myDocuments'),
      href: '/records',
      icon: <DocumentsIcon />,
    },
    {
      label: tNav('profile'),
      href: profileHref,
      icon: <ProfileIcon />,
    },
    {
      label: tNav('settings'),
      href: getSettingsHref(userId),
      icon: <SettingsIcon />,
    },
    {
      label: tNav('logout'),
      action: logout,
      icon: <LogoutIcon />,
    },
  ].filter((item) => {
    if (!item.action) {
      return true;
    }

    return typeof item.action === 'function';
  });

  return {
    drawerItems,
    bottomTabs,
    bottomMenuItems,
  };
};
