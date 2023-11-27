const express = require('express');
const app = express();
const trainSchedule = require('./trainSchedule'); // Create a file to store the train schedule data

// Define a route to handle the data fetching API with new parameter
app.get('/fetchData', (req, res) => {
  const { FOG, TrainsDelayedOnTrack } = req.query;

  if (!FOG || isNaN(FOG) || FOG < 1 || FOG > 5 || !TrainsDelayedOnTrack || isNaN(TrainsDelayedOnTrack) || TrainsDelayedOnTrack < 0 || TrainsDelayedOnTrack > 100) {
    return res.status(400).json({
      error: 'Invalid parameters. FOG should be between 1 and 5, TrainsDelayedOnTrack should be between 0 and 100.'
    });
  }

  const fogDelay = FOG * 5;
  const trackDelay = 15 * TrainsDelayedOnTrack;

  // Calculate the delay for stations other than the first one
  const firstDepartureTime = trainSchedule[0].Departs === 'End' ? 'End' : trainSchedule[0].Departs;
  const modifiedSchedule = trainSchedule.map((station, index) => {
    if (index === 0) {
      return station;
    }

    const arrivalDelay = station.Arrives === 'Start' ? 0 : fogDelay;
    const departureDelay = station.Departs === 'End' ? 0 : fogDelay;

    const newDepartureTime = index === 1 ? firstDepartureTime : addMinutes(station.Departs, departureDelay + trackDelay);

    return {
      ...station,
      Arrives: station.Arrives === 'Start' ? station.Arrives : addMinutes(station.Arrives, arrivalDelay + trackDelay),
      Departs: newDepartureTime
    };
  });

  res.json(modifiedSchedule);
});

// Helper function to add minutes to a time string (e.g., '05:50')
function addMinutes(timeString, minutes) {
  if (timeString === 'End') {
    return 'End';
  }

  const [hours, minutesStr] = timeString.split(':').map(parseFloat);
  const totalMinutes = hours * 60 + minutesStr + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
