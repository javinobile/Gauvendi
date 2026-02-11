// import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
// import { ConfigService } from "@nestjs/config";
// import { InjectConnection, InjectModel } from "@nestjs/mongoose";
// import { Connection, Model } from "mongoose";
// import { Auth0Service } from "src/core/auth/auth0.service";
// import { OrganizationsService } from "../organizations/organizations.service";
// import { PropertiesService } from "../properties/properties.service";
// import { PropertyUsers, PropertyUsersSchemaName } from "../property_users/property_users.schema";
// import { RoleEnum } from "../roles/roles.schema";
// import { RolesService } from "../roles/roles.service";
// import { SignupPayload } from "./auth.dto";

// @Injectable()
// export class AuthService {
//   constructor(
//     @InjectConnection() private readonly connection: Connection,
//     private readonly auth0Service: Auth0Service,
//     private readonly configService: ConfigService,
//     private readonly orgService: OrganizationsService,
//     private readonly propertiesService: PropertiesService,
//     private readonly rolesService: RolesService,
//     @InjectModel(PropertyUsersSchemaName) private propertyUsersModel: Model<PropertyUsers>
//   ) {}

//   async signup(body: SignupPayload) {
//     const session = await this.connection.startSession();
//     session.startTransaction();

//     let auth0User;

//     try {
//       // Step 1: Create Auth0 user first (external API, not part of DB transaction)
//       try {
//         auth0User = await this.auth0Service.createUser({
//           email: body.emailAddress,
//           password: body.password,
//           given_name: body.firstName,
//           family_name: body.lastName,
//           user_metadata: {
//             club_name: body.clubName,
//             role: RoleEnum.ADMIN,
//           },
//         });
//       } catch (error) {
//         throw new HttpException(error?.response?.data?.message || "Failed to create Auth0 user", HttpStatus.INTERNAL_SERVER_ERROR);
//       }

//       // Step 2: Create all database records within a transaction
//       const org = await this.orgService.create({ name: body.clubName });
//       const property = await this.propertiesService.create({
//         org_id: org._id.toString(),
//         name: body.clubName,
//         email_address: body.emailAddress,
//       });

//       // Step 3: Create property user
//       await this.propertyUsersModel.create({
//         property_id: property._id,
//         user_id: auth0User.user_id,
//       });

//       const adminRole = await this.rolesService.findOneByCode(RoleEnum.ADMIN);

//       // Update Auth0 user with metadata
//       await this.auth0Service.updateUserById(auth0User.user_id, {
//         user_metadata: {
//           club_name: body.clubName,
//           org_id: org._id.toString(),
//           property_id: property._id.toString(),
//           role: RoleEnum.ADMIN,
//           role_id: adminRole?._id?.toString(),
//         },
//       });

//       // Commit the transaction
//       await session.commitTransaction();
//       return {
//         auth0User,
//         organization: org,
//         property,
//       };
//     } catch (error) {
//       // Rollback the database transaction
//       await session.abortTransaction();

//       // Compensating transaction: Delete Auth0 user if it was created
//       if (auth0User?.user_id) {
//         try {
//           await this.auth0Service.deleteUserById(auth0User.user_id);
//         } catch (deleteError) {
//           console.error("Failed to delete Auth0 user during rollback:", deleteError);
//         }
//       }

//       console.error("Signup transaction failed:", error);
//       throw new HttpException(error?.message || "Failed to complete signup", error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
//     } finally {
//       // Always end the session
//       session.endSession();
//     }
//   }
// }
