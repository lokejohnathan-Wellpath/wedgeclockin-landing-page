"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CompanyRecord = {
  id: string;
  companyName: string;
  registrationNumber?: string;
  outletShortName?: string;
  phone?: string;
  address?: string;
  workplaceAddress?: string;
  workplaceLatitude?: number | null;
  workplaceLongitude?: number | null;
  allowedRadiusMeters?: number | null;
};

type LocationState = {
  address: string;
  latitude: string;
  longitude: string;
  radius: string;
};

type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name: string;
};

type NominatimReverseResult = {
  display_name?: string;
};

const radiusOptions = [25, 50, 100, 200];

function parseCoordinate(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRadius(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5000
    ? parsed
    : null;
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

function mapPreviewUrl(latitude: number, longitude: number) {
  const delta = 0.0035;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ]
    .map((value) => value.toFixed(6))
    .join("%2C");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude.toFixed(
    6,
  )}%2C${longitude.toFixed(6)}`;
}


async function searchMalaysiaAddress(
  address: string,
): Promise<NominatimSearchResult | null> {
  const query = address.trim();

  if (query.length < 6) {
    return null;
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "my");
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Address lookup service is unavailable.");
  }

  const data = (await response.json()) as NominatimSearchResult[];
  return data[0] || null;
}

async function reverseGeocodeMalaysia(
  latitude: number,
  longitude: number,
): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return "";
  }

  const data = (await response.json()) as NominatimReverseResult;
  return data.display_name?.trim() || "";
}

export default function WorkplaceGpsPage() {
  const router = useRouter();

  const [company, setCompany] = useState<CompanyRecord | null>(null);
  const [location, setLocation] = useState<LocationState>({
    address: "",
    latitude: "",
    longitude: "",
    radius: "50",
  });

  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const latitude = useMemo(
    () => parseCoordinate(location.latitude),
    [location.latitude],
  );

  const longitude = useMemo(
    () => parseCoordinate(location.longitude),
    [location.longitude],
  );

  const radius = useMemo(
    () => parseRadius(location.radius),
    [location.radius],
  );

  const coordinatesValid =
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  const mapUrl =
    coordinatesValid && latitude !== null && longitude !== null
      ? mapPreviewUrl(latitude, longitude)
      : "";

  const gpsConfigured =
    company?.workplaceLatitude !== null &&
    company?.workplaceLatitude !== undefined &&
    company?.workplaceLongitude !== null &&
    company?.workplaceLongitude !== undefined;

  useEffect(() => {
    async function loadCompany() {
      const token = localStorage.getItem("wc_manager_token");
      const companyId = localStorage.getItem("wc_company_id");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!token) {
        router.push("/manager-login");
        return;
      }

      if (!companyId || !apiBaseUrl) {
        setError("Company session or API service is unavailable.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/companies?companyId=${encodeURIComponent(
            companyId,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Company settings could not be loaded.",
          );
        }

        const companies: CompanyRecord[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.companies)
            ? data.companies
            : data?.company
              ? [data.company]
              : [];

        const matchedCompany = companies.find((item) => item.id === companyId);

        if (!matchedCompany) {
          throw new Error(
            "The authenticated company record could not be found. Please log in again.",
          );
        }

        setCompany(matchedCompany);
        setLocation({
          address: matchedCompany.workplaceAddress || "",
          latitude:
            matchedCompany.workplaceLatitude !== null &&
            matchedCompany.workplaceLatitude !== undefined
              ? String(matchedCompany.workplaceLatitude)
              : "",
          longitude:
            matchedCompany.workplaceLongitude !== null &&
            matchedCompany.workplaceLongitude !== undefined
              ? String(matchedCompany.workplaceLongitude)
              : "",
          radius: String(matchedCompany.allowedRadiusMeters || 50),
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Company settings could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadCompany();
  }, [router]);

  function updateLocation<Key extends keyof LocationState>(
    key: Key,
    value: LocationState[Key],
  ) {
    setLocation((current) => ({ ...current, [key]: value }));
    setError("");
    setMessage("");
  }

  async function findAddressOnMap() {
    const address = location.address.trim();

    if (address.length < 6) {
      setError("Enter a more complete workplace address.");
      return;
    }

    setIsSearchingAddress(true);
    setError("");
    setMessage("");

    try {
      const result = await searchMalaysiaAddress(address);

      if (!result) {
        setError(
          "The address could not be found in Malaysia. Add the street, area, city and postcode, then try again.",
        );
        return;
      }

      const resultLatitude = Number(result.lat);
      const resultLongitude = Number(result.lon);

      if (
        !Number.isFinite(resultLatitude) ||
        !Number.isFinite(resultLongitude)
      ) {
        throw new Error("The address service returned invalid coordinates.");
      }

      setLocation((current) => ({
        ...current,
        address: result.display_name || current.address,
        latitude: formatCoordinate(resultLatitude),
        longitude: formatCoordinate(resultLongitude),
      }));

      setAccuracyMeters(null);
      setMessage("Address found. Confirm the map pin before saving.");
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "Address lookup failed.",
      );
    } finally {
      setIsSearchingAddress(false);
    }
  }

  function detectCurrentLocation() {
    setError("");
    setMessage("");

    if (!navigator.geolocation) {
      setError("This browser does not support location detection.");
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        setLocation((current) => ({
          ...current,
          latitude: formatCoordinate(latitude),
          longitude: formatCoordinate(longitude),
        }));

        setAccuracyMeters(Math.round(accuracy));

        try {
          const detectedAddress = await reverseGeocodeMalaysia(
            latitude,
            longitude,
          );

          if (detectedAddress) {
            setLocation((current) => ({
              ...current,
              address: detectedAddress,
            }));
          }

          setMessage(
            detectedAddress
              ? "Current location and address detected. Review them before saving."
              : "Current location detected. Enter or confirm the workplace address before saving.",
          );
        } catch {
          setMessage(
            "Current location detected. Enter or confirm the workplace address before saving.",
          );
        } finally {
          setIsDetecting(false);
        }
      },
      (locationError) => {
        let locationMessage = "Current location could not be detected.";

        if (locationError.code === locationError.PERMISSION_DENIED) {
          locationMessage =
            "Location permission was denied. Allow location access in the browser and try again.";
        } else if (locationError.code === locationError.POSITION_UNAVAILABLE) {
          locationMessage =
            "Your current position is unavailable. Move near a window or outdoors and try again.";
        } else if (locationError.code === locationError.TIMEOUT) {
          locationMessage =
            "Location detection timed out. Please try again.";
        }

        setError(locationMessage);
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  async function saveWorkplace() {
    const token = localStorage.getItem("wc_manager_token");
    const companyId = localStorage.getItem("wc_company_id");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!token) {
      router.push("/manager-login");
      return;
    }

    if (!companyId || !apiBaseUrl || !company) {
      setError("Company session or API service is unavailable.");
      return;
    }

    const workplaceAddress = location.address.trim();

    if (workplaceAddress.length < 6) {
      setError("Enter a complete workplace address.");
      return;
    }

    if (!coordinatesValid || latitude === null || longitude === null) {
      setError(
        "Find the workplace address on the map or enter valid coordinates.",
      );
      return;
    }

    if (radius === null) {
      setError("Allowed radius must be between 1 and 5000 metres.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/companies/${encodeURIComponent(companyId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workplaceAddress,
            workplaceLatitude: latitude,
            workplaceLongitude: longitude,
            allowedRadiusMeters: radius,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Workplace GPS settings could not be saved.",
        );
      }

      const updatedCompany: CompanyRecord = data?.company || data;

      setCompany((current) => ({
        ...(current || company),
        ...updatedCompany,
        workplaceAddress,
        workplaceLatitude: latitude,
        workplaceLongitude: longitude,
        allowedRadiusMeters: radius,
      }));

      setMessage("Workplace address and GPS settings saved successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Workplace GPS settings could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/manager-dashboard")}
              className="text-sm font-semibold text-[#d4ad63] hover:underline"
            >
              ← Back to Manager Dashboard
            </button>

            <p className="mt-6 text-sm tracking-[0.35em] text-[#d4ad63]">
              WEDGECLOCKIN
            </p>

            <h1 className="mt-2 text-4xl font-bold text-[#f0dfbd]">
              Workplace GPS
            </h1>

            <p className="mt-2 max-w-2xl text-white/55">
              Set the approved workplace location and attendance radius used
              for employee clock-in validation.
            </p>
          </div>

          <div
            className={`rounded-full border px-5 py-2 text-sm font-semibold ${
              gpsConfigured
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-amber-400/30 bg-amber-400/10 text-amber-200"
            }`}
          >
            {gpsConfigured ? "GPS Configured" : "GPS Not Configured"}
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#1e2428] p-12 text-center text-white/55">
            Loading workplace settings...
          </div>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] border border-white/10 bg-[#1e2428] p-6 sm:p-8">
              <p className="text-sm tracking-[0.25em] text-[#d4ad63]">
                COMPANY
              </p>

              <h2 className="mt-3 text-2xl font-bold text-[#f0dfbd]">
                Workplace settings
              </h2>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <InfoField label="Company Name" value={company?.companyName || "—"} />
                <InfoField label="Company Code" value={company?.outletShortName || "—"} />
                <InfoField label="Registration No." value={company?.registrationNumber || "—"} />
                <InfoField label="Telephone" value={company?.phone || "—"} />
              </div>

              <div className="mt-8 border-t border-white/10 pt-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm tracking-[0.22em] text-[#d4ad63]">
                      LOCATION
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-[#f0dfbd]">
                      Approved workplace
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={detectCurrentLocation}
                    disabled={isDetecting}
                    className="rounded-full border border-[#d4ad63]/50 px-6 py-3 text-sm font-semibold text-[#f0dfbd] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDetecting ? "Detecting Location..." : "Use My Current Location"}
                  </button>
                </div>

                <div className="mt-6">
                  <label>
                    <span className="text-sm text-white/55">
                      Workplace Address
                    </span>

                    <textarea
                      rows={3}
                      value={location.address}
                      onChange={(event) =>
                        updateLocation("address", event.target.value)
                      }
                      placeholder="Example: 41 Jalan Haji Eusoff, 50350 Kuala Lumpur"
                      className={inputClassName}
                    />
                  </label>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-white/35">
                      Enter the street, area, city and postcode, then locate it
                      on the map.
                    </p>

                    <button
                      type="button"
                      onClick={findAddressOnMap}
                      disabled={
                        isSearchingAddress || location.address.trim().length < 6
                      }
                      className="shrink-0 rounded-full border border-[#d4ad63]/45 px-5 py-2.5 text-sm font-semibold text-[#f0dfbd] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSearchingAddress
                        ? "Finding Address..."
                        : "Find Address on Map"}
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Latitude"
                    value={location.latitude}
                    placeholder="Example: 3.139000"
                    onChange={(value) => updateLocation("latitude", value)}
                  />
                  <TextField
                    label="Longitude"
                    value={location.longitude}
                    placeholder="Example: 101.686900"
                    onChange={(value) => updateLocation("longitude", value)}
                  />
                </div>

                <div className="mt-6">
                  <p className="text-sm text-white/55">
                    Allowed attendance radius
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {radiusOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateLocation("radius", String(option))}
                        className={`rounded-2xl border px-4 py-4 text-sm font-semibold transition ${
                          location.radius === String(option)
                            ? "border-[#d4ad63]/60 bg-[#d4ad63]/10 text-[#f0dfbd]"
                            : "border-white/10 bg-[#101416] text-white/50 hover:border-white/20"
                        }`}
                      >
                        {option} m
                      </button>
                    ))}
                  </div>

                  <label className="mt-4 block">
                    <span className="text-sm text-white/55">
                      Custom radius in metres
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="5000"
                      step="1"
                      value={location.radius}
                      onChange={(event) => updateLocation("radius", event.target.value)}
                      className={inputClassName}
                    />
                  </label>
                </div>

                {accuracyMeters !== null ? (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-[#101416] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-white/35">
                      Detected GPS Accuracy
                    </p>
                    <p className="mt-2 text-lg font-bold text-[#f0dfbd]">
                      ± {accuracyMeters} metres
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/45">
                      {accuracyMeters <= 10
                        ? "Excellent accuracy."
                        : accuracyMeters <= 30
                          ? "Usable accuracy. Confirm the map pin before saving."
                          : "Weak accuracy. Move outdoors or near a window and retry."}
                    </p>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={saveWorkplace}
                  disabled={
                    isSaving ||
                    isSearchingAddress ||
                    !coordinatesValid ||
                    location.address.trim().length < 6
                  }
                  className="mt-8 w-full rounded-full bg-[#d4ad63] px-8 py-4 font-bold text-[#101416] transition hover:bg-[#e4bf75] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving
                    ? "Saving Workplace..."
                    : "Save Workplace Address & GPS"}
                </button>
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-[#d4ad63]/25 bg-[#1e2428]">
              <div className="border-b border-white/10 p-6 sm:p-8">
                <p className="text-sm tracking-[0.25em] text-[#d4ad63]">
                  MAP PREVIEW
                </p>
                <h2 className="mt-3 text-2xl font-bold text-[#f0dfbd]">
                  Confirm the workplace pin
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/50">
                  The pin should sit at the workplace entrance or the area where
                  employees normally clock in.
                </p>
              </div>

              {mapUrl ? (
                <div className="bg-[#0c1114] p-4 sm:p-6">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
                    <iframe
                      title="Workplace map preview"
                      src={mapUrl}
                      className="h-[520px] w-full border-0"
                      loading="lazy"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MapMetric label="Latitude" value={latitude?.toFixed(6) || "—"} />
                    <MapMetric label="Longitude" value={longitude?.toFixed(6) || "—"} />
                    <MapMetric label="Radius" value={radius ? `${radius} m` : "—"} />
                  </div>

                  <p className="mt-4 text-center text-[11px] text-white/30">
                    Map and address data © OpenStreetMap contributors.
                  </p>
                </div>
              ) : (
                <div className="flex min-h-[560px] items-center justify-center p-8 text-center">
                  <div className="max-w-md">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#d4ad63]/30 bg-[#d4ad63]/10 text-3xl">
                      📍
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-[#f0dfbd]">
                      No workplace pin selected
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-white/50">
                      Enter the workplace address or use your current location
                      to create the map pin.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101416] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-[#f0dfbd]">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-sm text-white/55">{label}</span>
      <input
        type="number"
        step="0.000001"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    </label>
  );
}

function MapMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101416] p-4">
      <p className="text-xs uppercase tracking-[0.13em] text-white/35">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#f0dfbd]">{value}</p>
    </div>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none transition placeholder:text-white/20 focus:border-[#d4ad63]";
