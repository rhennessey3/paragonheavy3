import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { 
  evaluateRuleConditions, 
  determineSeverity,
  type LoadParams, 
  type ComplianceResponse,
  type RuleCategory,
  type MatchedRule,
} from "@/lib/compliance";
import { detectConflicts } from "@/lib/conflict-detection";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Extract state abbreviations from a route's snapped coordinates
// This is a simplified implementation - in production, you'd use proper geocoding
async function getStatesFromRoute(
  coordinates: number[][],
  mapboxToken: string
): Promise<string[]> {
  const statesSet = new Set<string>();

  // Sample points along the route (every 50 points or so)
  const sampleInterval = Math.max(1, Math.floor(coordinates.length / 20));
  const samplePoints = coordinates.filter((_, i) => i % sampleInterval === 0);

  // Add first and last points
  if (coordinates.length > 0) {
    samplePoints.unshift(coordinates[0]);
    samplePoints.push(coordinates[coordinates.length - 1]);
  }

  for (const [lng, lat] of samplePoints) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=region&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features?.[0]?.properties?.short_code) {
          // short_code format: "US-IL" for Illinois
          const code = data.features[0].properties.short_code;
          if (code.startsWith("US-")) {
            statesSet.add(code.substring(3));
          }
        }
      }
    } catch (error) {
      console.error("Error geocoding point:", error);
    }
  }

  return Array.from(statesSet);
}

export async function POST(request: Request) {
  try {
    const authObj = await auth();
    if (!authObj.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { route, load } = body as {
      route: { type: string; coordinates: number[][] };
      load: LoadParams;
    };

    if (!route?.coordinates || !load) {
      return NextResponse.json(
        { error: "Missing route or load parameters" },
        { status: 400 }
      );
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      return NextResponse.json(
        { error: "Mapbox token not configured" },
        { status: 500 }
      );
    }

    // Get states the route passes through
    const stateAbbreviations = await getStatesFromRoute(route.coordinates, mapboxToken);

    if (stateAbbreviations.length === 0) {
      return NextResponse.json({
        routeId: crypto.randomUUID(),
        aggregatedSummary: {
          totalJurisdictions: 0,
          totalRules: 0,
          escortRequired: false,
          curfewsDetected: false,
          permitsRequired: [],
        },
        segments: [],
        jurisdictionRules: [],
      } as ComplianceResponse);
    }

    // Fetch published rules for these states
    const jurisdictionData = await convex.query(
      api.compliance.getPublishedRulesForStates,
      { stateAbbreviations }
    );

    // Evaluate rules against load parameters
    let totalRules = 0;
    let escortRequired = false;
    let curfewsDetected = false;
    const permitsRequired: string[] = [];
    
    // Collect all matched rules for conflict detection
    const allMatchedRules: MatchedRule[] = [];

    const jurisdictionRules = jurisdictionData.map((jd) => {
      const applicableRules = jd.rules
        .map((rule: any) => {
          const { triggered, reasons } = evaluateRuleConditions(rule.conditions, load);
          
          if (!triggered) return null;

          totalRules++;

          // Track aggregate info
          if (rule.category === "escort_requirement") {
            escortRequired = true;
          }
          if (rule.category === "time_restriction") {
            curfewsDetected = true;
          }
          if (rule.category === "permit_requirement" && rule.conditions?.permitType) {
            if (!permitsRequired.includes(rule.conditions.permitType)) {
              permitsRequired.push(rule.conditions.permitType);
            }
          }

          const matchedRule: MatchedRule = {
            id: rule._id as string,
            category: rule.category as RuleCategory,
            title: rule.title as string,
            severity: determineSeverity(rule.category, rule.conditions),
            summary: rule.summary as string,
            conditions: rule.conditions,
            jurisdictionId: jd.jurisdictionId,
            jurisdictionName: jd.jurisdictionName,
            priority: rule.conditions?.priority,
            requirement: rule.conditions?.requirement,
            requirementType: rule.conditions?.requirementType,
          };
          
          // Add to all matched rules for conflict detection
          allMatchedRules.push(matchedRule);

          return {
            id: matchedRule.id,
            category: matchedRule.category,
            title: matchedRule.title,
            severity: matchedRule.severity,
            summary: matchedRule.summary,
            conditions: matchedRule.conditions,
          };
        })
        .filter((rule): rule is NonNullable<typeof rule> => rule !== null);

      return {
        jurisdictionId: jd.jurisdictionId,
        jurisdictionName: jd.jurisdictionName,
        rules: applicableRules,
      };
    }).filter((jr) => jr.rules.length > 0);

    // Run conflict detection on all matched rules
    const conflictAnalysis = detectConflicts(allMatchedRules);

    const response: ComplianceResponse = {
      routeId: crypto.randomUUID(),
      aggregatedSummary: {
        totalJurisdictions: jurisdictionRules.length,
        totalRules,
        escortRequired,
        escortDetails: escortRequired ? "See jurisdiction-specific requirements" : undefined,
        curfewsDetected,
        permitsRequired,
        hasConflicts: conflictAnalysis.hasConflicts,
        totalConflicts: conflictAnalysis.groups.length,
      },
      segments: [], // Segment-level detail for Phase 2
      jurisdictionRules,
      conflicts: conflictAnalysis,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Compliance route check error:", error);
    return NextResponse.json(
      { error: "Failed to check route compliance" },
      { status: 500 }
    );
  }
}
