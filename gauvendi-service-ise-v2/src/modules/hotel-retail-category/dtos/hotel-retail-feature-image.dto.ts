import { FileLibraryDto } from "./file-library.dto";

export class HotelRetailFeatureImageDto {
  id?: string;
  description?: string;
  mainImage?: boolean;
  imageId?: string;
  image?: FileLibraryDto;

  // Custom getter method equivalent to Java's getImageUrl()
  get imageUrl(): string | undefined {
    return this.image?.url;
  }
}
