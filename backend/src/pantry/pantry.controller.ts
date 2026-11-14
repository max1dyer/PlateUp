import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { PantryItem } from './entities/pantry-item.entity';
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
