import {
    IsString,
    IsNumber,
    IsInt,
    IsEnum,
    IsOptional,
    IsNotEmpty,
    MinLength,
    Length,
    Min,
    Max,
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';
import { Transform, Type, TransformFnParams } from 'class-transformer';

function IsLessThanPrice(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isLessThanPrice',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown, args: ValidationArguments) {
                    const obj = args.object as Record<string, unknown>;
                    if (value === undefined || value === null) return true;
                    return obj.price ? (value as number) < (obj.price as number) : true;
                },
                defaultMessage() {
                    return 'Discount price must be less than the original price';
                },
            },
        });
    };
}

export class CreateProductDto {
    @IsString({ message: 'SKU must be a string' })
    @IsNotEmpty({ message: 'SKU is required' })
    @Length(3, 50, { message: 'SKU is required and must be 3-50 characters' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    sku!: string;

    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty({ message: 'Name is required' })
    @MinLength(3, { message: 'Name must be at least 3 characters long' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    name!: string;

    @IsString({ message: 'Description must be a string' })
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.trim())
    description?: string;

    @IsString({ message: 'Category must be a string' })
    @IsNotEmpty({ message: 'Category is required' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    category!: string;

    @IsNumber({}, { message: 'Price must be a number' })
    @Min(0.01, { message: 'Price must be greater than 0' })
    @Type(() => Number)
    price!: number;

    @IsNumber({}, { message: 'Discount price must be a number' })
    @IsOptional()
    @Min(0, { message: 'Discount price must be greater than or equal to 0' })
    @IsLessThanPrice()
    @Type(() => Number)
    discountPrice?: number;

    @IsInt({ message: 'Quantity must be an integer' })
    @Min(0, { message: 'Quantity must be greater than or equal to 0' })
    @Type(() => Number)
    quantity!: number;

    @IsEnum(['public', 'private'], { message: 'Type must be either "public" or "private"' })
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.toLowerCase())
    type?: 'public' | 'private' = 'public';
}

export class UpdateProductDto {
    @IsString({ message: 'SKU must be a string' })
    @IsOptional()
    @Length(3, 50, { message: 'SKU must be 3-50 characters' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    sku?: string;

    @IsString({ message: 'Name must be a string' })
    @IsOptional()
    @MinLength(3, { message: 'Name must be at least 3 characters long' })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    name?: string;

    @IsString({ message: 'Description must be a string' })
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.trim())
    description?: string;

    @IsString({ message: 'Category must be a string' })
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.trim())
    category?: string;

    @IsNumber({}, { message: 'Price must be a number' })
    @IsOptional()
    @Min(0.01, { message: 'Price must be greater than 0' })
    @Type(() => Number)
    price?: number;

    @IsNumber({}, { message: 'Discount price must be a number' })
    @IsOptional()
    @Min(0, { message: 'Discount price must be greater than or equal to 0' })
    @IsLessThanPrice()
    @Type(() => Number)
    discountPrice?: number;

    @IsInt({ message: 'Quantity must be an integer' })
    @IsOptional()
    @Min(0, { message: 'Quantity must be greater than or equal to 0' })
    @Type(() => Number)
    quantity?: number;

    @IsEnum(['public', 'private'], { message: 'Type must be either "public" or "private"' })
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.toLowerCase())
    type?: 'public' | 'private';
}

export class ProductQueryDto {
    @IsInt({ message: 'Page must be an integer' })
    @IsOptional()
    @Min(1, { message: 'Page must be at least 1' })
    @Type(() => Number)
    page?: number = 1;

    @IsInt({ message: 'Limit must be an integer' })
    @IsOptional()
    @Min(1, { message: 'Limit must be at least 1' })
    @Max(100, { message: 'Limit cannot exceed 100' })
    @Type(() => Number)
    limit?: number = 10;

    @IsString()
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.trim())
    category?: string;

    @IsNumber()
    @IsOptional()
    @Min(0, { message: 'Minimum price must be at least 0' })
    @Type(() => Number)
    minPrice?: number;

    @IsNumber()
    @IsOptional()
    @Min(0, { message: 'Maximum price must be at least 0' })
    @Type(() => Number)
    maxPrice?: number;

    @IsString()
    @IsOptional()
    @Transform(({ value }: TransformFnParams) => value?.trim())
    search?: string;
}
