// Background script for Frevo extension
// Handles request modification using chrome.declarativeNetRequest API with smart offset calculation

let jobsPerPage = 20; // Default value
const ruleIdBase = 1000; // Base ID for our dynamic rules

// Load initial settings
chrome.storage.sync.get(["jobsPerPage"], (data) => {
  jobsPerPage = data.jobsPerPage !== undefined ? data.jobsPerPage : 20;
  console.log("🔧 Background script loaded with jobsPerPage:", jobsPerPage);
  updateRequestRules();
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.jobsPerPage) {
    const oldValue = jobsPerPage;
    jobsPerPage = changes.jobsPerPage.newValue;
    console.log(
      `📄 Background script updated jobsPerPage from ${oldValue} to ${jobsPerPage}`
    );
    updateRequestRules();
  }
});

// Update declarativeNetRequest rules with smart offset calculation
async function updateRequestRules() {
  try {
    console.log(`🔄 Updating rules with jobsPerPage: ${jobsPerPage}`);

    // Remove all existing rules first
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map((rule) => rule.id);

    if (existingRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
      });
      console.log(`🗑️ Removed ${existingRuleIds.length} existing rules`);
    }

    // Create comprehensive rules that handle different offset scenarios
    const rules = [];

    // The strategy: Create rules for common offset patterns and map them to correct pages
    // We'll create rules for different "old" limit values (20, 50, 100) and map their offsets
    // to the correct new offsets based on our jobsPerPage

    const commonLimits = [20, 50, 100]; // Common limit values used by Freelancer
    let ruleId = ruleIdBase;

    for (const oldLimit of commonLimits) {
      // Create rules for pages 1-100 with this old limit
      for (let page = 1; page <= 100; page++) {
        const oldOffset = (page - 1) * oldLimit;
        const newOffset = (page - 1) * jobsPerPage;

        rules.push({
          id: ruleId++,
          priority: 1,
          action: {
            type: "redirect",
            redirect: {
              transform: {
                queryTransform: {
                  addOrReplaceParams: [
                    { key: "limit", value: jobsPerPage.toString() },
                    { key: "offset", value: newOffset.toString() },
                  ],
                },
              },
            },
          },
          condition: {
            urlFilter: `*://*.freelancer.com/api/projects/0.1/projects/active*limit=${oldLimit}*offset=${oldOffset}*`,
            resourceTypes: ["xmlhttprequest"],
          },
        });

        // Also create a rule without the limit parameter (defaults to 20)
        if (oldLimit === 20) {
          rules.push({
            id: ruleId++,
            priority: 1,
            action: {
              type: "redirect",
              redirect: {
                transform: {
                  queryTransform: {
                    addOrReplaceParams: [
                      { key: "limit", value: jobsPerPage.toString() },
                      { key: "offset", value: newOffset.toString() },
                    ],
                  },
                },
              },
            },
            condition: {
              urlFilter: `*://*.freelancer.com/api/projects/0.1/projects/active*offset=${oldOffset}*`,
              excludedRequestDomains: ["limit"],
              resourceTypes: ["xmlhttprequest"],
            },
          });
        }
      }
    }

    // Add a catch-all rule for requests without offset (page 1)
    rules.push({
      id: ruleId++,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          transform: {
            queryTransform: {
              addOrReplaceParams: [
                { key: "limit", value: jobsPerPage.toString() },
                { key: "offset", value: "0" },
              ],
            },
          },
        },
      },
      condition: {
        urlFilter: "*://*.freelancer.com/api/projects/0.1/projects/active*",
        resourceTypes: ["xmlhttprequest"],
      },
    });

    // Add rules in batches to avoid hitting limits
    const batchSize = 50;
    let addedRules = 0;

    for (let i = 0; i < rules.length; i += batchSize) {
      const batch = rules.slice(i, i + batchSize);
      try {
        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: batch,
        });
        addedRules += batch.length;
        console.log(
          `✅ Added batch of ${batch.length} rules (total: ${addedRules})`
        );
      } catch (error) {
        console.error(`❌ Error adding batch ${i / batchSize + 1}:`, error);
        break;
      }
    }

    console.log(
      `✅ Successfully updated ${addedRules} request rules with jobsPerPage: ${jobsPerPage}`
    );
  } catch (error) {
    console.error("❌ Error updating request rules:", error);
  }
}

console.log("✅ Background script initialized with declarativeNetRequest");
