import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { DestinationManagement } from "@/pages/destination/DestinationManagement";
import { HeldUpManagement } from "./HeldUpManagement";

export const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage destinations and held up rates."
      />
      <Tabs defaultValue="destinations">
        <TabsList>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="heldup">Held Up</TabsTrigger>
        </TabsList>
        <TabsContent value="destinations" className="mt-4">
          <DestinationManagement embedded />
        </TabsContent>
        <TabsContent value="heldup" className="mt-4">
          <HeldUpManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
