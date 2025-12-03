"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Settings as SettingsIcon, Users, Building2, Bell, Shield } from "lucide-react";
import TeamManagementTab from "./components/TeamManagementTab";
import GeneralSettingsTab from "./components/GeneralSettingsTab";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and preferences
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="team" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Team Management</span>
                <span className="sm:hidden">Team</span>
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">General</span>
                <span className="sm:hidden">General</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
                <span className="sm:hidden">Security</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="mt-6">
              <TeamManagementTab />
            </TabsContent>

            <TabsContent value="general" className="mt-6">
              <GeneralSettingsTab />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Configure how you receive notifications
                </p>
                <div className="p-8 text-center text-muted-foreground">
                  Notification settings coming soon
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Security Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Manage security and access controls
                </p>
                <div className="p-8 text-center text-muted-foreground">
                  Security settings coming soon
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

