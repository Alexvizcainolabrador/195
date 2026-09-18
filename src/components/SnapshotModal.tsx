import React from 'react';
import { MomentRecord, SnapshotRecord, CityRecord, CountryRecord } from '../types';
import { MomentModal } from './MomentModal';

export interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (snapshot: SnapshotRecord) => Promise<void>;
  city: CityRecord;
  country: CountryRecord;
  existingSnapshot?: SnapshotRecord | null;
  userId: string;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  isOpen,
  onClose,
  onSave,
  city,
  country,
  existingSnapshot,
  userId,
}) => {
  return (
    <MomentModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave as (m: MomentRecord) => Promise<void>}
      city={city}
      country={country}
      existingMoment={existingSnapshot}
      userId={userId}
    />
  );
};

export { MomentModal };
