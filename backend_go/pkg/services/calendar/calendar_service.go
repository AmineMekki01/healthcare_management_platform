package calendar

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"healthcare_backend/pkg/config"
	"healthcare_backend/pkg/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
)

type CalendarService struct {
	db  *pgxpool.Pool
	cfg *config.Config
}

func NewCalendarService(db *pgxpool.Pool, cfg *config.Config) *CalendarService {
	return &CalendarService{
		db:  db,
		cfg: cfg,
	}
}

func (s *CalendarService) MigrateLegacyDoctorExceptionsToCalendarEvents() error {
	var hasLegacy bool
	if err := s.db.QueryRow(context.Background(), `SELECT to_regclass('public.doctor_exception') IS NOT NULL`).Scan(&hasLegacy); err != nil {
		return err
	}
	if !hasLegacy {
		return nil
	}

	ctx := context.Background()
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO doctor_calendar_events (
			doctor_id,
			title,
			description,
			event_type,
			start_time,
			end_time,
			all_day,
			blocks_appointments,
			color,
			created_at,
			updated_at
		)
		SELECT
			de.doctor_id,
			'Time off',
			NULL,
			'blocked',
			de.start_time,
			de.end_time,
			FALSE,
			TRUE,
			'#F56565',
			NOW(),
			NOW()
		FROM doctor_exception de
		WHERE NOT EXISTS (
			SELECT 1
			FROM doctor_calendar_events e
			WHERE e.doctor_id = de.doctor_id
			AND e.event_type = 'blocked'
			AND e.blocks_appointments = TRUE
			AND e.start_time = de.start_time
			AND e.end_time = de.end_time
			AND e.parent_event_id IS NULL
		)`

	if _, err := tx.Exec(ctx, query); err != nil {
		return err
	}

	cleanupQuery := `
		DELETE FROM doctor_exception de
		WHERE EXISTS (
			SELECT 1
			FROM doctor_calendar_events e
			WHERE e.doctor_id = de.doctor_id
			AND e.event_type = 'blocked'
			AND e.blocks_appointments = TRUE
			AND e.start_time = de.start_time
			AND e.end_time = de.end_time
			AND e.parent_event_id IS NULL
		)`
	if _, err := tx.Exec(ctx, cleanupQuery); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// CreateCalendarEvent creates a new calendar event for a doctor
func (s *CalendarService) CreateCalendarEvent(doctorID uuid.UUID, req models.CreateCalendarEventRequest) (*models.CalendarEvent, error) {
	eventID := uuid.New()
	now := time.Now()

	var recurringPatternJSON []byte
	var err error
	if req.RecurringPattern != nil {
		recurringPatternJSON, err = json.Marshal(req.RecurringPattern)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal recurring pattern: %v", err)
		}
	}

	color := req.Color
	if color == "" {
		color = "#FFB84D"
	}

	query := `
		INSERT INTO doctor_calendar_events (
			event_id, doctor_id, title, description, event_type,
			start_time, end_time, all_day, blocks_appointments,
			recurring_pattern, color, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING event_id, created_at, updated_at
	`

	event := &models.CalendarEvent{
		EventID:            eventID,
		DoctorID:           doctorID,
		Title:              req.Title,
		Description:        req.Description,
		EventType:          req.EventType,
		StartTime:          req.StartTime,
		EndTime:            req.EndTime,
		AllDay:             req.AllDay,
		BlocksAppointments: req.BlocksAppointments,
		Color:              color,
	}

	err = s.db.QueryRow(context.Background(), query,
		eventID, doctorID, req.Title, req.Description, req.EventType,
		req.StartTime, req.EndTime, req.AllDay, req.BlocksAppointments,
		recurringPatternJSON, color, now, now,
	).Scan(&event.EventID, &event.CreatedAt, &event.UpdatedAt)

	if err != nil {
		log.Printf("Error creating calendar event: %v", err)
		return nil, fmt.Errorf("failed to create calendar event: %v", err)
	}

	if req.RecurringPattern != nil {
		event.RecurringPattern = req.RecurringPattern
	}

	return event, nil
}

// GetCalendarEvents retrieves calendar events for a doctor within a date range
// Expands recurring events into individual occurrences
func (s *CalendarService) GetCalendarEvents(doctorID uuid.UUID, startDate, endDate time.Time) ([]models.CalendarEvent, error) {
	// Fetch all events including recurring ones that might start before the range
	query := `
		SELECT 
			event_id, doctor_id, title, description, event_type,
			start_time, end_time, all_day, blocks_appointments,
			recurring_pattern, parent_event_id, color, created_at, updated_at
		FROM doctor_calendar_events
		WHERE doctor_id = $1 
		AND parent_event_id IS NULL
		AND (
			(start_time < $3 AND end_time > $2)
			OR (recurring_pattern IS NOT NULL)
		)
		ORDER BY start_time ASC
	`

	rows, err := s.db.Query(context.Background(), query, doctorID, startDate, endDate)
	if err != nil {
		log.Printf("Error querying calendar events: %v", err)
		return nil, fmt.Errorf("failed to query calendar events: %v", err)
	}
	defer rows.Close()

	var allEvents []models.CalendarEvent

	for rows.Next() {
		var event models.CalendarEvent
		var recurringPatternJSON []byte

		err := rows.Scan(
			&event.EventID, &event.DoctorID, &event.Title, &event.Description, &event.EventType,
			&event.StartTime, &event.EndTime, &event.AllDay, &event.BlocksAppointments,
			&recurringPatternJSON, &event.ParentEventID, &event.Color, &event.CreatedAt, &event.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning calendar event: %v", err)
			continue
		}

		if recurringPatternJSON != nil {
			var pattern map[string]interface{}
			if err := json.Unmarshal(recurringPatternJSON, &pattern); err == nil {
				event.RecurringPattern = pattern
			}
		}

		// Expand recurring events
		if event.RecurringPattern != nil {
			expandedEvents := s.expandRecurringEvent(event, startDate, endDate)
			allEvents = append(allEvents, expandedEvents...)
		} else {
			// Only include non-recurring events that are within the range
			if event.StartTime.Before(endDate) && event.EndTime.After(startDate) {
				allEvents = append(allEvents, event)
			}
		}
	}

	return allEvents, nil
}

// expandRecurringEvent generates individual occurrences of a recurring event
func (s *CalendarService) expandRecurringEvent(event models.CalendarEvent, rangeStart, rangeEnd time.Time) []models.CalendarEvent {
	var occurrences []models.CalendarEvent

	pattern, ok := event.RecurringPattern["pattern"].(string)
	if !ok {
		return []models.CalendarEvent{event}
	}

	duration := event.EndTime.Sub(event.StartTime)
	currentDate := event.StartTime

	// Get end date from pattern or use rangeEnd
	var recurringEnd time.Time
	if endDateStr, ok := event.RecurringPattern["endDate"].(string); ok {
		if parsed, err := time.Parse("2006-01-02", endDateStr); err == nil {
			// Set to end of day (23:59:59) to include events on the end date
			recurringEnd = time.Date(parsed.Year(), parsed.Month(), parsed.Day(), 23, 59, 59, 0, parsed.Location())
			log.Printf("Expanding recurring event '%s' from %s until %s", event.Title, event.StartTime.Format("2006-01-02"), recurringEnd.Format("2006-01-02"))
		} else {
			log.Printf("Failed to parse endDate '%s', using rangeEnd", endDateStr)
			recurringEnd = rangeEnd
		}
	} else {
		log.Printf("No endDate specified for recurring event '%s', using rangeEnd", event.Title)
		recurringEnd = rangeEnd
	}

	// Limit to the earlier of recurringEnd or rangeEnd
	maxDate := rangeEnd
	if !recurringEnd.IsZero() && recurringEnd.Before(maxDate) {
		maxDate = recurringEnd
	}

	// Safety limit: max 365 occurrences to prevent infinite loops
	const maxOccurrences = 365

	switch pattern {
	case "daily":
		count := 0
		for currentDate.Before(maxDate) && count < maxOccurrences {
			if currentDate.After(rangeStart) || currentDate.Equal(rangeStart) {
				occurrence := event
				occurrence.EventID = uuid.New() // Generate unique ID for each occurrence
				occurrence.StartTime = currentDate
				occurrence.EndTime = currentDate.Add(duration)
				occurrence.ParentEventID = &event.EventID
				occurrences = append(occurrences, occurrence)
			}
			currentDate = currentDate.AddDate(0, 0, 1)
			count++
		}

	case "weekly":
		daysOfWeek := []int{}
		if days, ok := event.RecurringPattern["daysOfWeek"].([]interface{}); ok {
			for _, day := range days {
				if dayNum, ok := day.(float64); ok {
					daysOfWeek = append(daysOfWeek, int(dayNum))
				}
			}
		}

		if len(daysOfWeek) == 0 {
			// If no days specified, use the original day
			daysOfWeek = []int{int(currentDate.Weekday())}
		}

		// Iterate through weeks
		count := 0
		for currentDate.Before(maxDate) && count < maxOccurrences {
			weekday := int(currentDate.Weekday())
			// Convert Sunday (0) to 7 to match common convention
			if weekday == 0 {
				weekday = 7
			}

			// Check if this day is in the recurrence pattern
			for _, targetDay := range daysOfWeek {
				if weekday == targetDay {
					if currentDate.After(rangeStart) || currentDate.Equal(rangeStart) {
						if currentDate.Before(maxDate) {
							occurrence := event
							occurrence.EventID = uuid.New()
							occurrence.StartTime = currentDate
							occurrence.EndTime = currentDate.Add(duration)
							occurrence.ParentEventID = &event.EventID
							occurrences = append(occurrences, occurrence)
						}
					}
					break
				}
			}
			currentDate = currentDate.AddDate(0, 0, 1)
			count++
		}

	case "monthly":
		dayOfMonth := currentDate.Day()
		count := 0
		for currentDate.Before(maxDate) && count < maxOccurrences {
			if currentDate.After(rangeStart) || currentDate.Equal(rangeStart) {
				occurrence := event
				occurrence.EventID = uuid.New()
				occurrence.StartTime = currentDate
				occurrence.EndTime = currentDate.Add(duration)
				occurrence.ParentEventID = &event.EventID
				occurrences = append(occurrences, occurrence)
			}

			// Move to same day next month
			nextMonth := currentDate.AddDate(0, 1, 0)
			// Handle months with fewer days (e.g., Jan 31 -> Feb 28)
			if nextMonth.Day() != dayOfMonth {
				nextMonth = time.Date(nextMonth.Year(), nextMonth.Month(), dayOfMonth,
					currentDate.Hour(), currentDate.Minute(), currentDate.Second(), 0, currentDate.Location())
			}
			currentDate = nextMonth
			count++
		}
	}

	log.Printf("Created %d occurrences for recurring event '%s'", len(occurrences), event.Title)
	return occurrences
}

// UpdateCalendarEvent updates an existing calendar event
func (s *CalendarService) UpdateCalendarEvent(eventID uuid.UUID, req models.UpdateCalendarEventRequest) error {
	query := `
		UPDATE doctor_calendar_events
		SET 
			title = COALESCE($1, title),
			description = COALESCE($2, description),
			event_type = COALESCE($3, event_type),
			start_time = COALESCE($4, start_time),
			end_time = COALESCE($5, end_time),
			all_day = COALESCE($6, all_day),
			blocks_appointments = COALESCE($7, blocks_appointments),
			color = COALESCE($8, color),
			updated_at = NOW()
		WHERE event_id = $9
	`

	_, err := s.db.Exec(context.Background(), query,
		req.Title, req.Description, req.EventType,
		req.StartTime, req.EndTime, req.AllDay,
		req.BlocksAppointments, req.Color, eventID,
	)

	if err != nil {
		log.Printf("Error updating calendar event: %v", err)
		return fmt.Errorf("failed to update calendar event: %v", err)
	}

	return nil
}

// DeleteCalendarEvent deletes a calendar event
func (s *CalendarService) DeleteCalendarEvent(eventID uuid.UUID, deleteAll bool) error {
	var query string
	if deleteAll {
		// Delete all occurrences of a recurring event
		query = `
			DELETE FROM doctor_calendar_events
			WHERE event_id = $1 OR parent_event_id = $1
		`
	} else {
		// Delete single event
		query = `
			DELETE FROM doctor_calendar_events
			WHERE event_id = $1
		`
	}

	_, err := s.db.Exec(context.Background(), query, eventID)
	if err != nil {
		log.Printf("Error deleting calendar event: %v", err)
		return fmt.Errorf("failed to delete calendar event: %v", err)
	}

	return nil
}

// CheckAvailability checks if a time slot is available for appointment booking
func (s *CalendarService) CheckAvailability(doctorID uuid.UUID, startTime time.Time, duration int) (*models.AvailabilityCheckResult, error) {
	endTime := startTime.Add(time.Duration(duration) * time.Minute)
	conflicts := []models.Conflict{}

	inSchedule := false
	if err := s.db.QueryRow(context.Background(),
		`SELECT EXISTS (
			SELECT 1
			FROM availabilities
			WHERE doctor_id = $1
			AND availability_start = $2
			AND availability_end = $3
		)`,
		doctorID, startTime, endTime,
	).Scan(&inSchedule); err == nil {
		if !inSchedule {
			conflicts = append(conflicts, models.Conflict{
				Type:      models.ConflictOutsideSchedule,
				Title:     "Outside schedule",
				StartTime: startTime,
				EndTime:   endTime,
				Details:   "Outside doctor's working hours",
			})
			return &models.AvailabilityCheckResult{Available: false, Conflicts: conflicts}, nil
		}
	}

	appointmentQuery := `
		SELECT appointment_start, appointment_end, title
		FROM appointments
		WHERE doctor_id = $1
		AND NOT canceled
		AND (
			(appointment_start < $3 AND appointment_end > $2)
			OR (appointment_start >= $2 AND appointment_start < $3)
		)
	`

	rows, err := s.db.Query(context.Background(), appointmentQuery, doctorID, startTime, endTime)
	if err != nil {
		log.Printf("Error checking appointments: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var aptStart, aptEnd time.Time
			var title string
			if err := rows.Scan(&aptStart, &aptEnd, &title); err == nil {
				conflicts = append(conflicts, models.Conflict{
					Type:      models.ConflictAppointment,
					Title:     title,
					StartTime: aptStart,
					EndTime:   aptEnd,
					Details:   "Existing appointment",
				})
			}
		}
	}

	eventQuery := `
		SELECT event_id, title, start_time, end_time, event_type
		FROM doctor_calendar_events
		WHERE doctor_id = $1
		AND blocks_appointments = true
		AND (
			(start_time < $3 AND end_time > $2)
			OR (start_time >= $2 AND start_time < $3)
		)
	`

	rows, err = s.db.Query(context.Background(), eventQuery, doctorID, startTime, endTime)
	if err != nil {
		log.Printf("Error checking calendar events: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var eventID uuid.UUID
			var title, eventType string
			var evtStart, evtEnd time.Time
			if err := rows.Scan(&eventID, &title, &evtStart, &evtEnd, &eventType); err == nil {
				conflicts = append(conflicts, models.Conflict{
					Type:      models.ConflictEvent,
					Title:     title,
					StartTime: evtStart,
					EndTime:   evtEnd,
					Details:   fmt.Sprintf("Personal event (%s)", eventType),
				})
			}
		}
	}

	holidayQuery := `
		SELECT name, holiday_date, duration_days
		FROM public_holidays
		WHERE affects_booking = true
		AND holiday_date >= $1::date
		AND holiday_date < $2::date
	`

	rows, err = s.db.Query(context.Background(), holidayQuery, startTime, endTime)
	if err != nil {
		log.Printf("Error checking holidays: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var name string
			var holidayDate time.Time
			var duration int
			if err := rows.Scan(&name, &holidayDate, &duration); err == nil {
				conflicts = append(conflicts, models.Conflict{
					Type:      models.ConflictHoliday,
					Title:     name,
					StartTime: holidayDate,
					EndTime:   holidayDate.AddDate(0, 0, duration),
					Details:   "Public holiday",
				})
			}
		}
	}

	result := &models.AvailabilityCheckResult{
		Available: len(conflicts) == 0,
		Conflicts: conflicts,
	}

	if len(conflicts) > 0 {
		result.Suggestion = s.findNextAvailableSlot(doctorID, endTime, duration)
	}

	return result, nil
}

// findNextAvailableSlot finds the next available time slot
func (s *CalendarService) findNextAvailableSlot(doctorID uuid.UUID, afterTime time.Time, duration int) string {
	var next time.Time
	if err := s.db.QueryRow(context.Background(),
		`SELECT availability_start
		 FROM availabilities
		 WHERE doctor_id = $1
		 AND availability_start >= $2
		 ORDER BY availability_start
		 LIMIT 1`,
		doctorID, afterTime,
	).Scan(&next); err == nil {
		return fmt.Sprintf("Next available slot at %s", next.Format("3:04 PM"))
	}

	nextSlot := afterTime.Add(1 * time.Hour)
	return fmt.Sprintf("Next available slot at %s", nextSlot.Format("3:04 PM"))
}

// FindAvailableSlots finds multiple available slots
func (s *CalendarService) FindAvailableSlots(doctorID uuid.UUID, startDate, endDate time.Time, duration, limit int) ([]models.AvailableSlot, error) {
	slots := []models.AvailableSlot{}
	if limit <= 0 {
		limit = 50
	}
	if duration <= 0 {
		duration = 30
	}

	loc, err := time.LoadLocation("Africa/Casablanca")
	if err != nil {
		loc = time.Local
	}

	rangeStart := time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, loc)
	rangeEnd := time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 0, loc)

	query := `
		SELECT availability_start, availability_end
		FROM availabilities
		WHERE doctor_id = $1
		AND availability_start >= $2
		AND availability_end <= $3
		ORDER BY availability_start
		LIMIT $4`

	rows, err := s.db.Query(context.Background(), query, doctorID, rangeStart, rangeEnd, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query availabilities: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var slotStart, slotEnd time.Time
		if err := rows.Scan(&slotStart, &slotEnd); err != nil {
			continue
		}

		if int(slotEnd.Sub(slotStart).Minutes()) != duration {
			continue
		}

		result, err := s.CheckAvailability(doctorID, slotStart, duration)
		if err != nil {
			continue
		}
		if result.Available {
			slots = append(slots, models.AvailableSlot{
				StartTime: slotStart,
				EndTime:   slotEnd,
				Available: true,
			})
		}
	}

	return slots, nil
}
