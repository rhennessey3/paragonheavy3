# Jurisdiction-Specific Permit Field Configuration

## Overview

The permit management system now supports configuring permit field requirements (required/optional/hidden) on a per-jurisdiction basis. This allows you to customize which fields appear on permit forms depending on the state or county where the permit is being issued.

## Key Features

### 1. **Jurisdiction-Specific Permit Types**
- Create permit types that are specific to a state, county, or jurisdiction
- Create global permit types that apply to all jurisdictions
- Filter and view permit types by jurisdiction

### 2. **Field Configuration Per Jurisdiction**
- Configure which fields are required, optional, or hidden for each permit type
- Different jurisdictions can have different requirements for the same permit category
- For example:
  - Pennsylvania's "Single Trip Permit" may require an escort field
  - California's "Single Trip Permit" may have the escort field as optional
  - Texas's "Single Trip Permit" may hide the escort field entirely

### 3. **Copy Field Configurations**
- When creating a new jurisdiction-specific permit type, you can copy field configurations from an existing permit type
- This makes it easy to create state-specific variants by starting with a base configuration and then customizing it

## How to Use

### Creating a Global Permit Type

1. Navigate to **Dashboard > Compliance > Permit Types**
2. Click **Add Permit Type**
3. Fill in the details:
   - **Key**: Unique identifier (e.g., `single_trip`)
   - **Label**: Display name (e.g., "Single Trip Permit")
   - **Description**: Brief description
   - **Jurisdiction**: Leave blank for global
4. Optionally select an existing permit type to copy field configurations from
5. Click **Create**

### Creating a Jurisdiction-Specific Permit Type

1. Navigate to **Dashboard > Compliance > Permit Types**
2. Click **Add Permit Type**
3. Fill in the details:
   - **Key**: Unique identifier (e.g., `pa_single_trip`)
   - **Label**: Display name (e.g., "Pennsylvania Single Trip Permit")
   - **Description**: Brief description
   - **Jurisdiction**: Select a state (e.g., Pennsylvania)
4. Optionally copy configurations from:
   - The global version of the permit type, or
   - Another state's configuration to use as a starting point
5. Click **Create**

### Configuring Fields for a Permit Type

1. From the Permit Types list, click **Configure Fields** on any permit type
2. The field configuration page shows:
   - The permit type name and jurisdiction (if applicable)
   - All available system fields organized by category
   - Current requirement status for each field
3. For each field, click the appropriate button to set it as:
   - **Required**: Must be filled out (red indicator)
   - **Optional**: Can be filled out (blue indicator)
   - **Hidden**: Not shown on the form (gray indicator)
4. Changed fields are highlighted in yellow
5. Click **Save [N] Changes** to persist your configuration

### Filtering Permit Types by Jurisdiction

1. Navigate to **Dashboard > Compliance > Permit Types**
2. Use the **Filter by** dropdown to view:
   - **All Jurisdictions**: Show all permit types
   - **Global**: Show only global permit types (not specific to any jurisdiction)
   - **[State Name]**: Show only permit types for that specific state

## Use Cases

### Example 1: State-Specific Requirements

Pennsylvania requires escort vehicles for loads over 14' wide on certain roads, while other states may have different thresholds.

**Solution:**
1. Create a global "Single Trip Permit" with common fields
2. Create a Pennsylvania-specific "Single Trip Permit"
3. Copy field configuration from the global version
4. Make the "Escort Required" field **required** for Pennsylvania
5. Make the "Escort Company" and "Escort Contact" fields **required** for Pennsylvania
6. Other states can use the global version or have their own configurations

### Example 2: Different Permit Processes

Some states require a "Requested Start Date" separate from "Start Date", while others only need one date field.

**Solution:**
1. Create state-specific permit types for states with unique requirements
2. Configure "Requested Start Date" as:
   - **Required** for states that need both dates
   - **Hidden** for states that only need one date

### Example 3: Regional Variations

Create permit types for specific permit districts or regions within a state.

**Solution:**
1. Create district-specific jurisdictions (e.g., "District 10")
2. Create permit types assigned to those districts
3. Configure fields specific to that district's requirements

## Data Model

### Database Schema

```typescript
permitTypes: {
  _id: Id<"permitTypes">,
  jurisdictionId: Id<"jurisdictions"> | undefined, // null = global
  key: string,
  label: string,
  description?: string,
  // ... other fields
}

permitTypeFields: {
  permitTypeId: Id<"permitTypes">,
  systemFieldId: Id<"systemFields">,
  requirement: "required" | "optional" | "hidden",
  sortOrder: number,
}

jurisdictions: {
  _id: Id<"jurisdictions">,
  name: string,
  type: "state" | "county" | "city" | "district" | "region" | "custom",
  abbreviation?: string,
  // ... other fields
}
```

### API Functions

**Queries:**
- `api.permitTypes.getAllPermitTypes()` - Get all permit types with jurisdiction info
- `api.permitTypes.getPermitTypeStats()` - Get permit types with field statistics and jurisdiction info
- `api.permitTypes.getPermitTypeById({ permitTypeId })` - Get a single permit type with jurisdiction
- `api.permitTypes.getPermitTypeFields({ permitTypeId })` - Get field configurations for a permit type
- `api.compliance.getJurisdictions({ type })` - Get jurisdictions by type

**Mutations:**
- `api.permitTypes.createPermitType({ key, label, description, jurisdictionId })` - Create a permit type
- `api.permitTypes.copyPermitTypeFields({ sourcePermitTypeId, targetPermitTypeId })` - Copy field configs
- `api.permitTypes.bulkSetFieldRequirements({ permitTypeId, fields })` - Update field requirements
- `api.permitTypes.deletePermitType({ permitTypeId })` - Soft delete a permit type

## Best Practices

1. **Start with Global Types**: Create global permit types first with sensible defaults that work for most jurisdictions

2. **Create State Variants as Needed**: Only create state-specific permit types when requirements differ significantly

3. **Use Descriptive Keys**: Use clear, descriptive keys like `pa_single_trip` (Pennsylvania) or `ca_superload` (California)

4. **Copy Before Customizing**: When creating state-specific types, copy from the global version to maintain consistency

5. **Document State Requirements**: Use the description field to note why a state-specific version exists

6. **Regular Review**: Periodically review permit types to ensure they're still accurate as state regulations change

## Future Enhancements

Potential future improvements to this system:

- **County-level configurations**: Extend to support county-specific permit types
- **Field validation rules**: Add custom validation rules per jurisdiction
- **Historical tracking**: Track changes to field requirements over time
- **Bulk operations**: Update multiple jurisdiction configurations at once
- **Import/Export**: Import permit configurations from other sources or export for backup
- **Comparison view**: Compare field requirements across jurisdictions side-by-side

## Related Documentation

- [Environment Setup](./ENVIRONMENT_SETUP.md)
- [Pennsylvania Escort Rules Example](./PENNSYLVANIA_ESCORT_RULES_EXAMPLE.md)
- [Compliance System Implementation](./IMPLEMENTATION_SUMMARY_LANE_DIRECTION.md)


