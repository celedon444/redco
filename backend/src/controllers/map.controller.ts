import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { MapService } from "../services/map.service";

@ApiTags("Mapa de afectación")
@Controller("map")
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get("overview")
  @ApiOperation({
    summary: "Resumen del mapa de emergencias",
    description:
      "Devuelve el sismo activo más reciente con su epicentro, las zonas de " +
      "afectación por nivel y los recursos desplegados (hospitales, " +
      "bomberos, ambulancias, unidades de rescate) en formato GeoJSON.",
  })
  @ApiResponse({
    status: 200,
    description: "Datos del mapa obtenidos correctamente.",
  })
  @ApiResponse({
    status: 404,
    description: "No hay un sismo registrado.",
  })
  async overview() {
    return this.mapService.getOverview();
  }
}
