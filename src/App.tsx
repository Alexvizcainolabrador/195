import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from './lib/firebase';
import { travelService } from './services/travelService';
import { CountryRecord, CityRecord, PlaceRecord, MomentRecord } from './types';
import { TopHeader, BottomNavigation } from './components/Navigation';
import { ScreenWorld } from './components/ScreenWorld';
import { ScreenCountry } from './components/ScreenCountry';
import { ScreenCity } from './components/ScreenCity';
import { ScreenMoments } from './components/ScreenMoments';
import { ScreenSnapshotDetail } from './components/ScreenSnapshotDetail';
import { ScreenPlace } from './components/ScreenPlace';
import { CountryModal, CityModal, PlaceModal } from './components/Modals';
import { MomentModal } from './components/MomentModal';
import { MemoryTableModal } from './components/MemoryTableModal';

type ScreenType = 'world' | 'country' | 'city' | 'snapshot' | 'place' | 'moments';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [deviceTravelerId, setDeviceTravelerId] = useState<string>('');

  // Main data states: 1. Lugares (Countries, Cities, Places) & 2. Momentos
  const [countries, setCountries] = useState<CountryRecord[]>([]);
  const [cities, setCities] = useState<CityRecord[]>([]);
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [moments, setMoments] = useState<MomentRecord[]>([]);

  // Navigation / Selection states
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('world');
  const [selectedCountry, setSelectedCountry] = useState<CountryRecord | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityRecord | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<MomentRecord | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceRecord | null>(null);

  // Modals state
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryRecord | null>(null);
  const [initialCountryCode, setInitialCountryCode] = useState<string | undefined>();

  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityRecord | null>(null);

  const [isMomentModalOpen, setIsMomentModalOpen] = useState(false);
  const [editingMoment, setEditingMoment] = useState<MomentRecord | null>(null);

  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceRecord | null>(null);

  // Experiencia "Revivir" (Cronológico a Pantalla Completa, tipo Stories)
  const [isReliveModalOpen, setIsReliveModalOpen] = useState(false);
  const [reliveCountry, setReliveCountry] = useState<CountryRecord | null>(null);
  const [reliveCity, setReliveCity] = useState<CityRecord | null>(null);
  const [reliveInitialMomentId, setReliveInitialMomentId] = useState<string | null>(null);

  // Initialize or retrieve persistent device Traveler ID
  useEffect(() => {
    let tid = localStorage.getItem('195_device_traveler_id');
    if (!tid) {
      tid = `traveler-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('195_device_traveler_id', tid);
    }
    setDeviceTravelerId(tid);

    // Try loading local cached items for immediate instant render
    const cachedCountries = localStorage.getItem('195_cached_countries');
    if (cachedCountries) {
      try {
        setCountries(JSON.parse(cachedCountries));
      } catch (e) {
        console.error(e);
      }
    }
    const cachedCities = localStorage.getItem('195_cached_cities');
    if (cachedCities) {
      try {
        setCities(JSON.parse(cachedCities));
      } catch (e) {
        console.error(e);
      }
    }
    const cachedPlaces = localStorage.getItem('195_cached_places');
    if (cachedPlaces) {
      try {
        setPlaces(JSON.parse(cachedPlaces));
      } catch (e) {
        console.error(e);
      }
    }
    const cachedMoments = localStorage.getItem('195_cached_snapshots');
    if (cachedMoments) {
      try {
        setMoments(JSON.parse(cachedMoments));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const activeUserId = user ? user.uid : deviceTravelerId;

  // Realtime Firestore synchronization
  useEffect(() => {
    if (!activeUserId) return;

    // 1. Countries subscription
    const unsubCountries = travelService.subscribeCountries(
      activeUserId,
      (list) => {
        setCountries(list);
        localStorage.setItem('195_cached_countries', JSON.stringify(list));
      },
      (err) => console.warn('Sync countries fallback:', err)
    );

    // 2. Cities subscription
    const unsubCities = travelService.subscribeCities(
      activeUserId,
      null,
      (list) => {
        setCities(list);
        localStorage.setItem('195_cached_cities', JSON.stringify(list));
      },
      (err) => console.warn('Sync cities fallback:', err)
    );

    // 3. Places subscription
    const unsubPlaces = travelService.subscribePlaces(
      activeUserId,
      null,
      (list) => {
        setPlaces(list);
        localStorage.setItem('195_cached_places', JSON.stringify(list));
      },
      (err) => console.warn('Sync places fallback:', err)
    );

    // 4. Moments subscription
    const unsubMoments = travelService.subscribeMoments(
      activeUserId,
      null,
      (list) => {
        setMoments(list);
        localStorage.setItem('195_cached_snapshots', JSON.stringify(list));
      },
      (err) => console.warn('Sync moments fallback:', err)
    );

    return () => {
      unsubCountries();
      unsubCities();
      unsubPlaces();
      unsubMoments();
    };
  }, [activeUserId]);

  // Seed demo data if totally blank
  useEffect(() => {
    if (activeUserId && countries.length === 0 && !localStorage.getItem('195_seeded_once')) {
      localStorage.setItem('195_seeded_once', 'true');
      travelService.seedDemoTravel(activeUserId).catch((e) => console.warn('Autoseed fallback:', e));
    }
  }, [activeUserId, countries.length]);

  // CRUD Handlers
  const handleSaveCountry = async (countryData: CountryRecord) => {
    setCountries((prev) => {
      const exists = prev.some((c) => c.id === countryData.id);
      const next = exists
        ? prev.map((c) => (c.id === countryData.id ? countryData : c))
        : [countryData, ...prev];
      localStorage.setItem('195_cached_countries', JSON.stringify(next));
      return next;
    });

    try {
      await travelService.saveCountry(countryData);
    } catch (e) {
      console.warn('Country saved locally:', e);
    }
  };

  const handleDeleteCountry = async (countryId: string) => {
    setCountries((prev) => prev.filter((c) => c.id !== countryId));
    setCities((prev) => prev.filter((c) => c.countryId !== countryId));
    setPlaces((prev) => prev.filter((p) => p.countryId !== countryId));
    setMoments((prev) => prev.filter((m) => m.countryId !== countryId));

    try {
      await travelService.deleteCountry(countryId, activeUserId);
    } catch (e) {
      console.warn('Delete synced locally:', e);
    }
  };

  const handleSaveCity = async (cityData: CityRecord) => {
    setCities((prev) => {
      const exists = prev.some((c) => c.id === cityData.id);
      const next = exists
        ? prev.map((c) => (c.id === cityData.id ? cityData : c))
        : [cityData, ...prev];
      localStorage.setItem('195_cached_cities', JSON.stringify(next));
      return next;
    });

    try {
      await travelService.saveCity(cityData);
    } catch (e) {
      console.warn('City saved locally:', e);
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    setCities((prev) => prev.filter((c) => c.id !== cityId));
    setPlaces((prev) => prev.filter((p) => p.cityId !== cityId));
    setMoments((prev) => prev.filter((m) => m.cityId !== cityId));

    try {
      await travelService.deleteCity(cityId, activeUserId);
    } catch (e) {
      console.warn('City delete synced locally:', e);
    }
  };

  const handleSaveMoment = async (momentData: MomentRecord) => {
    setMoments((prev) => {
      const exists = prev.some((m) => m.id === momentData.id);
      const next = exists
        ? prev.map((m) => (m.id === momentData.id ? momentData : m))
        : [momentData, ...prev];
      localStorage.setItem('195_cached_snapshots', JSON.stringify(next));
      return next;
    });

    try {
      await travelService.saveMoment(momentData);
    } catch (e) {
      console.warn('Moment saved locally:', e);
    }
  };

  const handleDeleteMoment = async (momentId: string) => {
    setMoments((prev) => prev.filter((m) => m.id !== momentId));

    try {
      await travelService.deleteMoment(momentId);
    } catch (e) {
      console.warn('Moment delete synced locally:', e);
    }
  };

  const handleSavePlace = async (placeData: PlaceRecord) => {
    setPlaces((prev) => {
      const exists = prev.some((p) => p.id === placeData.id);
      const next = exists
        ? prev.map((p) => (p.id === placeData.id ? placeData : p))
        : [placeData, ...prev];
      localStorage.setItem('195_cached_places', JSON.stringify(next));
      return next;
    });

    try {
      await travelService.savePlace(placeData);
    } catch (e) {
      console.warn('Place saved locally:', e);
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== placeId));

    try {
      await travelService.deletePlace(placeId);
    } catch (e) {
      console.warn('Place delete synced locally:', e);
    }
  };

  const handleToggleWorthReturning = async (place: PlaceRecord) => {
    const updated = { ...place, worthReturning: !place.worthReturning };
    setSelectedPlace(updated);
    await handleSavePlace(updated);
  };

  const handleToggleFavorite = async (place: PlaceRecord) => {
    const isFav = !(place.favorite || place.isFavorite);
    const updated: PlaceRecord = { ...place, favorite: isFav, isFavorite: isFav };
    setSelectedPlace(updated);
    await handleSavePlace(updated);
  };

  const handleSeedDemo = async () => {
    try {
      await travelService.seedDemoTravel(activeUserId);
    } catch (err) {
      console.warn('Seed fallback locally:', err);
    }
  };

  // Experiencia "Revivir" (chronological stories fullscreen)
  const handleStartRelive = (
    targetCountry?: CountryRecord | null,
    targetCity?: CityRecord | null,
    startAtMomentId?: string | null
  ) => {
    setReliveCountry(targetCountry || null);
    setReliveCity(targetCity || null);
    setReliveInitialMomentId(startAtMomentId || null);
    setIsReliveModalOpen(true);
  };

  // Helper to create a city/country dynamically from the MomentModal
  const handleAddNewCityCountry = async (cityName: string, countryName: string) => {
    let targetCountry = countries.find(
      (c) => c.name.trim().toLowerCase() === countryName.trim().toLowerCase()
    );
    let countryId = targetCountry?.id;

    if (!targetCountry) {
      const newCountry: CountryRecord = {
        id: `country-${Date.now()}`,
        userId: activeUserId,
        name: countryName,
        code: countryName.slice(0, 2).toUpperCase(),
        coverPhoto:
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
        firstVisitDate: new Date().toISOString().split('T')[0],
        visitCount: 1,
        visitedYear: new Date().getFullYear(),
        citiesCount: 1,
        notes: `Viaje por ${countryName}`,
      };
      await handleSaveCountry(newCountry);
      countryId = newCountry.id;
    }

    const newCity: CityRecord = {
      id: `city-${Date.now()}`,
      userId: activeUserId,
      countryId: countryId!,
      name: cityName,
      visitDate: new Date().toISOString().split('T')[0],
      coverPhoto:
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    };
    await handleSaveCity(newCity);
    return { cityId: newCity.id, countryId: countryId! };
  };

  return (
    <div
      id="app-root"
      className="min-h-screen bg-[#110e0b] text-stone-100 font-sans antialiased flex flex-col selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden"
    >
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Header: Lugares & Momentos, Revivir & Nuevo Momento */}
        <TopHeader
          user={user}
          onLogin={loginWithGoogle}
          onLogout={logoutUser}
          onReliveGlobal={() => handleStartRelive(null, null)}
          onOpenAddMoment={() => {
            setEditingMoment(null);
            setIsMomentModalOpen(true);
          }}
          momentsCount={moments.length}
        />

        {/* Main Screen Content */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
          {/* 1. CONCEPTO: LUGARES (ScreenWorld: Atlas de Recuerdos) */}
          {currentScreen === 'world' && (
            <ScreenWorld
              visitedCountries={countries}
              cities={cities}
              places={places}
              snapshots={moments}
              onSelectCountry={(country) => {
                setSelectedCountry(country);
                setCurrentScreen('country');
              }}
              onOpenAddCountry={(code) => {
                setEditingCountry(null);
                setInitialCountryCode(code);
                setIsCountryModalOpen(true);
              }}
              onSeedDemo={handleSeedDemo}
              onReliveGlobal={() => handleStartRelive(null, null)}
              onReliveCountry={(country) => handleStartRelive(country, null)}
              onSelectSnapshot={(snap) => {
                setSelectedSnapshot(snap);
                const parentCountry = countries.find((c) => c.id === snap.countryId);
                const parentCity = cities.find((c) => c.id === snap.cityId);
                if (parentCountry) setSelectedCountry(parentCountry);
                if (parentCity) setSelectedCity(parentCity);
                setCurrentScreen('snapshot');
              }}
            />
          )}

          {/* 2. CONCEPTO: MOMENTOS (ScreenMoments: Fotos, Vídeos, Audios, Notas) */}
          {currentScreen === 'moments' && (
            <ScreenMoments
              moments={moments}
              cities={cities}
              countries={countries}
              onRelive={(initialMomentId) => handleStartRelive(null, null, initialMomentId)}
              onOpenAddMoment={() => {
                setEditingMoment(null);
                setIsMomentModalOpen(true);
              }}
              onEditMoment={(m) => {
                setEditingMoment(m);
                setIsMomentModalOpen(true);
              }}
              onDeleteMoment={handleDeleteMoment}
            />
          )}

          {/* Detalle de País dentro de Lugares */}
          {currentScreen === 'country' && selectedCountry && (
            <ScreenCountry
              country={selectedCountry}
              cities={cities}
              places={places}
              snapshots={moments}
              onBack={() => {
                setCurrentScreen('world');
              }}
              onSelectCity={(city) => {
                setSelectedCity(city);
                setCurrentScreen('city');
              }}
              onOpenAddCity={() => {
                setEditingCity(null);
                setIsCityModalOpen(true);
              }}
              onEditCountry={(country) => {
                setEditingCountry(country);
                setIsCountryModalOpen(true);
              }}
              onDeleteCountry={handleDeleteCountry}
              onReliveCountry={(country) => handleStartRelive(country, null)}
              onSelectSnapshot={(snap) => {
                setSelectedSnapshot(snap);
                const parentCity = cities.find((c) => c.id === snap.cityId);
                if (parentCity) setSelectedCity(parentCity);
                setCurrentScreen('snapshot');
              }}
            />
          )}

          {/* Detalle de Ciudad dentro de Lugares */}
          {currentScreen === 'city' && selectedCity && selectedCountry && (
            <ScreenCity
              country={selectedCountry}
              city={selectedCity}
              snapshots={moments}
              places={places}
              onBack={() => {
                setCurrentScreen('country');
              }}
              onSelectSnapshot={(snapshot) => {
                setSelectedSnapshot(snapshot);
                setCurrentScreen('snapshot');
              }}
              onOpenAddSnapshot={() => {
                setEditingMoment(null);
                setIsMomentModalOpen(true);
              }}
              onSelectPlace={(place) => {
                setSelectedPlace(place);
                setCurrentScreen('place');
              }}
              onOpenAddPlace={() => {
                setEditingPlace(null);
                setIsPlaceModalOpen(true);
              }}
              onUpdateCity={handleSaveCity}
              onDeleteCity={handleDeleteCity}
              onReliveCity={(city, startAtMomentId) =>
                handleStartRelive(selectedCountry, city, startAtMomentId)
              }
              onDeleteMoment={handleDeleteMoment}
              onEditMoment={(moment) => {
                setEditingMoment(moment);
                setIsMomentModalOpen(true);
              }}
            />
          )}

          {/* Detalle de Momento */}
          {currentScreen === 'snapshot' && selectedSnapshot && (
            <ScreenSnapshotDetail
              country={
                selectedCountry ||
                countries.find((c) => c.id === selectedSnapshot.countryId) || {
                  id: selectedSnapshot.countryId,
                  name: selectedSnapshot.countryName || 'Destino',
                  code: 'UN',
                  userId: activeUserId,
                  visitedYear: 2024,
                  citiesCount: 1,
                }
              }
              city={
                selectedCity ||
                cities.find((c) => c.id === selectedSnapshot.cityId) || {
                  id: selectedSnapshot.cityId,
                  countryId: selectedSnapshot.countryId,
                  name: selectedSnapshot.cityName || 'Ciudad',
                  userId: activeUserId,
                  visitDate: selectedSnapshot.date,
                  coverPhoto: selectedSnapshot.mediaUrl || '',
                }
              }
              snapshot={selectedSnapshot}
              allCitySnapshots={moments.filter((s) => s.cityId === selectedSnapshot.cityId)}
              onBack={() => {
                if (selectedCity) {
                  setCurrentScreen('city');
                } else {
                  setCurrentScreen('moments');
                }
              }}
              onSelectSnapshot={(snap) => {
                setSelectedSnapshot(snap);
              }}
              onEditSnapshot={(snap) => {
                setEditingMoment(snap);
                setIsMomentModalOpen(true);
              }}
              onDeleteSnapshot={handleDeleteMoment}
              onReliveAtMoment={(moment) =>
                handleStartRelive(selectedCountry, selectedCity, moment.id)
              }
            />
          )}

          {/* Detalle de Lugar dentro de Ciudad */}
          {currentScreen === 'place' && selectedPlace && (
            <ScreenPlace
              country={selectedCountry || countries.find((c) => c.id === selectedPlace.countryId)}
              city={selectedCity || cities.find((c) => c.id === selectedPlace.cityId)}
              place={selectedPlace}
              onBack={() => {
                if (selectedCity) {
                  setCurrentScreen('city');
                } else {
                  setCurrentScreen('world');
                }
              }}
              onEditPlace={(place) => {
                setEditingPlace(place);
                setIsPlaceModalOpen(true);
              }}
              onDeletePlace={handleDeletePlace}
              onToggleWorthReturning={handleToggleWorthReturning}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </main>

        {/* Bottom Navigation: Lugares vs Momentos, con Revivir */}
        <BottomNavigation
          currentTab={currentScreen === 'moments' ? 'moments' : 'places'}
          onSelectTab={(tab) => {
            if (tab === 'places') {
              setCurrentScreen('world');
            } else if (tab === 'moments') {
              setCurrentScreen('moments');
            }
          }}
          onOpenAddMoment={() => {
            setEditingMoment(null);
            setIsMomentModalOpen(true);
          }}
          onReliveGlobal={() => handleStartRelive(null, null)}
          hasMoments={moments.length > 0}
          user={user}
          onLogin={loginWithGoogle}
          onLogout={logoutUser}
        />

        {/* MODAL: Nuevo / Editar Momento (Foto, Vídeo corto, Audio, Nota + Auto Fecha, Hora, Ciudad, País, Autor) */}
        {isMomentModalOpen && (
          <MomentModal
            isOpen={isMomentModalOpen}
            onClose={() => setIsMomentModalOpen(false)}
            onSave={handleSaveMoment}
            city={selectedCity}
            country={selectedCountry}
            allCities={cities}
            allCountries={countries}
            existingMoment={editingMoment}
            userId={activeUserId}
            defaultAuthorName={user?.displayName || 'Alejandro Labrador'}
            onAddNewCityCountry={handleAddNewCityCountry}
          />
        )}

        {/* MODAL: Nuevo País */}
        {isCountryModalOpen && (
          <CountryModal
            isOpen={isCountryModalOpen}
            onClose={() => setIsCountryModalOpen(false)}
            onSave={handleSaveCountry}
            existingCountry={editingCountry}
            initialCode={initialCountryCode}
            userId={activeUserId}
          />
        )}

        {/* MODAL: Nueva Ciudad */}
        {isCityModalOpen && selectedCountry && (
          <CityModal
            isOpen={isCityModalOpen}
            onClose={() => setIsCityModalOpen(false)}
            onSave={handleSaveCity}
            countryId={selectedCountry.id}
            countryName={selectedCountry.name}
            existingCity={editingCity}
            userId={activeUserId}
          />
        )}

        {/* MODAL: Nuevo Lugar */}
        {isPlaceModalOpen && (
          <PlaceModal
            isOpen={isPlaceModalOpen}
            onClose={() => setIsPlaceModalOpen(false)}
            onSave={handleSavePlace}
            cityId={selectedCity ? selectedCity.id : ''}
            countryId={selectedCountry ? selectedCountry.id : ''}
            cityName={selectedCity ? selectedCity.name : 'Ciudad'}
            existingPlace={editingPlace}
            userId={activeUserId}
          />
        )}

        {/* EXPERIENCIA: MESA DE RECUERDOS (Fondo oscuro, recuerdos físicos esparcidos, elevar al abrir) */}
        {isReliveModalOpen && (
          <MemoryTableModal
            isOpen={isReliveModalOpen}
            onClose={() => {
              setIsReliveModalOpen(false);
              setReliveInitialMomentId(null);
            }}
            country={reliveCountry}
            city={reliveCity}
            snapshots={moments}
            places={places}
            cities={cities}
            countries={countries}
            initialMomentId={reliveInitialMomentId}
          />
        )}
      </div>
    </div>
  );
}
