import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Container,
  Paper,
  Box,
  IconButton,
} from "@mui/material";
import {
  Search as SearchIcon,
  Person as PersonIcon,
  LocalHospital as LocalHospitalIcon,
  Event as EventIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import axios from "./../components/axiosConfig";

export default function DoctorReports() {
  const [reports, setReports] = useState([]);
  const [filterCriteria, setFilterCriteria] = useState({
    patientName: "",
    diagnosisName: "",
    referralDoctor: "",
    year: "",
    month: "",
    day: "",
  });
  const { userId } = useContext(AuthContext);
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // Months are 0-based
  const currentDay = new Date().getDate();

  const years = [];
  for (let y = 2020; y <= currentYear; y++) {
    years.push(y);
  }

  const getMonths = () => {
    if (!filterCriteria.year) {
      return [];
    }
    const selectedYear = parseInt(filterCriteria.year, 10);
    const months = [];
    const maxMonth = selectedYear === currentYear ? currentMonth : 12;
    for (let m = 1; m <= maxMonth; m++) {
      months.push(m);
    }
    return months;
  };

  const getDays = () => {
    if (!filterCriteria.year || !filterCriteria.month) {
      return [];
    }
    const selectedYear = parseInt(filterCriteria.year, 10);
    const selectedMonth = parseInt(filterCriteria.month, 10);
    let daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    // If the selected year and month are the current year and month, limit days up to current day
    if (selectedYear === currentYear && selectedMonth === currentMonth) {
      daysInMonth = currentDay;
    }

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  };

  const getReports = async () => {
    try {
      const params = {
        year: filterCriteria.year,
        month: filterCriteria.month,
        day: filterCriteria.day,
        patientName: filterCriteria.patientName,
        diagnosisName: filterCriteria.diagnosisName,
        referralDoctor: filterCriteria.referralDoctor,
      };
      const response = await axios.get(`/api/v1/reports/${userId}`, { params });
      const sortedReports = response.data.sort(
        (a, b) => new Date(b.creation_date) - new Date(a.creation_date)
      );
      setReports(sortedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterCriteria((prev) => {
      const updatedCriteria = { ...prev, [name]: value };
      // Reset month and day if year changes
      if (name === "year") {
        updatedCriteria.month = "";
        updatedCriteria.day = "";
      }
      // Reset day if month changes
      if (name === "month") {
        updatedCriteria.day = "";
      }
      return updatedCriteria;
    });
  };

  const handleSearch = () => {
    // Trigger the report fetch with the current filter criteria when "Search" is clicked
    getReports();
  };

  const handleReportClick = (reportId) => {
    navigate(`/doctor-report/${reportId}`);
  };

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" gutterBottom>
          Doctor's Reports
        </Typography>

        <Paper elevation={3} style={{ padding: "20px", marginBottom: "30px" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3} md={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="year-label">Year</InputLabel>
                <Select
                  labelId="year-label"
                  label="Year"
                  name="year"
                  value={filterCriteria.year}
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">
                    <em>Any</em>
                  </MenuItem>
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <FormControl
                fullWidth
                variant="outlined"
                disabled={!filterCriteria.year}
              >
                <InputLabel id="month-label">Month</InputLabel>
                <Select
                  labelId="month-label"
                  label="Month"
                  name="month"
                  value={filterCriteria.month}
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">
                    <em>Any</em>
                  </MenuItem>
                  {getMonths().map((month) => (
                    <MenuItem key={month} value={month}>
                      {new Date(0, month - 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <FormControl
                fullWidth
                variant="outlined"
                disabled={!filterCriteria.year || !filterCriteria.month}
              >
                <InputLabel id="day-label">Day</InputLabel>
                <Select
                  labelId="day-label"
                  label="Day"
                  name="day"
                  value={filterCriteria.day}
                  onChange={handleFilterChange}
                >
                  <MenuItem value="">
                    <em>Any</em>
                  </MenuItem>
                  {getDays().map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <TextField
                label="Patient Name"
                variant="outlined"
                fullWidth
                name="patientName"
                value={filterCriteria.patientName}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <TextField
                label="Diagnosis Name"
                variant="outlined"
                fullWidth
                name="diagnosisName"
                value={filterCriteria.diagnosisName}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <TextField
                label="Referral Doctor"
                variant="outlined"
                fullWidth
                name="referralDoctor"
                value={filterCriteria.referralDoctor}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                fullWidth
                style={{ marginTop: "10px" }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={4}>
          {reports.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.report_id}>
              <Card
                variant="outlined"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "transform 0.2s",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                onClick={() => handleReportClick(report.report_id)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.02)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <CardContent style={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6" gutterBottom style={{ marginLeft: 8 }}>
                      {report.patient_first_name} {report.patient_last_name}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocalHospitalIcon color="secondary" />
                    <Typography variant="body1" style={{ marginLeft: 8 }}>
                      <strong>Diagnosis:</strong> {report.diagnosis_name}
                    </Typography>
                  </Box>
                  {report.referral_doctor_name && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <PersonIcon color="action" />
                      <Typography variant="body2" style={{ marginLeft: 8 }}>
                        <strong>Referred to:</strong> Dr.{" "}
                        {report.referral_doctor_name}
                      </Typography>
                    </Box>
                  )}
                  <Box display="flex" alignItems="center">
                    <EventIcon color="disabled" />
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      style={{ marginLeft: 8 }}
                    >
                      <strong>Date:</strong>{" "}
                      {new Date(report.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
                <Box textAlign="right" p={1}>
                  <IconButton
                    color="primary"
                    onClick={() => handleReportClick(report.report_id)}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
          {reports.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" color="textSecondary" align="center">
                No reports found. Adjust your search criteria.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
}
