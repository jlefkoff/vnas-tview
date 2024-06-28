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

  useEffect(() => {
    fetch('http://localhost:3000/api/artccs/')
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

  // Determine the center of the map based on the first transceiver of the selected ARTCC
  const mapCenter: LatLngTuple = selectedTransceivers.length > 0
    ? [selectedTransceivers[0].location.lat, selectedTransceivers[0].location.lon] as LatLngTuple
    : [37.7749, -122.4194]; // Default to San Francisco if no ARTCC is selected

  return (
    <div>
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
          onChange={(e) => setCircleRadius(Number(e.target.value))}
        />
        <span>{circleRadius} meters</span>
      </div>

      {selectedTransceivers.length > 0 && (
        <div style={{ height: "80vh", width: "100%" }}>
          <MapContainer center={mapCenter} zoom={8} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedTransceivers.map(transceiver => (
              <Circle
                key={transceiver.id}
                center={[transceiver.location.lat, transceiver.location.lon] as LatLngTuple}
                radius={circleRadius}
              >
                <Popup>
                  <div>
                    <strong>{transceiver.name}</strong><br />
                    Height MSL: {transceiver.heightMslMeters} meters<br />
                    Height AGL: {transceiver.heightAglMeters} meters
                  </div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default App;
