import React, { useState, useEffect , useContext} from 'react';
import axios from 'axios';

import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Container,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
  } from '@mui/material';
  
  import {
    Instagram as InstagramIcon,
    Twitter as TwitterIcon,
    Facebook as FacebookIcon,
    Language as GlobeIcon,
  } from '@mui/icons-material';
  

import { useParams } from 'react-router-dom';
import BookAppointment from '../Patient/BookAppointment'; 
import { AuthContext } from './../../Auth/AuthContext';  


export default function DoctorProfile() {

  const { doctorId } = useParams();
  const [doctorInfo, setDoctorInfo] = useState([]);
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState([]);
  const { userType } = useContext(AuthContext);

  useEffect(() => {
    axios.get(`http://localhost:3001/api/v1/doctors/${doctorId}`)
        .then(response => {
            setDoctorInfo(response.data);
            setLoading(false);
            console.log("doctor data : ", response.data)
        })
        
        .catch(error => {
          console.error(error);
          setLoading(false);  
          setError('An error occurred while fetching the doctor information.');
      });
      
}, [doctorId]);


  return (
    <section style={{ backgroundColor: '#eee', padding: "20px" , height:"100vh"}}>
      {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        {doctorInfo && (
      <Container className="py-5" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>


        <Grid container spacing={3} style={{ justifyContent: 'center' }}>
          <Grid item lg={4}>
            <Card className="mb-2">
              <CardContent className="text-center">
                <CardMedia
                  component="img"
                  image={`http://localhost:3001/${doctorInfo.ProfilePictureUrl}`}
                  title="avatar"
                  className="rounded-circle"
                  style={{ width: '150px', margin: 'auto' }}
                />
               
                    <Typography className="text-muted mb-1" variant="subtitle1">
                      Name : {doctorInfo.FirstName} {doctorInfo.LastName}
                    </Typography>
                    <Typography className="text-muted mb-1" variant="subtitle1">
                      Specialty : {doctorInfo.Specialty}
                    </Typography>
                    <Typography className="text-muted mb-1" variant="subtitle1">
                      Rating : {doctorInfo.RatingScore} ({doctorInfo.RatingCount})
                    </Typography>

                    <div className="d-flex justify-content-center mb-2">
                      <Button variant="contained">Follow</Button>
                      <Button variant="outlined" className="ms-1">Message</Button>
                    </div>
                 
              </CardContent>
            </Card>

            <Card className="mb-4 mb-lg-0">
              <CardContent className="p-0">
                <List>
                  {[
                    { icon: <GlobeIcon color="secondary" />, text: 'https://mdbootstrap.com', color: 'text-warning' },
                    { icon: <TwitterIcon />, text: '@mdbootstrap', color: '#55acee' },
                    { icon: <InstagramIcon />, text: 'mdbootstrap', color: '#ac2bac' },
                    { icon: <FacebookIcon />, text: 'mdbootstrap', color: '#3b5998' },
                  ].map((item, index) => (
                    <ListItem key={index} className="d-flex justify-content-between align-items-center p-3">
                      <ListItemIcon style={{ color: item.color }}>{item.icon}</ListItemIcon>
                      <ListItemText>
                        <Typography>{item.text}</Typography>
                      </ListItemText>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          

          <Grid item lg={8}>
                
                <Card className='mb-2'>

                  <CardContent>
                              <Grid container spacing={3}>
                                  <Grid item sm={3}>
                                      <Typography>Full Name</Typography>
                                  </Grid>
                                  <Grid item sm={9}>
                                      <Typography className="text-muted">
                                          {doctorInfo.FirstName} {doctorInfo.LastName}
                                      </Typography>
                                  </Grid>
                              </Grid>
                              <Grid container spacing={3}>
                                  <Grid item sm={3}>
                                      <Typography>Email</Typography>
                                  </Grid>
                                  <Grid item sm={9}>
                                      <Typography className="text-muted">
                                          {doctorInfo.Email}
                                      </Typography>
                                  </Grid>
                              </Grid>
                              <Grid container spacing={3}>
                                  <Grid item sm={3}>
                                      <Typography>Phone</Typography>
                                  </Grid>
                                  <Grid item sm={9}>
                                      <Typography className="text-muted">
                                          {doctorInfo.PhoneNumber}
                                      </Typography>
                                  </Grid>
                              </Grid>
                             
                              <Grid container spacing={3}>
                                  <Grid item sm={3}>
                                      <Typography>Address</Typography>
                                  </Grid>
                                  <Grid item sm={9}>
                                      <Typography className="text-muted">
                                          {doctorInfo.Location}
                                      </Typography>
                                  </Grid>
                              </Grid>
                  
                  </CardContent>
                </Card>

                <Card className="mb-2">
                  <CardContent>
                    <Typography variant="h5" className="mb-3">Rates & Refunds : </Typography>
                    <Grid container spacing={3}>
                        <Grid item sm={6}>
                            <Typography>RAMED : </Typography>
                        </Grid>
                        <Grid item sm={6}>
                            <Typography className="text-muted"> YES
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid container spacing={3}>
                        <Grid item sm={6}>
                            <Typography>Accepted Insurance Plans : </Typography>
                        </Grid>
                        <Grid item sm={6}>
                            <Typography className="text-muted"> X, Y, Z
                            </Typography>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item sm={6}>
                            <Typography>Session Rate : </Typography>
                        </Grid>
                        <Grid item sm={6}>
                            <Typography className="text-muted"> 300 DH
                            </Typography>
                        </Grid>
                    </Grid>
            
                  </CardContent>
                </Card>

                <Card className='mb-2'>
                  <CardContent>
                    <Typography variant="h5" className="mb-3">Get to know me : </Typography>
                    <Typography className="text-muted mb-3">
                      {/* {doctorInfo.DoctorBio} */}
                      Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.
                    </Typography>
                  </CardContent>
                </Card>

                
                <Card>
                    <CardContent>
                        <Typography>
                            Book Appointment
                        </Typography>
                        <Grid spacing={3} className='mt-2'>

                          {userType === 'patient' && <BookAppointment show={true} />}
                          {userType === 'doctor' && <BookAppointment show={false} />}
                        </Grid>
                    </CardContent>
                </Card>

            </Grid>
        </Grid>
      </Container>
      )}
    </section>
  );
}
