'use client';

import Header from '@/components/header';
import { Bell, Lock, User, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const settings = [
    {
      category: 'Account',
      icon: User,
      items: [
        { label: 'Email Address', value: 'hackytricky8.30@healthcare.com' },
        { label: 'Phone Number', value: '+1 (555) 123-4567' },
        { label: 'Department', value: 'Emergency Medicine' },
        { label: 'Role', value: 'Doctor' },
      ],
    },
    {
      category: 'Notifications',
      icon: Bell,
      items: [
        { label: 'High Priority Alerts', value: 'Enabled', toggle: true },
        { label: 'Email Notifications', value: 'Enabled', toggle: true },
        { label: 'Report Delivery', value: 'Disabled', toggle: true },
      ],
    },
    {
      category: 'Security',
      icon: Lock,
      items: [
        { label: 'Two-Factor Authentication', value: 'Enabled', action: true },
        { label: 'Change Password', value: 'Last updated 30 days ago', action: true },
        { label: 'Session Timeout', value: '30 minutes', action: true },
      ],
    },
    {
      category: 'Preferences',
      icon: Sliders,
      items: [
        { label: 'Theme', value: 'Light', action: true },
        { label: 'Language', value: 'English', action: true },
        { label: 'Default View', value: 'Dashboard', action: true },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="px-8 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Settings Categories */}
        <div className="space-y-6">
          {settings.map((section, idx) => {
            const IconComponent = section.icon;
            return (
              <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="border-b border-border px-6 py-4 bg-secondary/50 flex items-center gap-3">
                  <IconComponent size={20} className="text-primary" />
                  <h3 className="font-semibold text-foreground">{section.category}</h3>
                </div>
                <div className="divide-y divide-border">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="px-6 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                      </div>
                      {item.toggle ? (
                        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500">
                          <span className="inline-block h-4 w-4 transform rounded-full bg-white ml-1" />
                        </button>
                      ) : item.action ? (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Danger Zone */}
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50/50 overflow-hidden">
          <div className="border-b border-red-200 px-6 py-4 bg-red-50">
            <h3 className="font-semibold text-red-900">Danger Zone</h3>
          </div>
          <div className="px-6 py-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
            </div>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
