"use client";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);
  const [lat, setLat] = useState<number>(0);
  const [lng, setLng] = useState<number>(0);
  const [locationName, setLocationName] = useState<string>("over the ocean");
  const [distanceToDhaka, setDistanceToDhaka] = useState<number | null>(null);
  const [issData, setIssData] = useState<any>({});

  useEffect(() => {
    import("leaflet").then((L) => {
      if (!map.current && mapContainer.current) {
        map.current = L.map(mapContainer.current).setView([lat, lng], 2);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map.current);

        marker.current = L.circleMarker([lat, lng], {
          radius: 10,
          color: "red",
          fillColor: "#f03",
          fillOpacity: 1,
        }).addTo(map.current);

        marker.current.bindPopup(
          `<b>${locationName}</b><br>Latitude: ${lat.toFixed(2)}<br>Longitude: ${lng.toFixed(2)}`,
        );
      }
    });
  }, [lat, lng, locationName]);

  useEffect(() => {
    const fetchISSLocation = async () => {
      try {
        const res = await axios.get(
          "https://api.wheretheiss.at/v1/satellites/25544",
        );
        const data = res.data;
        const { latitude, longitude } = data;

        setLat(latitude);
        setLng(longitude);
        setIssData(data);

        const locationRes = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        );
        const display_name = locationRes.data.display_name || "over the ocean";
        setLocationName(display_name);

        const dhakaRes = await axios.get(
          `https://nominatim.openstreetmap.org/search?city=Dhaka&format=jsonv2`,
        );
        const dhakaLat = parseFloat(dhakaRes.data[0].lat);
        const dhakaLon = parseFloat(dhakaRes.data[0].lon);

        const distance = calculateDistance(
          latitude,
          longitude,
          dhakaLat,
          dhakaLon,
        );
        setDistanceToDhaka(distance);

        if (map.current && marker.current) {
          map.current.setView([latitude, longitude]);
          marker.current.setLatLng([latitude, longitude]);
          marker.current.bindPopup(
            `<b>${display_name}</b><br>Latitude: ${latitude.toFixed(2)}<br>Longitude: ${longitude.toFixed(2)}`,
          );
        }
      } catch (error) {
        console.error("Error fetching ISS location:", error);
      }
    };

    fetchISSLocation();
    const interval = setInterval(fetchISSLocation, 5000);

    return () => clearInterval(interval);
  }, []);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen p-4">
      <h3 className="text-2xl mb-4 font-bold text-right">
        Live informations about the ISS
      </h3>
      <div
        ref={mapContainer}
        id="map-container"
        className="w-full h-full max-w-screen max-h-screen rounded"
        style={{ height: "80vh" }}
      />
      {distanceToDhaka !== null && (
        <p className="mt-4 text-right">
          Distance from ISS to Dhaka: {distanceToDhaka.toFixed(2)} kilometers
        </p>
      )}
      <div className="mt-4 text-right">
        <p>Latitude: {lat.toFixed(2)}</p>
        <p>Longitude: {lng.toFixed(2)}</p>
        <p>Altitude: {issData.altitude?.toFixed(2)} km</p>
        <p>Velocity: {issData.velocity?.toFixed(2)} km/h</p>
        <p>Visibility: {issData.visibility}</p>
        <p>Footprint: {issData.footprint?.toFixed(2)} km</p>
        <p>
          Current Time: {new Date(issData.timestamp * 1000).toLocaleString()}
        </p>
      </div>
      Made by{" "}
      <a
        href="https://www.instagram.com/mvhikhn/"
        className="underline text-white hover:text-red-500"
        style={{ color: "white" }}
      >
        @mvhikhn
      </a>
    </div>
  );
}
