export interface PickExtrasModel {
  rfcCode: string;
  people: People;
  roomFeatures: RoomFeatures[];
}

interface People {
  adult: number;
  children: number;
}

interface RoomFeatures {
  category: Category;
  features: Feature[];
}

interface Category {
  code: string;
  name: string;
}

interface Feature {
  code: string;
  name: string;
}
