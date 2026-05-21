import { Controller, Get } from "@nestjs/common";
import { getModeMetadata } from "@onecard/rewards-engine";
import type { RoutingMode } from "@onecard/shared-types";

@Controller()
export class AppController {
  @Get("health")
  health() {
    return { status: "ok", service: "onecard-api" };
  }

  /** Lists routing-mode tradeoffs for dashboard / docs */
  @Get("routing-modes")
  routingModes() {
    const modes: RoutingMode[] = [
      "network_dependent",
      "closed_loop",
      "virtual_provisioning",
    ];
    return modes.map((mode) => getModeMetadata(mode));
  }
}
