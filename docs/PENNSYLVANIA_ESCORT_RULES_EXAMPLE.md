# Pennsylvania Escort Rules Example

This document demonstrates how to implement Pennsylvania-style escort requirements that depend on highway lane count and direction using the compliance rule system.

## Pennsylvania Rule Overview

From PA Title 179 Oversized Loads Laws:

**Width trigger**: If width > 13 ft, pilot car positioning depends on roadway:
- **2+ lanes same direction** → pilot car **follows**
- **1 lane same direction** → pilot car **precedes** (leads)
- **If accompanied by police escort** → pilot car **follows**

## How to Create This Rule in the System

### Step 1: Navigate to Pennsylvania Jurisdiction

1. Go to Dashboard > Compliance Studio
2. Select Pennsylvania from the jurisdiction map or list
3. Click "Add New Rule"

### Step 2: Configure Basic Rule Information

- **Category**: Escort Requirement
- **Title**: "Overwidth Pilot Car Positioning (Width > 13ft)"
- **Summary**: "Pilot car positioning for loads exceeding 13 feet in width depends on lane count and police escort presence"
- **Source**: PA Code 179.10
- **Effective From**: (leave blank or set specific date)

### Step 3: Define IF Conditions

Add the primary width condition:

```
IF Width (ft) > 13
```

**Important**: Do NOT add lane count as an IF condition. Lane count determines positioning in the THEN section below.

### Step 4: Configure THEN Requirements - Front Escort

1. Toggle "Front Escort (Lead)" to **Required**
2. Set Number of escorts: **1**
3. Height pole: Check if required (optional)

### Step 5: Configure Conditional Positioning

This is the key Pennsylvania-specific part:

In the **Conditional Positioning** section:

- **When 2+ lanes (same direction)**: Select "Pilot Follows"
- **When 1 lane (same direction)**: Select "Pilot Leads"
- **When police escort present**: Select "Pilot Follows"

### Step 6: Add Notes and Save

- **Notes**: "Pennsylvania requires pilot car positioning to vary based on roadway configuration for safety"
- Click "Save & Publish"

## How It Works at Runtime

When a load with width > 13 ft is planned through Pennsylvania:

1. **System evaluates** the IF condition: Is width > 13 ft? ✓
2. **System checks route** for road segment data:
   - Detects lane count from Mapbox (motorway = 2+, secondary = 1)
   - Or uses manual override if specified
3. **System applies positioning**:
   - On I-80 (multi-lane interstate): Pilot **follows** the load
   - On Route 6 (single-lane highway): Pilot **leads** the load
   - If police escort joins: Pilot switches to **follow**

## Rule Structure in Database

The rule is stored as:

```json
{
  "jurisdictionId": "pennsylvania_id",
  "category": "escort_requirement",
  "title": "Overwidth Pilot Car Positioning (Width > 13ft)",
  "summary": "Pilot car positioning for loads exceeding 13 feet...",
  "source": "PA Code 179.10",
  "conditions": {
    "ifThen": true,
    "conditions": [
      {
        "id": "cond1",
        "attribute": "width_ft",
        "operator": ">",
        "value": 13
      }
    ],
    "requirement": {
      "front_escorts": 1,
      "rear_escorts": 0,
      "placement_conditions": {
        "when_multilane": "follow",
        "when_single_lane": "lead",
        "when_police_escort": "follow"
      }
    }
  }
}
```

## Additional Pennsylvania Rules to Model

### Rule 2: Height-Based Front and Rear Escorts

**IF** Height > 14 ft  
**THEN**:
- Front escorts: 1 (with height pole)
- Rear escorts: 1

```
Conditions: height_ft > 14
Requirement:
  - front_escorts: 1
  - front_has_height_pole: true
  - rear_escorts: 1
```

### Rule 3: Lane-Dependent Width Restrictions

**IF** num_lanes_same_direction = 1 AND width_ft > 16  
**THEN**: Route restriction (prohibited)

This would use the `route_restriction` category instead of `escort_requirement`.

## Testing the Rule

1. Create a test load with dimensions: Width 14 ft, Height 12 ft, Length 80 ft
2. Create a route through Pennsylvania with mixed roadways
3. View compliance results - should show:
   - Pilot car required (width > 13)
   - Positioning notes per road segment
4. Verify on map that segments show correct escort positioning

## Road Data Detection

The system automatically detects road attributes:

- **Motorway/Interstate** → Assumed 2+ lanes
- **Primary/Secondary roads** → Assumed 1 lane
- **Manual override** → Available in route planner

To manually set lane count:
1. Click on route segment in map view
2. Override detected lane count
3. System re-evaluates positioning

## Benefits of This Approach

1. **Flexible**: Works for any state's lane-based rules
2. **Automatic**: Detects lanes from map data when possible
3. **Manual override**: Supports edge cases
4. **Clear UI**: Visual representation of positioning logic
5. **Auditable**: Source references and notes preserved

## Related Attributes Available

For building more complex rules:

- `num_lanes_same_direction`: 1, 2, 3, 4+
- `travel_heading`: N, NE, E, SE, S, SW, W, NW
- `road_type`: two_lane, multi_lane, interstate, all
- `has_police_escort`: true/false
- `width_ft`, `height_ft`, `length_ft`: numeric values
- `on_bridge`, `urban_area`: boolean context

## Next Steps

1. Implement Pennsylvania's complete rule set
2. Test with real route data
3. Add more conditional positioning scenarios
4. Train users on creating state-specific rules






