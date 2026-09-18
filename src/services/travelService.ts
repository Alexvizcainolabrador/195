import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  CountryRecord,
  CityRecord,
  PlaceRecord,
  MomentRecord,
  SnapshotRecord,
  getMomentMediaType,
  getMomentMediaUrl,
  getMomentPhrase,
  getMomentPlace,
} from '../types';

export const travelService = {
  // Subscribe to user's visited countries
  subscribeCountries(userId: string, onUpdate: (countries: CountryRecord[]) => void, onError?: (err: unknown) => void) {
    const colPath = 'countries';
    const q = query(collection(db, colPath), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: CountryRecord[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as CountryRecord);
        });
        onUpdate(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // Subscribe to cities (optionally for a specific country or all user cities)
  subscribeCities(
    userId: string,
    countryId: string | null,
    onUpdate: (cities: CityRecord[]) => void,
    onError?: (err: unknown) => void
  ) {
    const colPath = 'cities';
    const q = countryId
      ? query(collection(db, colPath), where('userId', '==', userId), where('countryId', '==', countryId))
      : query(collection(db, colPath), where('userId', '==', userId));

    return onSnapshot(
      q,
      (snapshot) => {
        const list: CityRecord[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as CityRecord);
        });
        onUpdate(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // Subscribe to places (optionally filtered by city or country)
  subscribePlaces(
    userId: string,
    filter: { countryId?: string; cityId?: string } | null,
    onUpdate: (places: PlaceRecord[]) => void,
    onError?: (err: unknown) => void
  ) {
    const colPath = 'places';
    let q = query(collection(db, colPath), where('userId', '==', userId));
    if (filter?.cityId) {
      q = query(collection(db, colPath), where('userId', '==', userId), where('cityId', '==', filter.cityId));
    } else if (filter?.countryId) {
      q = query(collection(db, colPath), where('userId', '==', userId), where('countryId', '==', filter.countryId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const list: PlaceRecord[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as PlaceRecord);
        });
        onUpdate(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // Subscribe to Moments (optionally filtered by city or country)
  subscribeMoments(
    userId: string,
    filter: { countryId?: string; cityId?: string } | null,
    onUpdate: (moments: MomentRecord[]) => void,
    onError?: (err: unknown) => void
  ) {
    const colPath = 'snapshots';
    let q = query(collection(db, colPath), where('userId', '==', userId));
    if (filter?.cityId) {
      q = query(collection(db, colPath), where('userId', '==', userId), where('cityId', '==', filter.cityId));
    } else if (filter?.countryId) {
      q = query(collection(db, colPath), where('userId', '==', userId), where('countryId', '==', filter.countryId));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const list: MomentRecord[] = [];
        snapshot.forEach((d) => {
          const raw = { id: d.id, ...d.data() } as MomentRecord;
          // Normalize media fields
          const mediaType = getMomentMediaType(raw);
          const mediaUrl = getMomentMediaUrl(raw);
          const phrase = getMomentPhrase(raw);
          const place = getMomentPlace(raw);
          list.push({
            ...raw,
            mediaType,
            mediaUrl,
            phrase,
            place,
            time: raw.time || '',
            author: raw.author || 'Tú',
            cityName: raw.cityName || '',
            countryName: raw.countryName || '',
            // also maintain backward compatibility
            photoUrl: raw.photoUrl || (mediaType === 'photo' ? mediaUrl : ''),
            audioUrl: raw.audioUrl || (mediaType === 'audio' ? mediaUrl : ''),
            note: raw.note || phrase,
            title: raw.title || phrase.slice(0, 45),
          });
        });
        // Sort chronologically: oldest first for storytelling timeline or date sorting
        list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        onUpdate(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, colPath);
      }
    );
  },

  // Alias for backward compatibility
  subscribeSnapshots(
    userId: string,
    filter: { countryId?: string; cityId?: string } | null,
    onUpdate: (snapshots: SnapshotRecord[]) => void,
    onError?: (err: unknown) => void
  ) {
    return this.subscribeMoments(userId, filter, onUpdate, onError);
  },

  // Save / update Moment
  async saveMoment(moment: MomentRecord): Promise<void> {
    const docPath = `snapshots/${moment.id}`;
    const mediaType = moment.mediaType || getMomentMediaType(moment);
    const mediaUrl = moment.mediaUrl || getMomentMediaUrl(moment);
    const phrase = moment.phrase ?? moment.note ?? moment.title ?? '';
    const place = moment.place ?? '';

    try {
      await setDoc(
        doc(db, 'snapshots', moment.id),
        {
          userId: moment.userId,
          countryId: moment.countryId,
          cityId: moment.cityId,
          countryName: moment.countryName || '',
          cityName: moment.cityName || '',
          date: moment.date,
          time: moment.time || new Date().toTimeString().slice(0, 5),
          author: moment.author || 'Tú',
          mediaType,
          mediaUrl,
          audioDuration: moment.audioDuration || 0,
          videoDuration: moment.videoDuration || 0,
          phrase,
          place,
          people: moment.people || [],
          // Compat fields
          title: phrase.slice(0, 45) || 'Momento de viaje',
          note: moment.note || phrase,
          photoUrl: mediaType === 'photo' ? mediaUrl : (moment.photoUrl || ''),
          audioUrl: mediaType === 'audio' ? mediaUrl : (moment.audioUrl || ''),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // Alias for backward compatibility
  async saveSnapshot(snapshot: SnapshotRecord): Promise<void> {
    return this.saveMoment(snapshot);
  },

  // Delete Moment
  async deleteMoment(momentId: string): Promise<void> {
    const docPath = `snapshots/${momentId}`;
    try {
      await deleteDoc(doc(db, 'snapshots', momentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  // Alias for backward compatibility
  async deleteSnapshot(snapshotId: string): Promise<void> {
    return this.deleteMoment(snapshotId);
  },

  // Save / update Country
  async saveCountry(country: CountryRecord): Promise<void> {
    const docPath = `countries/${country.id}`;
    try {
      await setDoc(doc(db, 'countries', country.id), {
        userId: country.userId,
        code: country.code,
        name: country.name,
        coverPhoto: country.coverPhoto,
        firstVisitDate: country.firstVisitDate,
        visitCount: country.visitCount,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // Delete Country (and recursively its cities, places & snapshots)
  async deleteCountry(countryId: string, userId: string): Promise<void> {
    const docPath = `countries/${countryId}`;
    try {
      await deleteDoc(doc(db, 'countries', countryId));

      // Cleanup associated cities
      const citiesQ = query(collection(db, 'cities'), where('countryId', '==', countryId), where('userId', '==', userId));
      const citiesSnap = await getDocs(citiesQ);
      for (const cityDoc of citiesSnap.docs) {
        await deleteDoc(doc(db, 'cities', cityDoc.id));
      }

      // Cleanup associated places
      const placesQ = query(collection(db, 'places'), where('countryId', '==', countryId), where('userId', '==', userId));
      const placesSnap = await getDocs(placesQ);
      for (const placeDoc of placesSnap.docs) {
        await deleteDoc(doc(db, 'places', placeDoc.id));
      }

      // Cleanup associated snapshots
      const snapshotsQ = query(collection(db, 'snapshots'), where('countryId', '==', countryId), where('userId', '==', userId));
      const snapshotsSnap = await getDocs(snapshotsQ);
      for (const snapDoc of snapshotsSnap.docs) {
        await deleteDoc(doc(db, 'snapshots', snapDoc.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  // Save / update City
  async saveCity(city: CityRecord): Promise<void> {
    const docPath = `cities/${city.id}`;
    try {
      await setDoc(doc(db, 'cities', city.id), {
        countryId: city.countryId,
        userId: city.userId,
        name: city.name,
        coverPhoto: city.coverPhoto,
        visitDate: city.visitDate,
        notes: city.notes || '',
        photos: city.photos || [],
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // Delete City (and its places & snapshots)
  async deleteCity(cityId: string, userId: string): Promise<void> {
    const docPath = `cities/${cityId}`;
    try {
      await deleteDoc(doc(db, 'cities', cityId));

      // Cleanup associated places
      const placesQ = query(collection(db, 'places'), where('cityId', '==', cityId), where('userId', '==', userId));
      const placesSnap = await getDocs(placesQ);
      for (const placeDoc of placesSnap.docs) {
        await deleteDoc(doc(db, 'places', placeDoc.id));
      }

      // Cleanup associated snapshots
      const snapshotsQ = query(collection(db, 'snapshots'), where('cityId', '==', cityId), where('userId', '==', userId));
      const snapshotsSnap = await getDocs(snapshotsQ);
      for (const snapDoc of snapshotsSnap.docs) {
        await deleteDoc(doc(db, 'snapshots', snapDoc.id));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  // Save / update Place
  async savePlace(place: PlaceRecord): Promise<void> {
    const docPath = `places/${place.id}`;
    try {
      await setDoc(doc(db, 'places', place.id), {
        cityId: place.cityId,
        countryId: place.countryId,
        userId: place.userId,
        name: place.name,
        category: place.category,
        address: place.address || '',
        photos: place.photos || [],
        notes: place.notes || '',
        worthReturning: Boolean(place.worthReturning),
        isFavorite: Boolean(place.isFavorite),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // Delete Place
  async deletePlace(placeId: string): Promise<void> {
    const docPath = `places/${placeId}`;
    try {
      await deleteDoc(doc(db, 'places', placeId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  // Starter demo seed
  async seedDemoTravel(userId: string): Promise<void> {
    // Seed Spain
    const spainId = `demo-country-es-${userId.slice(0, 5)}`;
    const spain: CountryRecord = {
      id: spainId,
      userId,
      code: 'ES',
      name: 'España',
      coverPhoto: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1200&q=80',
      firstVisitDate: '2022-05-12',
      visitCount: 3,
    };
    await this.saveCountry(spain);

    const bcnId = `demo-city-bcn-${userId.slice(0, 5)}`;
    const bcn: CityRecord = {
      id: bcnId,
      countryId: spainId,
      userId,
      name: 'Barcelona',
      coverPhoto: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=80',
      visitDate: '2023-09-18',
      notes: 'Paseos por el Barrio Gótico al atardecer y brisa marina en la Barceloneta.',
      photos: [
        'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
      ],
    };
    await this.saveCity(bcn);

    const place1: PlaceRecord = {
      id: `demo-place-1-${userId.slice(0, 5)}`,
      cityId: bcnId,
      countryId: spainId,
      userId,
      name: 'Bar del Pla',
      category: 'Restaurante',
      address: 'Carrer de Montcada, 2, El Born, Barcelona',
      photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'],
      notes: 'Tapas memorables, especialmente el carpaccio de champiñones con foie y trufa.',
      worthReturning: true,
      isFavorite: true,
    };
    await this.savePlace(place1);

    const place2: PlaceRecord = {
      id: `demo-place-2-${userId.slice(0, 5)}`,
      cityId: bcnId,
      countryId: spainId,
      userId,
      name: 'Bunkers del Carmel',
      category: 'Mirador',
      address: 'Carrer de Marià Labèrnia, s/n, Barcelona',
      photos: ['https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&w=800&q=80'],
      notes: 'La mejor panorámica 360º de la ciudad al atardecer con el mar al fondo.',
      worthReturning: true,
      isFavorite: false,
    };
    await this.savePlace(place2);

    // Seed Japan
    const japanId = `demo-country-jp-${userId.slice(0, 5)}`;
    const japan: CountryRecord = {
      id: japanId,
      userId,
      code: 'JP',
      name: 'Japón',
      coverPhoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      firstVisitDate: '2024-04-02',
      visitCount: 1,
    };
    await this.saveCountry(japan);

    const kyotoId = `demo-city-kyo-${userId.slice(0, 5)}`;
    const kyoto: CityRecord = {
      id: kyotoId,
      countryId: japanId,
      userId,
      name: 'Kioto',
      coverPhoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      visitDate: '2024-04-05',
      notes: 'Cerezos en flor a lo largo del Río Kamo y tranquilidad en los templos del norte.',
      photos: [
        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      ],
    };
    await this.saveCity(kyoto);

    const place3: PlaceRecord = {
      id: `demo-place-3-${userId.slice(0, 5)}`,
      cityId: kyotoId,
      countryId: japanId,
      userId,
      name: 'Café bibliotecario en Gion',
      category: 'Cafetería',
      address: 'Gion-machi Minamigawa, Higashiyama Ward, Kioto',
      photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80'],
      notes: 'Matcha artesanal servido con dulce wagashi en silencio absoluto mirando un jardín zen.',
      worthReturning: true,
      isFavorite: true,
    };
    await this.savePlace(place3);

    // Seed Moments for Barcelona
    const moment1: MomentRecord = {
      id: `demo-moment-1-${userId.slice(0, 5)}`,
      cityId: bcnId,
      countryId: spainId,
      userId,
      mediaType: 'photo',
      mediaUrl: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?auto=format&fit=crop&w=1400&q=85',
      phrase: 'El cielo se volvió violeta sobre Barcelona y abajo alguien afinaba una guitarra española.',
      place: 'Bunkers del Carmel',
      people: ['Elena', 'Marco'],
      date: '2023-09-19',
    };
    await this.saveMoment(moment1);

    const moment2: MomentRecord = {
      id: `demo-moment-2-${userId.slice(0, 5)}`,
      cityId: bcnId,
      countryId: spainId,
      userId,
      mediaType: 'audio',
      mediaUrl: 'https://assets.mixkit.co/active_storage/sfx/386/386-preview.mp3',
      audioDuration: 14,
      phrase: 'El tintineo del vermut, risas sinceras y el calor de una taberna que parecía detener el tiempo.',
      place: 'Bar del Pla, El Born',
      people: ['Elena'],
      date: '2023-09-20',
    };
    await this.saveMoment(moment2);

    const moment3: MomentRecord = {
      id: `demo-moment-3-${userId.slice(0, 5)}`,
      cityId: bcnId,
      countryId: spainId,
      userId,
      mediaType: 'video',
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4',
      videoDuration: 12,
      phrase: 'El mar respirando en calma antes del alba y la arena aún fría bajo los pies descalzos.',
      place: 'Playa de la Barceloneta',
      people: ['Elena', 'Marco', 'Sofía'],
      date: '2023-09-22',
    };
    await this.saveMoment(moment3);

    // Seed Moments for Kyoto
    const moment4: MomentRecord = {
      id: `demo-moment-4-${userId.slice(0, 5)}`,
      cityId: kyotoId,
      countryId: japanId,
      userId,
      mediaType: 'audio',
      mediaUrl: 'https://assets.mixkit.co/active_storage/sfx/1247/1247-preview.mp3',
      audioDuration: 22,
      phrase: 'El gong del templo rompiendo la niebla matutina mientras la lluvia caía sobre los jardines de musgo.',
      place: 'Templo Ryoan-ji',
      people: ['Kenji (guía local)'],
      date: '2024-04-06',
    };
    await this.saveMoment(moment4);

    const moment5: MomentRecord = {
      id: `demo-moment-5-${userId.slice(0, 5)}`,
      cityId: kyotoId,
      countryId: japanId,
      userId,
      mediaType: 'photo',
      mediaUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1400&q=85',
      phrase: 'El momento exacto en que los faroles rojos de papel se reflejaron sobre los adoquines húmedos.',
      place: 'Callejón Pontocho',
      people: ['Kenji'],
      date: '2024-04-08',
    };
    await this.saveMoment(moment5);

    const moment6: MomentRecord = {
      id: `demo-moment-6-${userId.slice(0, 5)}`,
      cityId: kyotoId,
      countryId: japanId,
      userId,
      mediaType: 'video',
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
      videoDuration: 10,
      phrase: 'El susurro del viento entre los tallos de bambú en un instante de silencio total.',
      place: 'Bosque de Arashiyama',
      people: [],
      date: '2024-04-10',
    };
    await this.saveMoment(moment6);

    // Seed Morocco (🇲🇦 Marruecos) with Marrakech, Fez, Casablanca
    const moroccoId = `demo-country-ma-${userId.slice(0, 5)}`;
    const morocco: CountryRecord = {
      id: moroccoId,
      userId,
      code: 'MA',
      name: 'Marruecos',
      coverPhoto: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
      firstVisitDate: '2023-11-04',
      visitCount: 2,
      notes: 'Luz dorada sobre el adobe, olor a azahar y especias, y el silencio sobrecogedor de la noche.',
    };
    await this.saveCountry(morocco);

    // 1. Marrakech
    const marrakechId = `demo-city-rak-${userId.slice(0, 5)}`;
    const marrakech: CityRecord = {
      id: marrakechId,
      countryId: moroccoId,
      userId,
      name: 'Marrakech',
      coverPhoto: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
      visitDate: '2023-11-05',
      notes: 'El bullicio infinito de Jemaa el-Fna al anochecer y la calma inesperada de los patios interiores.',
      photos: ['https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80'],
    };
    await this.saveCity(marrakech);

    // 2. Fez
    const fezId = `demo-city-fes-${userId.slice(0, 5)}`;
    const fez: CityRecord = {
      id: fezId,
      countryId: moroccoId,
      userId,
      name: 'Fez',
      coverPhoto: 'https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?auto=format&fit=crop&w=1200&q=80',
      visitDate: '2023-11-08',
      notes: 'Laberinto medieval de piedra viva, aromas de cuero en Chouara y llamadas a la oración desde los minaretes.',
      photos: ['https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?auto=format&fit=crop&w=800&q=80'],
    };
    await this.saveCity(fez);

    // 3. Casablanca
    const casaId = `demo-city-cas-${userId.slice(0, 5)}`;
    const casablanca: CityRecord = {
      id: casaId,
      countryId: moroccoId,
      userId,
      name: 'Casablanca',
      coverPhoto: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=1200&q=80',
      visitDate: '2023-11-11',
      notes: 'La imponente silueta de la Mezquita Hassan II levantada sobre el Atlántico y brisa salina.',
      photos: ['https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=800&q=80'],
    };
    await this.saveCity(casablanca);

    // Marrakech Places
    const placeM1: PlaceRecord = {
      id: `demo-place-m1-${userId.slice(0, 5)}`,
      cityId: marrakechId,
      countryId: moroccoId,
      userId,
      name: 'Plaza Jemaa el-Fna al Atardecer',
      category: 'Mirador',
      address: 'Jemaa el-Fna, Medina, Marrakech',
      photos: ['https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80'],
      notes: 'Ver cómo se encienden los puestos de humo blanco mientras cae el sol es una de las mayores experiencias del mundo.',
      worthReturning: true,
      isFavorite: true,
    };
    await this.savePlace(placeM1);

    const placeM2: PlaceRecord = {
      id: `demo-place-m2-${userId.slice(0, 5)}`,
      cityId: marrakechId,
      countryId: moroccoId,
      userId,
      name: 'Café des Épices',
      category: 'Cafetería',
      address: '75 Rahba Lakdima, Medina, Marrakech',
      photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'],
      notes: 'Té a la menta fresca en la terraza superior con vista panorámica a la plaza de las especias.',
      worthReturning: true,
      isFavorite: true,
    };
    await this.savePlace(placeM2);

    // Marrakech Moments
    const momentM1: MomentRecord = {
      id: `demo-moment-m1-${userId.slice(0, 5)}`,
      cityId: marrakechId,
      countryId: moroccoId,
      userId,
      mediaType: 'photo',
      mediaUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1400&q=85',
      phrase: 'El aroma de azahar y canela en el zoco mientras el cielo se teñía de ocre profundo.',
      place: 'Plaza de las Especias, Marrakech',
      people: ['Alejandro'],
      date: '2023-11-06',
      time: '18:45',
      author: 'Alejandro Labrador',
    };
    await this.saveMoment(momentM1);

    const momentM2: MomentRecord = {
      id: `demo-moment-m2-${userId.slice(0, 5)}`,
      cityId: marrakechId,
      countryId: moroccoId,
      userId,
      mediaType: 'audio',
      mediaUrl: 'https://assets.mixkit.co/active_storage/sfx/386/386-preview.mp3',
      audioDuration: 18,
      phrase: 'El sonido de los laúdes y las teteras vertiendo té hirviendo en el patio de un riad.',
      place: 'Riad Jasmine, Marrakech',
      people: [],
      date: '2023-11-07',
      time: '21:15',
      author: 'Alejandro Labrador',
    };
    await this.saveMoment(momentM2);
  },
};
