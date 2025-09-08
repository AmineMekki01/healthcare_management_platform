import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from 'react-i18next';
import axios from "../../../components/axiosConfig";
import { AuthContext } from "./../../../features/auth/context/AuthContext";

function getWeeksInMonth(year, month) {
  const weeks = [];
  const firstDay = new Date(year, month, 1);
  let start = new Date(firstDay);
  while (start.getMonth() === month) {
    const end = new Date(start);
    end.setDate(start.getDate() + 6 - start.getDay());
    weeks.push({
      label: `Week of ${start.toLocaleDateString()}`,
      start: new Date(start),
      end: new Date(end),
    });
    start.setDate(start.getDate() + 7 - start.getDay());
  }
  return weeks;
}

export default function DoctorAvailabilitySettings() {
  const { t } = useTranslation('settings');
  const { userId } = useContext(AuthContext);
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [weeks, setWeeks] = useState(
    getWeeksInMonth(today.getFullYear(), today.getMonth())
  );
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  const defaultSchedule = [
    { weekday: "Monday", enabled: true, start: "09:00", end: "17:00", slotDuration: 30 },
    { weekday: "Tuesday", enabled: true, start: "09:00", end: "17:00", slotDuration: 30 },
    { weekday: "Wednesday", enabled: true, start: "09:00", end: "17:00", slotDuration: 30 },
    { weekday: "Thursday", enabled: true, start: "09:00", end: "17:00", slotDuration: 30 },
    { weekday: "Friday", enabled: true, start: "09:00", end: "17:00", slotDuration: 30 },
    { weekday: "Saturday", enabled: false, start: "09:00", end: "17:00", slotDuration: 30 },
    { weekday: "Sunday", enabled: false, start: "09:00", end: "17:00", slotDuration: 30 },
  ];

  const [weeklySchedule, setWeeklySchedule] = useState(defaultSchedule);
  const [exceptions, setExceptions] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [newException, setNewException] = useState({
    date: "",
    startTime: "",
    endTime: "",
    type: "off",
  });


  useEffect(() => {
    setWeeks(getWeeksInMonth(selectedYear, selectedMonth));
    setSelectedWeekIdx(0);
  }, [selectedMonth, selectedYear]);




  useEffect(() => {
    if (!userId || !weeks[selectedWeekIdx]) return;
    const range = weeks[selectedWeekIdx];
    const qs = `start=${range.start.toISOString().slice(0,10)}&end=${range.end.toISOString().slice(0,10)}`;
    axios
      .get(`/api/v1/doctors/${userId}/weekly_schedule?${qs}`)
      .then((res) => {
        if (res.data && Array.isArray(res.data.weeklySchedule)) {
          console.log("Weekly schedule fetched:", res.data.weeklySchedule);
          setWeeklySchedule(res.data.weeklySchedule);
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
        })));
      });
  }, [userId, weeks, selectedWeekIdx]);

  const saveSchedule = () => {
    const range = weeks[selectedWeekIdx];
    console.log("weeklySchedule : ", weeklySchedule);
    const qs = `start=${range.start.toISOString().slice(0,10)}&end=${range.end.toISOString().slice(0,10)}`;
    axios
      .post(`/api/v1/doctors/availabilities/${userId}?${qs}`, weeklySchedule)
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

  const addException = () => {
    axios
      .post(`/api/v1/doctors/${userId}/exceptions`, newException)
      .then(() => {
        setExceptions([...exceptions, newException]);
        setNewException({ date: "", startTime: "", endTime: "", type: "off" });
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
              {new Date(selectedYear, i).toLocaleString("default", {
                month: "long",
              })}
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
              <th>{t('availability.table.start')}</th>
              <th>{t('availability.table.end')}</th>
              <th>{t('availability.table.slotDuration')}</th>
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
                      setWeeklySchedule(updated);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={day.start}
                    disabled={!day.enabled}
                    onChange={(e) => {
                      const updated = [...weeklySchedule];
                      updated[idx].start = e.target.value;
                      setWeeklySchedule(updated);
                    }}
                    style={{ width: 90 }}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={day.end}
                    disabled={!day.enabled}
                    onChange={(e) => {
                      const updated = [...weeklySchedule];
                      updated[idx].end = e.target.value;
                      setWeeklySchedule(updated);
                    }}
                    style={{ width: 90 }}
                  />
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
                        {dur} min
                      </option>
                    ))}
                  </select>
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

      <div style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 12 }}>{t('availability.exceptions.title')}</h3>
        {(() => {
          const weekStart = weeks[selectedWeekIdx]?.start;
          const weekEnd = weeks[selectedWeekIdx]?.end;
          const filteredExceptions = exceptions.filter((exc) => {
            const excDate = new Date(exc.date);
            return (
              weekStart && weekEnd && excDate >= weekStart && excDate <= weekEnd
            );
          });
          return (
            <ul style={{ marginBottom: 16 }}>
              {filteredExceptions.length === 0 && (
                <li style={{ color: "#888" }}>
                  {t('availability.exceptions.noExceptions')}
                </li>
              )}
              {filteredExceptions.map((exc, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{exc.date}</span> &mdash;{" "}
                  {exc.type}
                  {exc.startTime && exc.endTime && (
                    <>
                      {" "}
                      ({exc.startTime} - {exc.endTime})
                    </>
                  )}
                </li>
              ))}
            </ul>
          );
        })()}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addException();
          }}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="date"
            value={newException.date}
            onChange={(e) =>
              setNewException({ ...newException, date: e.target.value })
            }
            required
            style={{ width: 130 }}
          />
          <input
            type="time"
            value={newException.startTime}
            onChange={(e) =>
              setNewException({ ...newException, startTime: e.target.value })
            }
            style={{ width: 90 }}
          />
          <input
            type="time"
            value={newException.endTime}
            onChange={(e) =>
              setNewException({ ...newException, endTime: e.target.value })
            }
            style={{ width: 90 }}
          />
          <select
            value={newException.type}
            onChange={(e) =>
              setNewException({ ...newException, type: e.target.value })
            }
            style={{ width: 110 }}
          >
            <option value="off">{t('availability.exceptions.timeOff')}</option>
            <option value="override">{t('availability.exceptions.override')}</option>
          </select>
          <button
            type="submit"
            style={{
              padding: "6px 18px",
              background: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 500,
            }}
          >
            {t('availability.buttons.addException')}
          </button>
        </form>
      </div>

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
