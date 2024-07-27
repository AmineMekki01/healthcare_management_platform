

import React from 'react'
import { Container , LeftSection , RightSectionDetails , Title , MainTitle  , Timing , TimingTitle , Span , Cols , Date , ButtonDate , SelectedButton , NextButton , Flex , MainTitleH3 , Text } from '../../common/CalenderStyles/Calendar.styles'
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideocamIcon from '@mui/icons-material/Videocam';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PublicIcon from '@mui/icons-material/Public';
import TextField from '@mui/material/TextField';
import { SubButton } from '../../common/CalenderStyles/CalendarDetails.styles';
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';


export default function CalendarDetails() {
  return (
    <>
        <Container>
            <LeftSection>
                <ArrowCircleLeftIcon  style={{ color: '#2196f3', fontSize: 42 , cursor : 'pointer' }}/>
                <Title>Anne-Laure Kupferberg</Title>
                <MainTitle>HR Interview (on Google Meet)</MainTitle>
                <Timing><AccessTimeIcon />1 hr </Timing>
                <TimingTitle><VideocamIcon /><Span>Web Conferencing details provided upon confirmation</Span></TimingTitle>
                <Title>Former Time</Title>
                <TimingTitle><CalendarTodayIcon /><Span>15:00 - 16:00,Friday, September 15, 2023</Span></TimingTitle>
                <TimingTitle><PublicIcon /><Span>Central European Time</Span></TimingTitle>
            </LeftSection>
            <RightSectionDetails>
                <MainTitleH3>Enter Details</MainTitleH3>
                <Text>Please share anything that will help prepare for our meeting</Text>
                <TextField id="outlined-basic" label="Name" variant="outlined" style={{ marginBottom: '15px'}} sx={{ width: '80%' }} />
                <TextField id="outlined-basic" label="Email" variant="outlined" style={{ marginBottom: '15px'}} sx={{ width: '80%' }} />
                <TextField

                    id="outlined-multiline-static"
                    // label="Multiline"
                    multiline
                    rows={5}
                    defaultValue=""
                    sx={{ width: '80%' }}
                />
                <SubButton>Create Event</SubButton>
            </RightSectionDetails>
        </Container>
    </>
  )
}