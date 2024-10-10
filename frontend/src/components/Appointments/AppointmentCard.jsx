import * as React from 'react';
import { createEvent } from 'ics';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Line } from '../common/CalenderStyles/Summit.styles';

import { Flexi } from '../common/CalenderStyles/Calendar.styles';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';


const bull = (
  <Box
    component="span"
    sx={{ display: 'inline-block', mx: '2px', transform: 'scale(0.8)' }}
  >
    •
  </Box>
);
export default function CardCom({duration, appointment_start, appointment_finish, doctor_name, doctor_specialty, userName, userAge, userType, doctorId}) {
  const prepareDataToShare = () => {
    console.log("prepareDataToShare : problem is after here ")
    const data = `
      Duration: ${duration} Minutes
      Day: ${appointment_start.split("T")[0]}
      TimeSlot: From ${appointment_start.split("T")[1]} to ${appointment_finish.split("T")[1]}
      Doctor Name: ${doctor_name}
      Doctor Specialty: ${doctor_specialty}
    `;
    console.log("prepareDataToShare : problem is before here ")
    console.log("data:", data);
    return data;
  }

  const createICSContent = ({start, end, title, description}) => {
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d{3}/g, '');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  };

  const createICSFile = () => {
    const start = new Date(appointment_start);
    const end = new Date(appointment_finish);

    const icsContent = createICSContent({
      start,
      end,
      title: `Appointment with ${doctor_name}`,
      description: prepareDataToShare()
    });

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `appointment_with_${doctor_name}.ics`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const shareData = () => {
    const dataToShare = prepareDataToShare();

    if (navigator.share) {
      navigator.share({
        title: `Appointment with ${doctor_name}`,
        text: dataToShare,
      })
      .then(() => {
        console.log('Thanks for sharing!');
      })
      .catch((error) => {
        console.log('Something went wrong, couldn\'t share', error);
      });
    } else {
      navigator.clipboard.writeText(dataToShare).then(() => {
        console.log('Data copied to clipboard');
      }).catch((err) => {
        console.log('Could not copy text: ', err);
      });
    }
  }

  const navigate = useNavigate();
  const goToDoctorProfile = () => {
    navigate(`/DoctorProfile/${doctorId}`);
  };
  return (
    <Card sx={{ minWidth: 200 , margin:"20px 10px" , boxShadow: '0px 0px 10px 5px rgba(128, 128, 128, 0.3)'}}>
      <CardContent>
        <Typography variant="h6" component="div">
          {duration} Minute  
        </Typography>
        <Typography sx={{ mb: 1.5 }} variant="subtitle1" color="text.secondary" >
          - Day :  <span className='font-bold'>{appointment_start.split("T")[0]}</span>

        </Typography>
        <Typography sx={{ mb: 1.5 }} variant="subtitle1" color="text.secondary" >
          - TimeSlot :  From : <span className='font-bold'>{appointment_start.split("T")[1]}</span>
  
          <br/>
          to <span className='font-bold'>{appointment_finish.split("T")[1]}</span> 
        </Typography>
        {userType === 'doctor' ? (
          <React.Fragment>
            <Typography sx={{ mb: 1.5 }} variant="subtitle1" color="text.secondary" >
              - Patient Name : {userName}
            </Typography>
            <Typography sx={{ mb: 1.5 }} variant="subtitle1" color="text.secondary" >
              - Patient Age : {userAge}
            </Typography>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Typography sx={{ mb: 1.5 }} variant="subtitle1" color="text.secondary" >
              - Doctor Name : {doctor_name}
            </Typography>
            <Typography sx={{ mb: 1.5 }} variant="subtitle1" color="text.secondary" >
              - Doctor Specialty : {doctor_specialty}
            </Typography>
          </React.Fragment>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" onClick={goToDoctorProfile}>View Doctor Profile</Button>
      </CardActions>
      <Line />
      <Flexi>
        <Button variant="contained" startIcon={<DownloadIcon />} onClick={createICSFile}>
         ICS
      </Button>
        <Button variant="contained" startIcon={<ShareIcon />} onClick={shareData}>
          Share
        </Button>
      </Flexi>
    </Card>
  )
}