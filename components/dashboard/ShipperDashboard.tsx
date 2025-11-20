import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ShipperDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">0</p>
            <p className="text-sm text-muted-foreground mt-2">Loads in transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">0</p>
            <p className="text-sm text-muted-foreground mt-2">Awaiting carrier response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">$0</p>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
          </CardContent>
        </Card>
      </div>
      <div className="p-4 border rounded-lg bg-muted/10">
        <h3 className="font-semibold mb-2">Shipper Actions</h3>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
          Create New Load
        </button>
      </div>
    </div>
  );
}