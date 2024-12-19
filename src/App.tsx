import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';

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

interface Facility {
  id: string;
  name: string;
  childFacilities: Facility[];
  positions: Position[];
}

interface Position {
  id: string;
  name: string;
  transceiverIds: string[];
}

interface Artcc {
  id: string;
  facility: Facility;
  positions: Position[];
  transceivers: Transceiver[];
}

const App: React.FC = () => {
  const [artccs, setArtccs] = useState<Artcc[]>([]);
  const [selectedArtcc, setSelectedArtcc] = useState<Artcc | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [filteredTransceivers, setFilteredTransceivers] = useState<Transceiver[]>([]);
  const [circleRadius, setCircleRadius] = useState<number>(5000);
  const [actualRange, setActualRange] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/artccs/')
      .then(response => response.json())
      .then(data => setArtccs(data));
  }, []);

  const gatherAllFacilities = (facility: Facility): Facility[] => {
    let facilities = [facility];
    facility.childFacilities.forEach(child => {
      facilities = facilities.concat(gatherAllFacilities(child));
    });
    return facilities;
  };

  const handleArtccChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const artccId = e.target.value;
    const artcc = artccs.find(a => a.id === artccId);
    setSelectedArtcc(artcc || null);
    setSelectedFacility(null);
    setSelectedPosition(null);
    setFilteredTransceivers([]);
  };

  const handleFacilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const facilityId = e.target.value;
    const facility = selectedArtcc ? gatherAllFacilities(selectedArtcc.facility).find(f => f.id === facilityId) : null;
    setSelectedFacility(facility || null);
    setSelectedPosition(null);
    if (facility) {
      const allTransceivers = selectedArtcc?.transceivers.filter(t =>
        facility.positions.some(p => p.transceiverIds.includes(t.id))
      ) || [];
      setFilteredTransceivers(allTransceivers);
    } else {
      setFilteredTransceivers([]);
    }
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const positionId = e.target.value;
    if (positionId === "ALL_TRANSCEIVERS") {
      setSelectedPosition(null);
      const allTransceivers = selectedArtcc?.transceivers.filter(t =>
        selectedFacility?.positions.some(p => p.transceiverIds.includes(t.id))
      ) || [];
      setFilteredTransceivers(allTransceivers);
    } else {
      const position = selectedFacility?.positions.find(p => p.id === positionId) || null;
      setSelectedPosition(position);

      if (position) {
        const transceivers = selectedArtcc?.transceivers.filter(t =>
          position.transceiverIds.includes(t.id)
        ) || [];
        setFilteredTransceivers(transceivers);
      } else {
        setFilteredTransceivers([]);
      }
    }
  };

  const toggleActualRange = () => {
    setActualRange(!actualRange);
    if (!actualRange) {
      setCircleRadius(5000); // Reset circle radius to default
    }
  };

  const calculateCircleRadius = (heightMslMeters: number): number => {
    const heightMslFeet = heightMslMeters * 3.28084;
    return (1.375 * Math.sqrt(heightMslFeet)) * 1852;
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCircleRadius(Number(e.target.value));
  };

  const mapCenter: LatLngTuple = filteredTransceivers.length > 0
    ? [filteredTransceivers[0].location.lat, filteredTransceivers[0].location.lon] as LatLngTuple
    : [37.7749, -122.4194];

  return (
    <div style={{ textAlign: 'center', width: '100vw' }}>
      <h1>ARTCC Transceiver Map</h1>
      <div>
        <select onChange={handleArtccChange}>
          <option value="">Select ARTCC</option>
          {artccs.map(artcc => (
            <option key={artcc.id} value={artcc.id}>
              {artcc.id}
            </option>
          ))}
        </select>

        {selectedArtcc && (
          <select onChange={handleFacilityChange}>
            <option value="">Select Facility</option>
            {gatherAllFacilities(selectedArtcc.facility).map(facility => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        )}

        {selectedFacility && (
          <select onChange={handlePositionChange} defaultValue="ALL_TRANSCEIVERS">
            <option value="ALL_TRANSCEIVERS">ALL TRANSCEIVERS</option>
            {selectedFacility.positions.map(position => (
              <option key={position.id} value={position.id}>
                {position.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div>
        <label htmlFor="radiusSlider">Range at : </label>
        <input
          id="radiusSlider"
          type="range"
          min="0"
          max="30000"
          step="100"
          value={circleRadius}
          onChange={handleRadiusChange}
          disabled={actualRange}
        />
        <span>{circleRadius} MSL</span>
        <label>
          <input
            type="checkbox"
            checked={actualRange}
            onChange={toggleActualRange}
          />
          Actual Range
        </label>
      </div>

      {filteredTransceivers.length > 0 && (
        <div style={{ height: '80vh', width: '100%' }}>
          <MapContainer center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredTransceivers.map(transceiver => {
              const radius = actualRange
                ? calculateCircleRadius(transceiver.heightMslMeters)
                : (1.375 * Math.sqrt(circleRadius)) * 1852;

              const positionsUsingTransceiver = selectedFacility?.positions.filter(p =>
                p.transceiverIds.includes(transceiver.id)
              ) || [];

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
                      Height AGL: {transceiver.heightAglMeters} meters<br />
                      <strong>Positions in this facility<br></br>using this transceiver:</strong>
                      <ul>
                        {positionsUsingTransceiver.map(position => (
                          <li key={position.id}>{position.name}</li>
                        ))}
                      </ul>
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
