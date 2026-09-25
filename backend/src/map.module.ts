import { Module } from "@nestjs/common";

import { MapController } from "./controllers/map.controller";
import { MapService } from "./services/map.service";

@Module({
  controllers: [MapController],
  providers: [MapService],
  exports: [MapService],
})
export class MapModule {}
