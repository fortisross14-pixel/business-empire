import { CAMPAIGN_CASES, campaignDaysRemaining, campaignStars, createCampaignWorld } from "../src/engine/campaign";
import { step } from "../src/engine/tick";
import { roomTouchesConnectedPath } from "../src/engine/infrastructure";

for (const definition of CAMPAIGN_CASES) {
  const world = createCampaignWorld(definition.id);
  if (world.mode !== "campaign" || world.campaign?.caseId !== definition.id) throw new Error(`${definition.id}: campaign runtime was not created`);
  if (!world.brands.length || !world.player.operatingRooms.length || !world.player.personnel.length) throw new Error(`${definition.id}: live-company seed is incomplete`);
  if (world.player.operatingRooms.some((room) => !roomTouchesConnectedPath(world, room))) throw new Error(`${definition.id}: seeded campus contains a disconnected facility`);
  if (definition.stars.length !== 3) throw new Error(`${definition.id}: expected three grading tiers`);
  step(world);
  if (world.tick !== 1 || campaignDaysRemaining(world) !== definition.durationDays - 1) throw new Error(`${definition.id}: campaign clock did not advance`);
  const stars = campaignStars(world);
  if (stars < 0 || stars > 3) throw new Error(`${definition.id}: invalid star evaluation`);
}

console.log(`Campaign smoke test passed: ${CAMPAIGN_CASES.length} live cases created and advanced.`);
