import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';

import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Container,
    Grid,
  } from '@mui/material';

import { useParams } from 'react-router-dom';
import { AuthContext } from './../../Auth/AuthContext';  

export default function PatientProfile() {

  const { patientId } = useParams();
  const [patientInfo, setPatientInfo] = useState([]);
  const [loading, setLoading] = useState([]);
  const [error, setError] = useState([]);
  const { userProfilePhotoUrl } = useContext(AuthContext);


  useEffect(() => {
    axios.get(`http://localhost:3001/api/v1/patients/${patientId}`)
        .then(response => {
            setPatientInfo(response.data);
            setLoading(false);
        })
        .catch(error => {
          console.error(error);
          setLoading(false);  
          setError('An error occurred while fetching the patient information.');
      });
}, [patientId]);


  return (
    <section style={{ backgroundColor: '#eee', padding:"20px", height:"100vh"}}>
      {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        {patientInfo && (
      <Container className="py-5" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>


        <Grid container spacing={3} style={{ justifyContent: 'center' }}>
          <Grid item lg={4}>
            <Card className="mb-2">
              <CardContent className="text-center">
                <CardMedia
                  component="img"
                  image={`http://localhost:3001/${userProfilePhotoUrl}`}
                  title="avatar"
                  className="rounded-circle"
                  style={{ width: '150px', margin: 'auto' }}
                />
               
                    <Typography className="text-muted mb-1" variant="subtitle1">
                      Name : {patientInfo.FirstName} {patientInfo.LastName}
                    </Typography>
                    <Typography className="text-muted mb-1" variant="subtitle1">
                      BirthDay : {patientInfo.BirthDate}
                    </Typography>
                    
                    

                    <div className="d-flex justify-content-center mb-2">
                      <Button variant="contained">Follow</Button>
                      <Button variant="outlined" className="ms-1">Message</Button>
                    </div>
                 
              </CardContent>
            </Card>

          
          </Grid>
          <Grid item lg={8}>
                <Card className="mb-2">
                  <CardContent>
                              <Grid container spacing={3}>
                                  <Grid item sm={3}>
                                      <Typography>Full Name</Typography>
                                  </Grid>
                                  <Grid item sm={9}>
                                      <Typography className="text-muted">
                                          {patientInfo.FirstName} {patientInfo.LastName}
                                      </Typography>
                                  </Grid>
                              </Grid>
                              <Grid container spacing={3}>
                                  <Grid item sm={3}>
                                      <Typography>Email</Typography>
                                  </Grid>
                                  <Grid item sm={9}>
                                      <Typography className="text-muted">
                                          {patientInfo.Email}
                                      </Typography>
                                  </Grid>
                              </Grid>
                              <Grid container spacing={3}>
                                  <Grid item sm={3}>
                                      <Typography>Phone</Typography>
                                  </Grid>
                                  <Grid item sm={9}>
                                      <Typography className="text-muted">
                                          {patientInfo.PhoneNumber}
                                      </Typography>
                                  </Grid>
                              </Grid>
                             
                              <Grid container spacing={3}>
                                  <Grid item sm={3}>
                                      <Typography>Address</Typography>
                                  </Grid>
                                  <Grid item sm={9}>
                                      <Typography className="text-muted">
                                          {patientInfo.location}  
                                      </Typography>
                                  </Grid>
                              </Grid>
                  </CardContent>
                </Card>
                
                <Card className='mb-2'>
                  <CardContent>
                    <Typography variant="h5" className="mb-3">Get to know me : </Typography>
                    <Typography className="text-muted mb-3">
                      {patientInfo.PatientBio}
                    </Typography>
                  </CardContent>
                </Card>
            </Grid>
        </Grid>
      </Container>
      )}
    </section>
  );
}
