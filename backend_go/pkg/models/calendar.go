package models

import (
	"time"

	"github.com/google/uuid"
)

// CalendarEvent represents a personal calendar event for a doctor
type CalendarEvent struct {
	EventID           uuid.UUID              `json:"eventId"`
	DoctorID          uuid.UUID              `json:"doctorId"`
	Title             string                 `json:"title"`
	Description       *string                `json:"description,omitempty"`
	EventType         string                 `json:"eventType"` // personal, blocked, recurring_block
	StartTime         time.Time              `json:"startTime"`
	EndTime           time.Time              `json:"endTime"`
	AllDay            bool                   `json:"allDay"`
	BlocksAppointments bool                  `json:"blocksAppointments"`
	RecurringPattern  map[string]interface{} `json:"recurringPattern,omitempty"`
	ParentEventID     *uuid.UUID             `json:"parentEventId,omitempty"`
	Color             string                 `json:"color"`
	CreatedAt         time.Time              `json:"createdAt"`
	UpdatedAt         time.Time              `json:"updatedAt"`
}

// RecurringPattern represents the pattern for recurring events
type RecurringPattern struct {
	Pattern         string    `json:"pattern"` // daily, weekly, monthly
	DaysOfWeek      []int     `json:"daysOfWeek,omitempty"`
	Interval        int       `json:"interval,omitempty"`
	EndType         string    `json:"endType,omitempty"` // date, count, never
	EndDate         *string   `json:"endDate,omitempty"`
	OccurrenceCount *int      `json:"occurrenceCount,omitempty"`
}

// PublicHoliday represents a public holiday
type PublicHoliday struct {
	HolidayID         uuid.UUID  `json:"holidayId"`
	Name              string     `json:"name"`
	NameAr            *string    `json:"nameAr,omitempty"`
	NameFr            *string    `json:"nameFr,omitempty"`
	Description       *string    `json:"description,omitempty"`
	HolidayDate       time.Time  `json:"holidayDate"`
	DurationDays      int        `json:"durationDays"`
	CountryCode       *string    `json:"countryCode,omitempty"`
	Region            *string    `json:"region,omitempty"`
	IsRecurring       bool       `json:"isRecurring"`
	AffectsBooking    bool       `json:"affectsBooking"`
	DisplayInCalendar bool       `json:"displayInCalendar"`
	InstitutionID     *uuid.UUID `json:"institutionId,omitempty"`
	Color             string     `json:"color"`
	CreatedBy         *uuid.UUID `json:"createdBy,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}

// ConflictType represents the type of scheduling conflict
type ConflictType string

const (
	ConflictAppointment ConflictType = "appointment"
	ConflictEvent       ConflictType = "event"
	ConflictHoliday     ConflictType = "holiday"
	ConflictException   ConflictType = "exception"
)

// Conflict represents a scheduling conflict
type Conflict struct {
	Type      ConflictType `json:"type"`
	Title     string       `json:"title"`
	StartTime time.Time    `json:"startTime"`
	EndTime   time.Time    `json:"endTime"`
	Details   string       `json:"details,omitempty"`
}

// AvailabilityCheckResult represents the result of checking slot availability
type AvailabilityCheckResult struct {
	Available   bool       `json:"available"`
	Conflicts   []Conflict `json:"conflicts,omitempty"`
	Suggestion  string     `json:"suggestion,omitempty"`
}

// AvailableSlot represents an available time slot
type AvailableSlot struct {
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
	Available bool      `json:"available"`
}

// CreateCalendarEventRequest represents request to create a calendar event
type CreateCalendarEventRequest struct {
	Title              string                 `json:"title" binding:"required"`
	Description        *string                `json:"description"`
	EventType          string                 `json:"eventType" binding:"required"`
	StartTime          time.Time              `json:"startTime" binding:"required"`
	EndTime            time.Time              `json:"endTime" binding:"required"`
	AllDay             bool                   `json:"allDay"`
	BlocksAppointments bool                   `json:"blocksAppointments"`
	RecurringPattern   map[string]interface{} `json:"recurringPattern"`
	Color              string                 `json:"color"`
}

// UpdateCalendarEventRequest represents request to update a calendar event
type UpdateCalendarEventRequest struct {
	Title              *string                `json:"title"`
	Description        *string                `json:"description"`
	EventType          *string                `json:"eventType"`
	StartTime          *time.Time             `json:"startTime"`
	EndTime            *time.Time             `json:"endTime"`
	AllDay             *bool                  `json:"allDay"`
	BlocksAppointments *bool                  `json:"blocksAppointments"`
	RecurringPattern   map[string]interface{} `json:"recurringPattern"`
	Color              *string                `json:"color"`
}

// CreateHolidayRequest represents request to create a holiday
type CreateHolidayRequest struct {
	Name              string     `json:"name" binding:"required"`
	NameAr            *string    `json:"nameAr"`
	NameFr            *string    `json:"nameFr"`
	Description       *string    `json:"description"`
	HolidayDate       time.Time  `json:"holidayDate" binding:"required"`
	DurationDays      int        `json:"durationDays"`
	CountryCode       *string    `json:"countryCode"`
	Region            *string    `json:"region"`
	IsRecurring       bool       `json:"isRecurring"`
	AffectsBooking    bool       `json:"affectsBooking"`
	DisplayInCalendar bool       `json:"displayInCalendar"`
	InstitutionID     *uuid.UUID `json:"institutionId"`
	Color             string     `json:"color"`
}
