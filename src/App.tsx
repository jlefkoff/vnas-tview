import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet'; // Import LatLngTuple for type safety

interface Location {
  lat: number;
  lon: number;
}

interface Transceiver {
  id: string;
  name: string;
  location: Location;
  heightMslMeters: number;
  heightAglMeters: number;
}

interface Artcc {
  id: string;
  transceivers: Transceiver[];
}

const App: React.FC = () => {
  const [artccs, setArtccs] = useState<Artcc[]>([]);
  const [selectedTransceivers, setSelectedTransceivers] = useState<Transceiver[]>([]);
  const [circleRadius, setCircleRadius] = useState<number>(5000); // Default radius in meters
  const [actualRange, setActualRange] = useState<boolean>(false); // State for actual range checkbox

  useEffect(() => {
    fetch('/api/artccs/')
      .then(response => response.json())
      .then(data => setArtccs(data));
  }, []);

  const handleArtccChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const artccId = e.target.value;

    const artcc = artccs.find(a => a.id === artccId);
    if (artcc) {
      setSelectedTransceivers(artcc.transceivers);
    }
  };

  const toggleActualRange = () => {
    setActualRange(!actualRange);
    if (actualRange) {
      setCircleRadius(5000); // Reset circle radius to default when switching back from actual range
    }
  };

  const calculateCircleRadius = (heightMslMeters: number): number => {
    // Convert height from meters to feet
    const heightMslFeet = heightMslMeters * 3.28084;
    // Calculate radius based on the formula: 1.375 * sqrt(height in feet) from nm to meters
    return (1.375 * Math.sqrt(heightMslFeet)) * 1852;
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCircleRadius(Number(e.target.value));
  };

  // Determine the center of the map based on the first transceiver of the selected ARTCC
  const mapCenter: LatLngTuple = selectedTransceivers.length > 0
    ? [selectedTransceivers[0].location.lat, selectedTransceivers[0].location.lon] as LatLngTuple
    : [37.7749, -122.4194]; // Default to San Francisco if no ARTCC is selected

  return (
    <div style={{ textAlign: 'center' , width: "100vw"}}>
      <h1>ARTCC Transceiver Map</h1>
      <div>
        <label>Select ARTCC: </label>
        <select onChange={handleArtccChange}>
          <option value="">Select ARTCC</option>
          {artccs.map(artcc => (
            <option key={artcc.id} value={artcc.id}>{artcc.id}</option>
          ))}
        </select>
        <label htmlFor="radiusSlider">Circle Radius: </label>
        <input
          id="radiusSlider"
          type="range"
          min="1000"
          max="50000"
          step="1000"
          value={circleRadius}
          onChange={handleRadiusChange}
          disabled={actualRange}
        />
        <span>{circleRadius} meters</span>
        <label>
          <input
            type="checkbox"
            checked={actualRange}
            onChange={toggleActualRange}
          />
          Actual Range
        </label>
      </div>

      {selectedTransceivers.length > 0 && (
        <div style={{ height: '80vh', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <MapContainer center={mapCenter} zoom={8} style={{ height: '100%', width: '100%', maxWidth: '100vw' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedTransceivers.map(transceiver => {
              const radius = actualRange
                ? calculateCircleRadius(transceiver.heightMslMeters)
                : circleRadius;

              return (
                <Circle
                  key={transceiver.id}
                  center={[transceiver.location.lat, transceiver.location.lon] as LatLngTuple}
                  radius={radius}
                >
                  <Popup>
                    <div>
                      <strong>{transceiver.name}</strong><br />
                      Height MSL: {transceiver.heightMslMeters} meters<br />
                      Height AGL: {transceiver.heightAglMeters} meters
                    </div>
                  </Popup>
                </Circle>
              );
            })}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default App;
