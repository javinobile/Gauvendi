import {GuestInformationInput} from "@core/graphql/generated/graphql";

export interface BookerForSomeoneModel extends GuestInformationInput {
  bookForAnother?: boolean;
}
