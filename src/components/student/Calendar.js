import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { collection, query, where, getDocs, doc, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Bell, Calendar as CalendarIcon, Clock, MapPin, Briefcase } from 'react-feather';

const localizer = momentLocalizer(moment);

const StudentCalendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    start: new Date(),
    end: new Date(),
    notes: '',
    type: 'personal'
  });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [filter, setFilter] = useState('all'); // 'all', 'application', 'interview', 'deadline', 'personal'

  // Fetch events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const userId = auth.currentUser.uid;

        // Fetch student profile
        const studentDoc = await getDoc(doc(db, 'students', userId));
        if (!studentDoc.exists()) {
          throw new Error('Student profile not found');
        }
        const studentData = studentDoc.data();
        const studentDepartment = studentData.department;
        const studentBatch = studentData.batch;

        // Fetch job applications
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('studentId', '==', userId)
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const appliedJobIds = applicationsSnapshot.docs.map(doc => doc.data().jobId);

        // Fetch events
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const eligibleEvents = [];

        for (const eventDoc of eventsSnapshot.docs) {
          const event = eventDoc.data();
          const eventData = {
            id: eventDoc.id,
            title: event.title,
            start: event.start.toDate ? event.start.toDate() : new Date(event.start),
            end: event.end.toDate ? event.end.toDate() : new Date(event.end),
            location: event.location || '',
            notes: event.notes || '',
            type: event.type || 'custom',
            color: event.color || '#4CAF50',
            targetAudience: event.targetAudience || 'all',
            eligibleDepartments: event.eligibleDepartments || [],
            eligibleBatch: event.eligibleBatch || [],
            selectedJobs: event.selectedJobs || [],
            allDay: event.allDay || false,
            jobId: event.jobId
          };

          // Check eligibility
          let isEligible = false;
          if (eventData.targetAudience === 'all') {
            isEligible = true;
          } else if (eventData.targetAudience === 'specific') {
            const deptMatch = eventData.eligibleDepartments.length === 0 || eventData.eligibleDepartments.includes(studentDepartment);
            const batchMatch = eventData.eligibleBatch.length === 0 || eventData.eligibleBatch.includes(studentBatch);
            isEligible = deptMatch && batchMatch;
          } else if (eventData.targetAudience === 'job') {
            isEligible = eventData.selectedJobs.includes('all') || eventData.selectedJobs.some(jobId => appliedJobIds.includes(jobId));
          }

          if (isEligible) {
            eligibleEvents.push(eventData);
          }
        }

        // Fetch personal reminders
        const remindersQuery = query(
          collection(db, 'reminders'),
          where('userId', '==', userId)
        );
        const remindersSnapshot = await getDocs(remindersQuery);
        const reminderEvents = remindersSnapshot.docs.map(doc => {
          const reminder = doc.data();
          return {
            id: doc.id,
            title: reminder.title,
            start: reminder.start.toDate(),
            end: reminder.end.toDate(),
            notes: reminder.notes,
            type: 'personal',
            color: '#9C27B0'
          };
        });

        // Combine all events
        setEvents([...eligibleEvents, ...reminderEvents]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load calendar events');
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchEvents();
    }
  }, []);

  // Handle event selection
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Handle adding a new reminder
  const handleAddReminder = async () => {
    try {
      if (!newReminder.title) {
        toast.error('Please enter a title for your reminder');
        return;
      }
      if (newReminder.end < newReminder.start) {
        toast.error('End date cannot be before start date');
        return;
      }

      const userId = auth.currentUser.uid;
      const reminderData = {
        userId,
        title: newReminder.title,
        start: newReminder.start,
        end: newReminder.end,
        notes: newReminder.notes,
        type: 'personal',
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'reminders'), reminderData);
      setEvents([...events, {
        id: docRef.id,
        title: newReminder.title,
        start: newReminder.start,
        end: newReminder.end,
        notes: newReminder.notes,
        type: 'personal',
        color: '#9C27B0'
      }]);

      setNewReminder({
        title: '',
        start: new Date(),
        end: new Date(),
        notes: '',
        type: 'personal'
      });
      setShowAddReminderModal(false);
      toast.success('Reminder added successfully');
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast.error('Failed to add reminder');
    }
  };

  // Handle deleting an event
  const handleDeleteEvent = async () => {
    try {
      if (!selectedEvent) return;
      if (selectedEvent.type === 'personal') {
        await deleteDoc(doc(db, 'reminders', selectedEvent.id));
        setEvents(events.filter(event => event.id !== selectedEvent.id));
        toast.success('Reminder deleted successfully');
      } else {
        toast.error('You can only delete personal reminders');
      }
      setShowEventModal(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete reminder');
    }
  };

  // Filter events based on selected filter
  const filteredEvents = filter === 'all'
    ? events
    : events.filter(event => event.type === filter);

  // Export calendar to Google/Outlook
  const exportToCalendar = (type) => {
    try {
      let icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Placement Forms//Calendar//EN'
      ];

      filteredEvents.forEach(event => {
        const startDate = moment(event.start).format('YYYYMMDD[T]HHmmss');
        const endDate = moment(event.end).format('YYYYMMDD[T]HHmmss');
        icalContent = [
          ...icalContent,
          'BEGIN:VEVENT',
          `SUMMARY:${event.title}`,
          `DTSTART:${startDate}`,
          `DTEND:${endDate}`,
          `DESCRIPTION:${event.notes || ''}`,
          event.location ? `LOCATION:${event.location}` : '',
          'END:VEVENT'
        ];
      });

      icalContent.push('END:VCALENDAR');
      const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'placement_calendar_form.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success(`Calendar exported to ${type}`);
    } catch (error) {
      console.error('Error exporting calendar:', error);
      toast.error('Failed to export calendar');
      console.log(error);
    }
  };

  // Custom event styling
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color || '#3174ad',
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Placement Calendar</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddReminderModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Bell size={16} className="mr-2" />
            Add Reminder
          </button>
          <div className="relative">
            <button
              onClick={() => document.getElementById('exportDropdown').classList.toggle('hidden')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <CalendarIcon size={16} className="mr-2" />
              Export Calendar
            </button>
            <div id="exportDropdown" className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden">
              <button
                onClick={() => exportToCalendar('Google Calendar')}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Google Calendar
              </button>
              <button
                onClick={() => exportToCalendar('Outlook')}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Outlook Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter options */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          All Events
        </button>
        <button
          onClick={() => setFilter('company-visit')}
          className={`px-3 py-1 rounded-full text-sm ${filter === 'company-visit' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
        >
          Company Visits
        </button>
        <button
          onClick={() => setFilter('pre-placement-talk')}
          className={`px-3 py-1 rounded-full text-sm ${filter === 'pre-placement-talk' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'}`}
        >
          Pre-Placement Talks
        </button>
        <button
          onClick={() => setFilter('deadline')}
          className={`px-3 py-1 rounded-full text-sm ${filter === 'deadline' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-800'}`}
        >
          Deadlines
        </button>
        <button
          onClick={() => setFilter('personal')}
          className={`px-3 py-1 rounded-full text-sm ${filter === 'personal' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'}`}
        >
          Personal Reminders
        </button>
      </div>

      {/* Calendar view */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded-full text-sm ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded-full text-sm ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded-full text-sm ${view === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Day
            </button>
            <button
              onClick={() => setView('agenda')}
              className={`px-3 py-1 rounded-full text-sm ${view === 'agenda' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Agenda
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDate(new Date())}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => {
                const newDate = new Date(date);
                newDate.setMonth(newDate.getMonth() - 1);
                setDate(newDate);
              }}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              &lt;
            </button>
            <button
              onClick={() => {
                const newDate = new Date(date);
                newDate.setMonth(newDate.getMonth() + 1);
                setDate(newDate);
              }}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              &gt;
            </button>
            <span className="text-lg font-medium">
              {moment(date).format('MMMM YYYY')}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              popup
            />
          </div>
        )}
      </div>

      {/* Event details modal */}
      {selectedEvent && showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{selectedEvent.title}</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Clock size={18} className="mr-3 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p>
                      {moment(selectedEvent.start).format('MMM D, YYYY')}
                      {!selectedEvent.allDay && (
                        <> • {moment(selectedEvent.start).format('h:mm A')} - {moment(selectedEvent.end).format('h:mm A')}</>
                      )}
                    </p>
                  </div>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-start">
                    <MapPin size={18} className="mr-3 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p>{selectedEvent.location}</p>
                    </div>
                  </div>
                )}
                {selectedEvent.notes && (
                  <div className="flex items-start">
                    <div className="mr-3 text-gray-500 mt-1">📝</div>
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p>{selectedEvent.notes}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start">
                  <Briefcase size={18} className="mr-3 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Event Type</p>
                    <p className="capitalize">{selectedEvent.type.replace(/-/g, ' ')}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="mr-3 text-gray-500 mt-1">🎯</div>
                  <div>
                    <p className="text-sm text-gray-500">Target Audience</p>
                    <p>
                      {selectedEvent.targetAudience === 'all' ? 'All Students' :
                       selectedEvent.targetAudience === 'specific' ? `Specific: ${selectedEvent.eligibleDepartments?.join(', ') || 'All Departments'} (${selectedEvent.eligibleBatch?.join(', ') || 'All Batches'})` :
                       `Job-Specific: ${selectedEvent.selectedJobs?.join(', ') || 'All Jobs'}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                {selectedEvent.type === 'personal' && (
                  <button
                    onClick={handleDeleteEvent}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
                {selectedEvent.jobId && (
                  <button
                    onClick={() => {
                      window.location.href = `/student/job/${selectedEvent.jobId}`;
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Job Details
                  </button>
                )}
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add reminder modal */}
      {showAddReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Add Reminder</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter reminder title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                  <DatePicker
                    selected={newReminder.start}
                    onChange={(date) => setNewReminder({ ...newReminder, start: date })}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                  <DatePicker
                    selected={newReminder.end}
                    onChange={(date) => setNewReminder({ ...newReminder, end: date })}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={newReminder.notes}
                    onChange={(e) => setNewReminder({ ...newReminder, notes: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Add any notes or details"
                  ></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddReminderModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReminder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCalendar;