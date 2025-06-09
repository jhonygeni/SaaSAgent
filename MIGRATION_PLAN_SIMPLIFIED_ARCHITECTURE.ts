/**
 * MIGRATION PLAN: Simplify WhatsApp Architecture
 * 
 * FROM: agents + whatsapp_instances tables (with RLS issues)
 * TO: agents table only (stores WhatsApp data in settings JSON)
 * 
 * BENEFITS:
 * ✅ Eliminates RLS issues with whatsapp_instances table
 * ✅ Single source of truth for agent data
 * ✅ No data duplication
 * ✅ Simpler architecture
 * ✅ Better maintainability
 * 
 * IMPLEMENTATION PLAN:
 */

export const migrationPlan = {
  
  // STEP 1: Update agentService to use simplified structure
  step1: {
    description: "Replace agentService.ts with agentService-SIMPLIFIED.ts",
    files: [
      "src/services/agentService.ts → backup as agentService-OLD.ts",
      "src/services/agentService-SIMPLIFIED.ts → rename to agentService.ts"
    ],
    changes: [
      "Store WhatsApp data (phoneNumber, connected, instanceName) in settings JSON",
      "Remove dependency on whatsapp_instances table",
      "Add updateWhatsAppConnection method for convenience"
    ]
  },

  // STEP 2: Update useInstanceManager hook
  step2: {
    description: "Replace useInstanceManager with simplified version",
    files: [
      "src/hooks/whatsapp/useInstanceManager.ts → backup as useInstanceManager-OLD.ts",
      "src/hooks/whatsapp/useInstanceManager-SIMPLIFIED.ts → rename to useInstanceManager.ts"
    ],
    changes: [
      "Remove Supabase persistence in createAndConfigureInstance",
      "Update fetchUserInstances to get data from agents table",
      "Update updateInstanceStatus to update agent instead of whatsapp_instances"
    ]
  },

  // STEP 3: Update WhatsApp connection dialog
  step3: {
    description: "Modify connection dialog to update agents table directly",
    files: [
      "src/components/WhatsAppConnectionDialog.tsx"
    ],
    changes: [
      "Remove references to whatsapp_instances table",
      "Update agent via agentService.updateWhatsAppConnection when connected",
      "Use agentId directly instead of instance lookup"
    ]
  },

  // STEP 4: Update connection hooks
  step4: {
    description: "Update WhatsApp connection hooks",
    files: [
      "src/hooks/useWhatsAppConnection.ts"
    ],
    changes: [
      "Remove updateInstanceStatus calls to whatsapp_instances",
      "Update agent data directly when connection succeeds",
      "Use simplified instance manager"
    ]
  },

  // STEP 5: Clean up unused files and references
  step5: {
    description: "Remove unused whatsapp_instances references",
    files: [
      "src/services/whatsapp/dataStorage.ts - remove or modify",
      "src/services/supabaseAdmin.ts - remove whatsapp_instances methods",
      "Any other files referencing whatsapp_instances table"
    ],
    changes: [
      "Remove whatsapp_instances table queries",
      "Update dashboard to get data from agents table only",
      "Remove RLS policies related to whatsapp_instances"
    ]
  }
};

/**
 * IMPLEMENTATION STEPS FOR USER:
 */
export const implementationSteps = [
  {
    step: 1,
    title: "Backup Current Files",
    action: "Create backups of current agentService.ts and useInstanceManager.ts",
    command: `
      cp src/services/agentService.ts src/services/agentService-OLD.ts
      cp src/hooks/whatsapp/useInstanceManager.ts src/hooks/whatsapp/useInstanceManager-OLD.ts
    `
  },
  
  {
    step: 2,
    title: "Replace Core Services",
    action: "Replace with simplified versions",
    command: `
      cp src/services/agentService-SIMPLIFIED.ts src/services/agentService.ts
      cp src/hooks/whatsapp/useInstanceManager-SIMPLIFIED.ts src/hooks/whatsapp/useInstanceManager.ts
    `
  },
  
  {
    step: 3,
    title: "Test the Changes",
    action: "Test agent creation and WhatsApp connection",
    notes: [
      "Create a new agent",
      "Connect WhatsApp instance", 
      "Verify data is stored in agents table only",
      "Check that agent appears in dashboard after refresh"
    ]
  },
  
  {
    step: 4,
    title: "Clean Up (Optional)",
    action: "Remove unused whatsapp_instances references",
    notes: [
      "Review and remove whatsapp_instances queries",
      "Update any remaining dashboard components",
      "Consider dropping whatsapp_instances table if no longer needed"
    ]
  }
];

/**
 * DATA MIGRATION (if needed):
 * If you have existing data in whatsapp_instances table that you want to preserve:
 */
export const dataMigrationSQL = `
-- SQL to migrate existing whatsapp_instances data to agents.settings
-- Run this in Supabase SQL Editor if you have important data to preserve

UPDATE agents 
SET settings = jsonb_set(
  COALESCE(settings, '{}'),
  '{phone_number}',
  to_jsonb(wi.phone_number)
)
FROM whatsapp_instances wi
WHERE agents.instance_name = wi.name 
  AND agents.user_id = wi.user_id
  AND wi.phone_number IS NOT NULL;

UPDATE agents 
SET settings = jsonb_set(
  COALESCE(settings, '{}'),
  '{connected}',
  to_jsonb(wi.status = 'connected')
)
FROM whatsapp_instances wi
WHERE agents.instance_name = wi.name 
  AND agents.user_id = wi.user_id;

-- Optional: Drop whatsapp_instances table after migration
-- DROP TABLE IF EXISTS whatsapp_instances;
`;

/**
 * ROLLBACK PLAN (if something goes wrong):
 */
export const rollbackPlan = `
// If you need to rollback:
1. Restore backed up files:
   cp src/services/agentService-OLD.ts src/services/agentService.ts
   cp src/hooks/whatsapp/useInstanceManager-OLD.ts src/hooks/whatsapp/useInstanceManager.ts

2. Restart the development server

3. Your original architecture will be restored
`;

console.log("Migration plan created. Review the steps above before implementing.");
