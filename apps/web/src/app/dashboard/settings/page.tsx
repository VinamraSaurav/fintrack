'use client';

import { UserProfile } from '@clerk/nextjs';

export default function SettingsPage() {
  return (
    <div className="page-container">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Settings</h1>
      <div className="card-elevated">
        <UserProfile routing="hash" />
      </div>
    </div>
  );
}
