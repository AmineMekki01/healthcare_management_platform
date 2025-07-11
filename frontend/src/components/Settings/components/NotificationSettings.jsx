import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { StatusMessage } from './CommonComponents';

const NotificationContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
`;

const NotificationTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const NotificationDescription = styled.p`
  color: #7f8c8d;
  margin-bottom: 24px;
  line-height: 1.6;
`;

const NotificationGroup = styled.div`
  margin-bottom: 32px;
`;

const GroupTitle = styled.h4`
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
`;

const NotificationItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }
`;

const NotificationDetails = styled.div`
  flex: 1;
`;

const NotificationLabel = styled.div`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const NotificationSubtext = styled.div`
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.4;
`;

const ToggleSwitch = styled.div`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 32px;
  margin-left: 16px;
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.checked ? '#6DC8B7' : '#ccc'};
  transition: 0.4s;
  border-radius: 32px;
  
  &:before {
    position: absolute;
    content: "";
    height: 24px;
    width: 24px;
    left: ${props => props.checked ? '32px' : '4px'};
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const SaveButton = styled.button`
  background: linear-gradient(45deg, #6DC8B7, #4CAF50);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(109, 200, 183, 0.3);
  }
  
  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
    transform: none;
  }
`;

const NotificationIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
    <path d="M12,2A2,2 0 0,1 14,4V5.5A6.5,6.5 0 0,1 20.5,12A6.5,6.5 0 0,1 14,18.5V20A2,2 0 0,1 12,22A2,2 0 0,1 10,20V18.5A6.5,6.5 0 0,1 3.5,12A6.5,6.5 0 0,1 10,5.5V4A2,2 0 0,1 12,2M12,4A1,1 0 0,0 11,5V6A1,1 0 0,0 12,7A1,1 0 0,0 13,6V5A1,1 0 0,0 12,4M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
  </svg>
);

export default function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    // Email notifications
    appointmentReminders: true,
    newMessages: true,
    followUpdates: false,
    weeklyDigest: true,
    
    // Push notifications
    pushAppointments: true,
    pushMessages: true,
    pushFollowUpdates: false,
    pushMedicalAlerts: true,
    
    // SMS notifications
    smsAppointments: false,
    smsEmergencyAlerts: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load notification settings
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      // Replace with actual API call
      // const response = await axios.get('/api/v1/user/notification-settings');
      // setNotifications(response.data);
    } catch (error) {
      setError('Failed to load notification settings');
    }
  };

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Replace with actual API call
      // await axios.put('/api/v1/user/notification-settings', notifications);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const notificationGroups = [
    {
      title: 'Email Notifications',
      items: [
        {
          key: 'appointmentReminders',
          label: 'Appointment Reminders',
          description: 'Get email reminders 24 hours before your appointments'
        },
        {
          key: 'newMessages',
          label: 'New Messages',
          description: 'Receive emails when doctors send you messages'
        },
        {
          key: 'followUpdates',
          label: 'Doctor Updates',
          description: 'Get notified when doctors you follow post updates'
        },
        {
          key: 'weeklyDigest',
          label: 'Weekly Digest',
          description: 'Receive a summary of your health activities weekly'
        }
      ]
    },
    {
      title: 'Push Notifications',
      items: [
        {
          key: 'pushAppointments',
          label: 'Appointment Alerts',
          description: 'Push notifications for upcoming appointments'
        },
        {
          key: 'pushMessages',
          label: 'Message Alerts',
          description: 'Instant notifications for new messages'
        },
        {
          key: 'pushFollowUpdates',
          label: 'Follow Updates',
          description: 'Notifications when followed doctors post updates'
        },
        {
          key: 'pushMedicalAlerts',
          label: 'Medical Alerts',
          description: 'Important health-related notifications'
        }
      ]
    },
    {
      title: 'SMS Notifications',
      items: [
        {
          key: 'smsAppointments',
          label: 'Appointment SMS',
          description: 'Text message reminders for appointments'
        },
        {
          key: 'smsEmergencyAlerts',
          label: 'Emergency Alerts',
          description: 'Critical health alerts via SMS'
        }
      ]
    }
  ];

  return (
    <NotificationContainer>
      <NotificationHeader>
        <NotificationIcon />
        <NotificationTitle>Notification Settings</NotificationTitle>
      </NotificationHeader>
      
      <NotificationDescription>
        Customize how you receive notifications to stay informed about your healthcare activities.
      </NotificationDescription>

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}
      
      {success && (
        <StatusMessage type="success">
          Notification settings saved successfully!
        </StatusMessage>
      )}

      {notificationGroups.map(group => (
        <NotificationGroup key={group.title}>
          <GroupTitle>{group.title}</GroupTitle>
          {group.items.map(item => (
            <NotificationItem key={item.key}>
              <NotificationDetails>
                <NotificationLabel>{item.label}</NotificationLabel>
                <NotificationSubtext>{item.description}</NotificationSubtext>
              </NotificationDetails>
              <ToggleSwitch>
                <ToggleInput
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={() => handleToggle(item.key)}
                />
                <ToggleSlider checked={notifications[item.key]} />
              </ToggleSwitch>
            </NotificationItem>
          ))}
        </NotificationGroup>
      ))}

      <SaveButton onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Settings'}
      </SaveButton>
    </NotificationContainer>
  );
}
