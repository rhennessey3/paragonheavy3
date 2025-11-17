# 🛠️ PARAGON HEAVY - TECHNICAL IMPLEMENTATION GUIDE

## Quick Start Commands

```bash
# Initialize Next.js project
npx create-next-app@latest paragonheavy --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install core dependencies
npm install @clerk/nextjs convex @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react @hookform/resolvers react-hook-form zod sonner

# Install shadcn/ui CLI and components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card form input label select textarea toast

# Initialize Convex
npx convex dev
```

---

## 📁 Complete File Structure

```
paragonheavy/
├── .env.local
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── components.json
├── package.json
├── tsconfig.json
├── README.md
├── 
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── page.tsx
│   │   ├── sign-up/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── shipper/
│   │   │   └── page.tsx
│   │   ├── carrier/
│   │   │   └── page.tsx
│   │   ├── escort/
│   │   │   └── page.tsx
│   │   └── loads/
│   │       ├── create/
│   │       │   └── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   ├── org-selection/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── middleware.ts
│   └── page.tsx
├── 
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── forms/
│   │   ├── create-load-form.tsx
│   │   ├── create-org-form.tsx
│   │   └── update-load-form.tsx
│   ├── layouts/
│   │   ├── dashboard-layout.tsx
│   │   └── auth-layout.tsx
│   ├── loads/
│   │   ├── load-card.tsx
│   │   ├── load-detail-panel.tsx
│   │   ├── load-list.tsx
│   │   └── load-status-badge.tsx
│   ├── org/
│   │   ├── org-switcher.tsx
│   │   ├── org-stats.tsx
│   │   └── sidebar-nav.tsx
│   └── error-boundary.tsx
├── 
├── convex/
│   ├── _generated/
│   │   ├── api.d.ts
│   │   ├── dataModel.d.ts
│   │   └── server.d.ts
│   ├── schema.ts
│   ├── organizations.ts
│   ├── loads.ts
│   ├── users.ts
│   └── http.ts
├── 
├── hooks/
│   ├── use-auth.ts
│   ├── use-organization.ts
│   ├── use-loads.ts
│   └── use-realtime.ts
├── 
├── lib/
│   ├── utils.ts
│   ├── validations.ts
│   ├── constants.ts
│   └── convex.ts
├── 
├── types/
│   ├── organization.ts
│   ├── load.ts
│   └── user.ts
└── 
└── public/
    ├── next.svg
    └── vercel.svg
```

---

## 🔧 Configuration Files

### Environment Variables (.env.example)
```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_CLERK_ORG_INVITATION_URL=/org-invitation

# Convex Configuration
CONVEX_DEPLOYMENT=convex-dev-...
NEXT_PUBLIC_CONVEX_URL=https://massive-mongoose-123.convex.cloud

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Tailwind Configuration (tailwind.config.js)
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### Components Configuration (components.json)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## 🧩 Core Components

### Main Layout (app/layout.tsx)
```tsx
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Paragon Heavy",
  description: "Heavy haul logistics platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### Middleware (app/middleware.ts)
```tsx
import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: ["/sign-in", "/sign-up", "/"],
  afterAuth: (auth, req) => {
    // Handle user without organization
    if (auth.userId && !auth.orgId && !req.nextUrl.pathname.includes('/org-selection')) {
      const orgSelectionUrl = new URL('/org-selection', req.url);
      return NextResponse.redirect(orgSelectionUrl);
    }

    // Redirect authenticated users away from auth pages
    if (auth.userId && auth.orgId && (req.nextUrl.pathname.includes('/sign-in') || req.nextUrl.pathname.includes('/sign-up'))) {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }
  },
});

export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
```

### Dashboard Layout (components/layouts/dashboard-layout.tsx)
```tsx
"use client";

import { useState } from "react";
import { OrgSwitcher } from "@/components/org/org-switcher";
import { SidebarNav } from "@/components/org/sidebar-nav";
import { UserButton } from "@clerk/nextjs";
import { LoadDetailPanel } from "@/components/loads/load-detail-panel";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-gray-50">
      <SidebarNav />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <OrgSwitcher />
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex">
            <div className="flex-1 p-6 overflow-auto">
              {children}
            </div>
            <LoadDetailPanel 
              loadId={selectedLoadId}
              onClose={() => setSelectedLoadId(null)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
```

---

## 📝 Forms & Validation

### Load Creation Form (components/forms/create-load-form.tsx)
```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

const loadFormSchema = z.object({
  loadNumber: z.string().min(1, "Load number is required"),
  origin: z.object({
    address: z.string().min(1, "Origin address is required"),
    city: z.string().min(1, "Origin city is required"),
    state: z.string().min(2, "State is required"),
    zip: z.string().min(5, "ZIP code is required"),
  }),
  destination: z.object({
    address: z.string().min(1, "Destination address is required"),
    city: z.string().min(1, "Destination city is required"),
    state: z.string().min(2, "State is required"),
    zip: z.string().min(5, "ZIP code is required"),
  }),
  dimensions: z.object({
    height: z.number().min(0, "Height is required"),
    width: z.number().min(0, "Width is required"),
    length: z.number().min(0, "Length is required"),
    weight: z.number().min(0, "Weight is required"),
    description: z.string().optional(),
  }),
  pickupDate: z.number().optional(),
  deliveryDate: z.number().optional(),
  specialRequirements: z.string().optional(),
  contactInfo: z.object({
    name: z.string().min(1, "Contact name is required"),
    phone: z.string().min(1, "Contact phone is required"),
    email: z.string().email("Valid email is required"),
  }).optional(),
});

type LoadFormValues = z.infer<typeof loadFormSchema>;

export function CreateLoadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createLoad = useMutation(api.loads.createLoad);

  const form = useForm<LoadFormValues>({
    resolver: zodResolver(loadFormSchema),
    defaultValues: {
      loadNumber: "",
      origin: {
        address: "",
        city: "",
        state: "",
        zip: "",
      },
      destination: {
        address: "",
        city: "",
        state: "",
        zip: "",
      },
      dimensions: {
        height: 0,
        width: 0,
        length: 0,
        weight: 0,
      },
      specialRequirements: "",
    },
  });

  const onSubmit = async (data: LoadFormValues) => {
    setIsSubmitting(true);
    try {
      await createLoad(data);
      toast.success("Load created successfully!");
      form.reset();
    } catch (error) {
      toast.error("Failed to create load. Please try again.");
      console.error("Error creating load:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Load</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Load Number */}
            <FormField
              control={form.control}
              name="loadNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Load Number</FormLabel>
                  <FormControl>
                    <Input placeholder="LD-2024-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Origin Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Origin</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="origin.address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="origin.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="origin.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="origin.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Destination Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Destination</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="destination.address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="456 Oak Ave" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Los Angeles" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination.zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="90210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dimensions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dimensions</h3>
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="dimensions.height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (ft)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="8"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensions.width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width (ft)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="8"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensions.length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length (ft)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="40"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dimensions.weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (lbs)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="40000"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="dimensions.description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details about the load..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Special Requirements */}
            <FormField
              control={form.control}
              name="specialRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special handling requirements..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating..." : "Create Load"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

---

## 🔐 Authentication & Organization Management

### Organization Selection (app/org-selection/page.tsx)
```tsx
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  type: z.enum(["shipper", "carrier", "escort"]),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

type CreateOrgValues = z.infer<typeof createOrgSchema>;

export default function OrgSelectionPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  
  const organizations = useQuery(api.organizations.getUserOrganizations);
  const createOrganization = useMutation(api.organizations.createOrganization);

  const form = useForm<CreateOrgValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
      type: "shipper",
      address: "",
      phone: "",
      email: user?.emailAddresses[0]?.emailAddress || "",
    },
  });

  const handleCreateOrganization = async (data: CreateOrgValues) => {
    setIsCreating(true);
    try {
      await createOrganization({
        name: data.name,
        type: data.type,
        metadata: {
          address: data.address,
          phone: data.phone,
          email: data.email,
        },
      });
      toast.success("Organization created successfully!");
      router.refresh();
    } catch (error) {
      toast.error("Failed to create organization. Please try again.");
      console.error("Error creating organization:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Paragon Heavy</h1>
          <p className="mt-2 text-gray-600">Select an organization or create a new one to get started</p>
        </div>

        {/* Existing Organizations */}
        {organizations && organizations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div key={org._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{org.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{org.type}</p>
                    </div>
                    <Button onClick={() => window.location.href = `/dashboard`}>
                      Enter Organization
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create New Organization */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateOrganization)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Heavy Haul" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="shipper">Shipper</SelectItem>
                          <SelectItem value="carrier">Carrier</SelectItem>
                          <SelectItem value="escort">Escort</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State 12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isCreating} className="w-full">
                  {isCreating ? "Creating..." : "Create Organization"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 📊 Dashboard Pages

### Shipper Dashboard (app/(dashboard)/shipper/page.tsx)
```tsx
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { OrgStats } from "@/components/org/org-stats";
import { LoadList } from "@/components/loads/load-list";
import { CreateLoadButton } from "@/components/loads/create-load-button";

export default function ShipperDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Shipper Dashboard</h1>
          <CreateLoadButton />
        </div>
        
        <OrgStats orgType="shipper" />
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">My Loads</h2>
          <LoadList orgType="shipper" />
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### Carrier Dashboard (app/(dashboard)/carrier/page.tsx)
```tsx
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { OrgStats } from "@/components/org/org-stats";
import { LoadList } from "@/components/loads/load-list";

export default function CarrierDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Carrier Dashboard</h1>
        
        <OrgStats orgType="carrier" />
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Loads</h2>
          <LoadList orgType="carrier" />
        </div>
      </div>
    </DashboardLayout>
  );
}
```

---

## 🎯 Key Implementation Notes

### Security Considerations
1. **Data Isolation**: Always filter queries by `orgId`
2. **Authentication**: Verify user belongs to organization
3. **Input Validation**: Use Zod schemas for all inputs
4. **Error Handling**: Never expose internal errors to users

### Performance Optimizations
1. **Convex Indexes**: Properly index all query fields
2. **React.memo**: Use for expensive components
3. **Pagination**: Implement for large data sets
4. **Optimistic Updates**: Improve perceived performance

### Real-time Features
1. **Convex Subscriptions**: Use for live updates
2. **Toast Notifications**: Inform users of changes
3. **Status Indicators**: Show connection state
4. **Conflict Resolution**: Handle concurrent edits

### Testing Strategy
1. **Unit Tests**: Test all Convex functions
2. **Integration Tests**: Test user workflows
3. **E2E Tests**: Test critical paths
4. **Manual Testing**: Verify multi-tenant isolation

This implementation guide provides the foundation for building the Paragon Heavy Phase 1 MVP with all the necessary components, configurations, and best practices.