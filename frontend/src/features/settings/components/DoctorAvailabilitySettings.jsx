import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from 'react-i18next';
import axios from "../../../components/axiosConfig";
import { AuthContext } from "./../../../features/auth/context/AuthContext";
import calendarEventService from "../../appointments/services/calendarEventService";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format as formatDate } from 'date-fns';
import { arSA, enUS, fr } from 'date-fns/locale';
import { enUS as pickersEnUS, frFR as pickersFrFR } from '@mui/x-date-pickers/locales';

function formatLocalizedDate(date, locale) {
  const dt = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dt.getTime())) return '';

  try {
    return new Intl.DateTimeFormat(locale || undefined, { dateStyle: 'medium' }).format(dt);
  } catch {
    return dt.toLocaleDateString(locale || undefined);
  }
}

function getWeeksInMonth(year, month, locale) {
  const weeks = [];
  const firstDay = new Date(year, month, 1);
  let start = new Date(firstDay);
  while (start.getMonth() === month) {
    const end = new Date(start);
    end.setDate(start.getDate() + 6 - start.getDay());
    weeks.push({
      label: `${formatLocalizedDate(start, locale)} - ${formatLocalizedDate(end, locale)}`,
      start: new Date(start),
      end: new Date(end),
    });
    start.setDate(start.getDate() + 7 - start.getDay());
  }
  return weeks;
}

export default function DoctorAvailabilitySettings() {
  const { t, i18n } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { userId } = useContext(AuthContext);
  const today = new Date();
  const locale = i18n.language || undefined;

  const formatDateOnlyLocal = (dt) => {
    const d = dt instanceof Date ? dt : new Date(dt);
    if (Number.isNaN(d.getTime())) return '';
    return formatDate(d, 'yyyy-MM-dd');
  };

  const parseDateOnlyLocal = (dateStr) => {
    const raw = String(dateStr || '').trim();
    if (!raw) return null;
    const parts = raw.split('-').map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [y, m, d] = parts;
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const timeToMinutes = (value) => {
    const raw = String(value || '').trim();
    const parts = raw.split(':');
    if (parts.length < 2) return null;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const buildLocalDateTimeISO = (dateStr, timeStr) => {
    const d = parseDateOnlyLocal(dateStr);
    const tm = String(timeStr || '').trim();
    if (!d || !tm) return null;
    const [hStr, mStr] = tm.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const dt = new Date(d);
    dt.setHours(h, m, 0, 0);
    return dt.toISOString();
  };

  const getAdapterLocale = () => {
    const lang = String(i18n.language || '').toLowerCase();
    if (lang === 'fr' || lang.startsWith('fr-')) return fr;
    if (lang === 'ar' || lang.startsWith('ar-')) return arSA;
    return enUS;
  };

  const getPickerLocaleText = () => {
    const lang = String(i18n.language || '').toLowerCase();
    if (lang === 'fr' || lang.startsWith('fr-')) {
      return pickersFrFR.components.MuiLocalizationProvider.defaultProps.localeText;
    }
    if (lang === 'ar' || lang.startsWith('ar-')) {
      const base = pickersEnUS.components.MuiLocalizationProvider.defaultProps.localeText;
      return {
        ...base,
        cancelButtonLabel: tCommon('buttons.cancel'),
        okButtonLabel: tCommon('common.ok'),
        todayButtonLabel: tCommon('common.today'),
        clearButtonLabel: tCommon('buttons.clear'),
      };
    }
    return pickersEnUS.components.MuiLocalizationProvider.defaultProps.localeText;
  };

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [weeks, setWeeks] = useState(
    getWeeksInMonth(today.getFullYear(), today.getMonth(), locale)
  );
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  const defaultSchedule = [
    { weekday: "Monday", enabled: true, start: "09:00", end: "17:00", slotDuration: 30, blocks: [{ start: "09:00", end: "17:00" }] },
    { weekday: "Tuesday", enabled: true, start: "09:00", end: "17:00", slotDuration: 30, blocks: [{ start: "09:00", end: "17:00" }] },
    { weekday: "Wednesday", enabled: true, start: "09:00", end: "17:00", slotDuration: 30, blocks: [{ start: "09:00", end: "17:00" }] },
    { weekday: "Thursday", enabled: true, start: "09:00", end: "17:00", slotDuration: 30, blocks: [{ start: "09:00", end: "17:00" }] },
    { weekday: "Friday", enabled: true, start: "09:00", end: "17:00", slotDuration: 30, blocks: [{ start: "09:00", end: "17:00" }] },
    { weekday: "Saturday", enabled: false, start: "09:00", end: "17:00", slotDuration: 30, blocks: [] },
    { weekday: "Sunday", enabled: false, start: "09:00", end: "17:00", slotDuration: 30, blocks: [] },
  ];

  const [weeklySchedule, setWeeklySchedule] = useState(defaultSchedule);
  const [vacations, setVacations] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [vacationDraft, setVacationDraft] = useState({
    id: null,
    title: "",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "13:00",
    allDay: false,
  });


  useEffect(() => {
    setWeeks(getWeeksInMonth(selectedYear, selectedMonth, locale));
    setSelectedWeekIdx(0);
  }, [selectedMonth, selectedYear, locale]);




  useEffect(() => {
    if (!userId || !weeks[selectedWeekIdx]) return;
    const range = weeks[selectedWeekIdx];
    const qs = `start=${formatDateOnlyLocal(range.start)}&end=${formatDateOnlyLocal(range.end)}`;
    axios
      .get(`/api/v1/doctors/${userId}/weekly_schedule?${qs}`)
      .then((res) => {
        if (res.data && Array.isArray(res.data.weeklySchedule)) {
          console.log("Weekly schedule fetched:", res.data.weeklySchedule);
          const normalized = res.data.weeklySchedule.map((entry) => {
            const blocks = Array.isArray(entry.blocks) && entry.blocks.length > 0
              ? entry.blocks
              : (entry.start && entry.end ? [{ start: entry.start, end: entry.end }] : []);
            return {
              weekday: entry.weekday,
              enabled: Boolean(entry.enabled),
              start: entry.start || blocks[0]?.start || "09:00",
              end: entry.end || blocks[blocks.length - 1]?.end || "17:00",
              slotDuration: entry.slotDuration || 30,
              blocks,
            };
          });
          setWeeklySchedule(normalized);
        } else {
          console.warn("Unexpected weekly schedule format:", res.data); 
          const slots = Array.isArray(res.data) ? res.data : [];
          const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          const weekTemplate = weekdays.map((weekday) => {
            const daySlots = slots.filter(s => s.weekday === weekday);
            if (daySlots.length === 0) {
              return {
                weekday,
                enabled: false,
                start: "09:00",
                end: "17:00",
                slotDuration: 30,
                blocks: [],
              };
            } else {
              const start = daySlots.reduce((min, s) => s.availabilityStart < min ? s.availabilityStart : min, daySlots[0].availabilityStart);
              const end = daySlots.reduce((max, s) => s.availabilityEnd > max ? s.availabilityEnd : max, daySlots[0].availabilityEnd);
              const slotDuration = daySlots[0].slotDuration || 30;
              const startTime = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              const endTime = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              return {
                weekday,
                enabled: true,
                start: startTime,
                end: endTime,
                slotDuration,
                blocks: [{ start: startTime, end: endTime }],
              };
            }
          });
          setWeeklySchedule(weekTemplate);
        }
      })
      .catch(() => {
        console.error("Error fetching weekly schedule");
        const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        setWeeklySchedule(weekdays.map(weekday => ({
          weekday,
          enabled: false,
          start: "09:00",
          end: "17:00",
          slotDuration: 30,
          blocks: [],
        })));
      });
  }, [userId, weeks, selectedWeekIdx]);

  useEffect(() => {
    if (!userId || !weeks[selectedWeekIdx]) return;
    const range = weeks[selectedWeekIdx];
    const start = formatDateOnlyLocal(range.start);
    const end = formatDateOnlyLocal(range.end);

    calendarEventService
      .getCalendarEvents(userId, start, end)
      .then((data) => {
        const events = Array.isArray(data?.events) ? data.events : [];
        setVacations(events.filter((evt) => evt?.blocksAppointments && evt?.eventType === 'blocked'));
      })
      .catch(() => setVacations([]));
  }, [userId, weeks, selectedWeekIdx]);

  const validateWeeklySchedule = (schedule) => {
    const errors = [];
    schedule.forEach((day) => {
      if (!day.enabled) return;
      const blocks = Array.isArray(day.blocks) ? day.blocks : [];
      if (blocks.length === 0) {
        errors.push(`${t(`availability.days.${day.weekday}`)}: ${t('availability.errors.noBlocks')}`);
        return;
      }

      const normalized = blocks
        .map((b) => ({
          start: String(b.start || '').trim(),
          end: String(b.end || '').trim(),
          startMin: timeToMinutes(b.start),
          endMin: timeToMinutes(b.end),
        }))
        .filter((b) => b.start && b.end && b.startMin != null && b.endMin != null)
        .sort((a, b) => a.startMin - b.startMin);

      normalized.forEach((b) => {
        if (b.endMin <= b.startMin) {
          errors.push(`${t(`availability.days.${day.weekday}`)}: ${t('availability.errors.invalidBlock')}`);
        }
      });

      for (let i = 1; i < normalized.length; i++) {
        if (normalized[i].startMin < normalized[i - 1].endMin) {
          errors.push(`${t(`availability.days.${day.weekday}`)}: ${t('availability.errors.overlappingBlocks')}`);
          break;
        }
      }
    });
    return errors;
  };

  const saveSchedule = () => {
    const range = weeks[selectedWeekIdx];
    console.log("weeklySchedule : ", weeklySchedule);
    const validationErrors = validateWeeklySchedule(weeklySchedule);
    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      return;
    }

    const qs = `start=${formatDateOnlyLocal(range.start)}&end=${formatDateOnlyLocal(range.end)}`;
    const payload = weeklySchedule.map((day) => {
      const blocks = Array.isArray(day.blocks) ? day.blocks : [];
      const activeBlocks = day.enabled ? blocks : [];
      return {
        weekday: day.weekday,
        enabled: Boolean(day.enabled),
        start: day.start || activeBlocks[0]?.start || "09:00",
        end: day.end || activeBlocks[activeBlocks.length - 1]?.end || "17:00",
        slotDuration: day.slotDuration || 30,
        blocks: activeBlocks,
      };
    });
    axios
      .post(`/api/v1/doctors/availabilities/${userId}?${qs}`, payload)
      .then(() => alert(t('availability.success.scheduleSaved')));
  };

  const clearAllSchedule = () => {
    setShowClearConfirm(true);
  };

  const confirmClearSchedule = () => {
    axios
      .delete(`/api/v1/doctors/availabilities/${userId}`)
      .then(() => {
        alert(t('availability.success.schedulesCleared'));
        const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const clearedSchedule = weekdays.map(weekday => ({
          weekday,
          enabled: false,
          start: "09:00",
          end: "17:00",
          slotDuration: 30,
        }));
        setWeeklySchedule(clearedSchedule);
        setShowClearConfirm(false);
      })
      .catch((error) => {
        alert(t('availability.errors.clearingSchedules') + ': ' + error.message);
        setShowClearConfirm(false);
      });
  };

  const cancelClearSchedule = () => {
    setShowClearConfirm(false);
  };

  const saveVacation = () => {
    if (!userId) return;
    const title = (vacationDraft.title || t('availability.vacations.defaultTitle')).trim();
    if (!vacationDraft.startDate || !vacationDraft.endDate) {
      alert(t('availability.errors.missingVacationDates'));
      return;
    }

    const startTime = vacationDraft.allDay ? '00:00' : vacationDraft.startTime;
    const endTime = vacationDraft.allDay ? '23:59' : vacationDraft.endTime;

    const startISO = buildLocalDateTimeISO(vacationDraft.startDate, startTime);
    const endISO = buildLocalDateTimeISO(vacationDraft.endDate, endTime);

    if (!startISO || !endISO) {
      alert(t('availability.errors.invalidVacationDates'));
      return;
    }
    if (new Date(endISO) <= new Date(startISO)) {
      alert(t('availability.errors.invalidVacationRange'));
      return;
    }

    const payload = {
      title,
      eventType: 'blocked',
      startTime: startISO,
      endTime: endISO,
      allDay: Boolean(vacationDraft.allDay),
      blocksAppointments: true,
      description: '',
      color: '#F56565',
      recurringPattern: null,
    };

    const req = vacationDraft.id
      ? calendarEventService.updatePersonalEvent(userId, vacationDraft.id, payload)
      : calendarEventService.createPersonalEvent(userId, payload);

    req
      .then(() => {
        const range = weeks[selectedWeekIdx];
        const start = formatDateOnlyLocal(range.start);
        const end = formatDateOnlyLocal(range.end);
        return calendarEventService.getCalendarEvents(userId, start, end);
      })
      .then((data) => {
        const events = Array.isArray(data?.events) ? data.events : [];
        setVacations(events.filter((evt) => evt?.blocksAppointments && evt?.eventType === 'blocked'));
        setVacationDraft({
          id: null,
          title: '',
          startDate: '',
          endDate: '',
          startTime: '09:00',
          endTime: '13:00',
          allDay: false,
        });
      })
      .catch((error) => {
        alert((error?.response?.data?.error || error?.message || t('availability.errors.addVacation')));
      });
  };

  const editVacation = (evt) => {
    const startDt = new Date(evt.startTime);
    const endDt = new Date(evt.endTime);
    setVacationDraft({
      id: evt.eventId,
      title: evt.title || '',
      startDate: formatDate(startDt, 'yyyy-MM-dd'),
      endDate: formatDate(endDt, 'yyyy-MM-dd'),
      startTime: formatDate(startDt, 'HH:mm'),
      endTime: formatDate(endDt, 'HH:mm'),
      allDay: Boolean(evt.allDay),
    });
  };

  const deleteVacation = (eventId) => {
    if (!userId || !eventId) return;
    calendarEventService
      .deletePersonalEvent(userId, eventId, false)
      .then(() => setVacations((prev) => prev.filter((v) => v.eventId !== eventId)))
      .catch((error) => {
        alert((error?.response?.data?.error || error?.message || t('availability.errors.deleteVacation')));
      });
  };


  return (
    <div
      style={{
        maxWidth: 650,
        margin: "0 auto",
        padding: 24,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        {t('availability.title')}
      </h2>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          justifyContent: "center",
        }}
      >
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>
              {new Date(selectedYear, i).toLocaleString(locale, { month: "long" })}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {[today.getFullYear(), today.getFullYear() + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={selectedWeekIdx}
          onChange={(e) => setSelectedWeekIdx(Number(e.target.value))}
        >
          {weeks.map((w, idx) => (
            <option key={idx} value={idx}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 12 }}>{t('availability.vacations.title')}</h3>

        <ul style={{ marginBottom: 16 }}>
          {vacations.length === 0 && (
            <li style={{ color: "#888" }}>{t('availability.vacations.noVacations')}</li>
          )}
          {vacations.map((evt) => {
            const startDt = new Date(evt.startTime);
            const endDt = new Date(evt.endTime);
            const label = `${formatLocalizedDate(startDt, locale)} ${formatDate(startDt, 'HH:mm')} → ${formatLocalizedDate(endDt, locale)} ${formatDate(endDt, 'HH:mm')}`;
            return (
              <li key={evt.eventId} style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 500 }}>{evt.title || t('availability.vacations.defaultTitle')}</span>{" "}
                <span style={{ color: '#555' }}>({label})</span>
                <button
                  type="button"
                  onClick={() => editVacation(evt)}
                  style={{ marginLeft: 8, padding: '2px 8px' }}
                >
                  {t('availability.buttons.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => deleteVacation(evt.eventId)}
                  style={{ marginLeft: 8, padding: '2px 8px' }}
                >
                  {t('availability.buttons.delete')}
                </button>
              </li>
            );
          })}
        </ul>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={vacationDraft.title}
            placeholder={t('availability.vacations.titlePlaceholder')}
            onChange={(e) => setVacationDraft({ ...vacationDraft, title: e.target.value })}
            style={{ width: 220 }}
          />
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={getAdapterLocale()}
            localeText={getPickerLocaleText()}
          >
            <DatePicker
              value={parseDateOnlyLocal(vacationDraft.startDate)}
              onChange={(date) =>
                setVacationDraft({
                  ...vacationDraft,
                  startDate: date ? formatDate(date, 'yyyy-MM-dd') : '',
                })
              }
              slotProps={{
                textField: {
                  required: true,
                  size: 'small',
                  sx: { width: 160 },
                },
              }}
            />
            <DatePicker
              value={parseDateOnlyLocal(vacationDraft.endDate)}
              onChange={(date) =>
                setVacationDraft({
                  ...vacationDraft,
                  endDate: date ? formatDate(date, 'yyyy-MM-dd') : '',
                })
              }
              slotProps={{
                textField: {
                  required: true,
                  size: 'small',
                  sx: { width: 160 },
                },
              }}
            />
          </LocalizationProvider>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={vacationDraft.allDay}
              onChange={(e) => setVacationDraft({ ...vacationDraft, allDay: e.target.checked })}
            />
            {t('availability.vacations.allDay')}
          </label>
          {!vacationDraft.allDay && (
            <>
              <input
                type="time"
                value={vacationDraft.startTime}
                onChange={(e) => setVacationDraft({ ...vacationDraft, startTime: e.target.value })}
                style={{ width: 90 }}
              />
              <input
                type="time"
                value={vacationDraft.endTime}
                onChange={(e) => setVacationDraft({ ...vacationDraft, endTime: e.target.value })}
                style={{ width: 90 }}
              />
            </>
          )}
          <button
            type="button"
            onClick={saveVacation}
            style={{
              padding: "6px 18px",
              background: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            {vacationDraft.id ? t('availability.buttons.updateVacation') : t('availability.buttons.addVacation')}
          </button>
          {vacationDraft.id && (
            <button
              type="button"
              onClick={() => setVacationDraft({ id: null, title: '', startDate: '', endDate: '', startTime: '09:00', endTime: '13:00', allDay: false })}
              style={{ padding: '6px 18px' }}
            >
              {t('availability.buttons.cancel')}
            </button>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveSchedule();
        }}
      >
        <table
          style={{
            width: "100%",
            marginBottom: 24,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#f7f7f7" }}>
              <th>{t('availability.table.day')}</th>
              <th>{t('availability.table.enabled')}</th>
              <th>{t('availability.table.blocks')}</th>
              <th>{t('availability.table.slotDuration')}</th>
              <th>{t('availability.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {weeklySchedule.map((day, idx) => (
              <tr key={day.weekday}>
                <td>{t(`availability.days.${day.weekday}`)}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => {
                      const updated = [...weeklySchedule];
                      updated[idx].enabled = e.target.checked;
                      if (updated[idx].enabled && (!Array.isArray(updated[idx].blocks) || updated[idx].blocks.length === 0)) {
                        updated[idx].blocks = [{ start: "09:00", end: "17:00" }];
                      }
                      setWeeklySchedule(updated);
                    }}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(Array.isArray(day.blocks) ? day.blocks : []).map((block, bIdx) => (
                      <div key={bIdx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="time"
                          value={block.start}
                          disabled={!day.enabled}
                          onChange={(e) => {
                            const updated = [...weeklySchedule];
                            const blocks = Array.isArray(updated[idx].blocks) ? [...updated[idx].blocks] : [];
                            blocks[bIdx] = { ...blocks[bIdx], start: e.target.value };
                            updated[idx].blocks = blocks;
                            updated[idx].start = blocks[0]?.start || updated[idx].start;
                            setWeeklySchedule(updated);
                          }}
                          style={{ width: 90 }}
                        />
                        <span>—</span>
                        <input
                          type="time"
                          value={block.end}
                          disabled={!day.enabled}
                          onChange={(e) => {
                            const updated = [...weeklySchedule];
                            const blocks = Array.isArray(updated[idx].blocks) ? [...updated[idx].blocks] : [];
                            blocks[bIdx] = { ...blocks[bIdx], end: e.target.value };
                            updated[idx].blocks = blocks;
                            updated[idx].end = blocks[blocks.length - 1]?.end || updated[idx].end;
                            setWeeklySchedule(updated);
                          }}
                          style={{ width: 90 }}
                        />
                        <button
                          type="button"
                          disabled={!day.enabled}
                          onClick={() => {
                            const updated = [...weeklySchedule];
                            const blocks = Array.isArray(updated[idx].blocks) ? [...updated[idx].blocks] : [];
                            blocks.splice(bIdx, 1);
                            updated[idx].blocks = blocks;
                            updated[idx].start = blocks[0]?.start || updated[idx].start;
                            updated[idx].end = blocks[blocks.length - 1]?.end || updated[idx].end;
                            setWeeklySchedule(updated);
                          }}
                          style={{ padding: '2px 8px' }}
                        >
                          {t('availability.buttons.removeBlock')}
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={!day.enabled}
                      onClick={() => {
                        const updated = [...weeklySchedule];
                        const blocks = Array.isArray(updated[idx].blocks) ? [...updated[idx].blocks] : [];
                        const lastEnd = blocks[blocks.length - 1]?.end || '13:00';
                        blocks.push({ start: lastEnd, end: '17:00' });
                        updated[idx].blocks = blocks;
                        updated[idx].start = blocks[0]?.start || updated[idx].start;
                        updated[idx].end = blocks[blocks.length - 1]?.end || updated[idx].end;
                        setWeeklySchedule(updated);
                      }}
                      style={{ width: 'fit-content' }}
                    >
                      {t('availability.buttons.addBlock')}
                    </button>
                  </div>
                </td>
                <td>
                  <select
                    value={day.slotDuration}
                    disabled={!day.enabled}
                    onChange={(e) => {
                      const updated = [...weeklySchedule];
                      updated[idx].slotDuration = parseInt(e.target.value, 10);
                      setWeeklySchedule(updated);
                    }}
                    style={{ width: 80 }}
                  >
                    {[15, 20, 30, 45, 60].map((dur) => (
                      <option key={dur} value={dur}>
                        {dur} {t('availability.units.minutesShort')}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => {
                      const src = weeklySchedule[idx];
                      setWeeklySchedule((prev) =>
                        prev.map((d) => {
                          if (d.weekday === src.weekday) return d;
                          return {
                            ...d,
                            enabled: true,
                            slotDuration: src.slotDuration,
                            blocks: Array.isArray(src.blocks) ? src.blocks.map((b) => ({ ...b })) : [],
                            start: src.start,
                            end: src.end,
                          };
                        })
                      );
                    }}
                    style={{ padding: '6px 10px' }}
                  >
                    {t('availability.buttons.copyToAll')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: "center", display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            type="submit"
            style={{
              padding: "8px 24px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            {t('availability.buttons.saveSchedule')}
          </button>
          <button
            type="button"
            onClick={clearAllSchedule}
            style={{
              padding: "8px 24px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
            }}
          >
            {t('availability.buttons.clearAllSchedule')}
          </button>
        </div>
      </form>

      {/* Clear Schedule Confirmation Modal */}
      {showClearConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#dc2626' }}>
              {t('availability.confirmDialog.title')}
            </h3>
            <p style={{ marginBottom: '24px', color: '#374151' }}>
              {t('availability.confirmDialog.message')}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={cancelClearSchedule}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {t('availability.buttons.cancel')}
              </button>
              <button
                onClick={confirmClearSchedule}
                style={{
                  padding: '10px 20px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {t('availability.buttons.yesClearAll')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
