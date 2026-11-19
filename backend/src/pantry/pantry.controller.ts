import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CheckStockDto } from './dto/check-stock.dto';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { PantryItem } from './entities/pantry-item.entity';
import { StockLevel } from './entities/stock-level';
import { PantryService } from './pantry.service';

/** HTTP routes under `/pantry` for the ingredients the signed-in user has on hand. */
@Controller('pantry')
export class PantryController {
  constructor(private readonly pantryService: PantryService) {}

  /** `GET /pantry`: every item in the user's pantry. */
  @Get()
  public findAll(@CurrentUserId() userId: string): Promise<PantryItem[]> {
    return this.pantryService.findAll(userId);
  }

  /** `POST /pantry`: adds an ingredient, combining it with the same ingredient if already there. */
  @Post()
  public add(
    @CurrentUserId() userId: string,
    @Body() dto: CreatePantryItemDto,
  ): Promise<PantryItem> {
    return this.pantryService.add(userId, dto);
  }

  /**
   * `POST /pantry/stock-check`: how much of each given ingredient the pantry holds. A POST because
   * the ingredient list is sent in the body; nothing is changed.
   */
  @Post('stock-check')
  @HttpCode(200)
  public checkStock(
    @CurrentUserId() userId: string,
    @Body() dto: CheckStockDto,
  ): Promise<StockLevel[]> {
    return this.pantryService.checkStock(userId, dto);
  }

  /** `PATCH /pantry/:itemId`: renames an item or changes its amount. */
  @Patch(':itemId')
  public update(
    @CurrentUserId() userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePantryItemDto,
  ): Promise<PantryItem> {
    return this.pantryService.update(userId, itemId, dto);
  }

  /** `DELETE /pantry/:itemId`: removes an item and responds 204 No Content. */
  @Delete(':itemId')
  @HttpCode(204)
  public remove(@CurrentUserId() userId: string, @Param('itemId') itemId: string): Promise<void> {
    return this.pantryService.remove(userId, itemId);
  }
}
