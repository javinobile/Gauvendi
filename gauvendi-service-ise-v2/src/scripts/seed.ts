
import { AppDataSource } from "../core/database/data-source";
import { Organisation } from "../core/entities/hotel-entities/organisation.entity";
import { Brand } from "../core/entities/hotel-entities/brand.entity";
import { Hotel, HotelStatusEnum } from "../core/entities/hotel-entities/hotel.entity";
import { IdentityUser, IdentityUserStatusEnum } from "../core/entities/identity-entities/identity-user.entity";

const seed = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");

        // 1. Create Organisation
        const organisationRepo = AppDataSource.getRepository(Organisation);
        let organisation = await organisationRepo.findOne({ where: { name: "Test Organisation" } });
        if (!organisation) {
            organisation = new Organisation();
            organisation.name = "Test Organisation";
            organisation.code = "TEST_ORG";
            organisation.initialSetup = true;
            await organisationRepo.save(organisation);
            console.log("Organisation created:", organisation.id);
        } else {
            console.log("Organisation already exists:", organisation.id);
        }

        // 2. Create Brand
        const brandRepo = AppDataSource.getRepository(Brand);
        let brand = await brandRepo.findOne({ where: { name: "Test Brand" } });
        if (!brand) {
            brand = new Brand();
            brand.name = "Test Brand";
            await brandRepo.save(brand);
            console.log("Brand created:", brand.id);
        } else {
            console.log("Brand already exists:", brand.id);
        }

        // 3. Create Hotel
        const hotelRepo = AppDataSource.getRepository(Hotel);
        const validHotelCode = "GV000001";
        let hotel = await hotelRepo.findOne({ where: { code: validHotelCode } });
        if (!hotel) {
            hotel = new Hotel();
            hotel.name = "GauVendi Demo Hotel";
            hotel.code = validHotelCode;
            hotel.status = HotelStatusEnum.ACTIVE;
            hotel.organisationId = organisation.id;
            hotel.brandId = brand.id;
            // hotel.countryId = ... (skipping nullable for now if not strict)
            // hotel.baseCurrencyId = ... (skipping nullable for now)
            await hotelRepo.save(hotel);
            console.log("Hotel created:", hotel.id);
        } else {
            console.log("Hotel already exists:", hotel.id);
        }

        // 4. Create User
        const userRepo = AppDataSource.getRepository(IdentityUser);
        let user = await userRepo.findOne({ where: { username: "testuser" } });
        if (!user) {
            user = new IdentityUser();
            user.username = "testuser";
            user.emailAddress = "test@example.com";
            user.firstName = "Test";
            user.lastName = "User";
            user.status = IdentityUserStatusEnum.ACTIVE;
            user.organisationId = organisation.id;
            user.hotelId = hotel.id;
            await userRepo.save(user);
            console.log("User created:", user.id);
        } else {
            console.log("User already exists:", user.id);
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Error during seeding:", err);
        process.exit(1);
    }
};

seed();
