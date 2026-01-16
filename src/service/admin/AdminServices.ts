import { AppErrors } from "../../errors/app.errors";
import { Appointment } from "../../models/user/appointment";
import { User } from "../../models/user/user.model";
import { AppointmentService } from "../../models/vendor/appointment_service.model";
import Service from "../../models/vendor/service.model";
import { Shop } from "../../models/vendor/shop.model";
import { Roles, Status } from "../../utils/enum.utils";
import { CustomerServies } from "../user/customer.service";
import { Op } from "sequelize";
import HelperFunctions from "../../utils/helper_functions";
import { da } from "zod/v4/locales";
import { Barber } from "../../models/vendor/barber.model";
import ShopBankDetails from "../../models/vendor/shop_bank_details";
import { ShopKycDetail } from "../../models/vendor/shop_kyc.model";
import { PaginationReqMeta } from "../../utils/pagination.utils";
import { ShopLocation } from "../../models/vendor/shop_location";
import { open, stat } from "fs";

export class AdminServices {


    static async getAllVendorShops(data: any, paginationQuery: PaginationReqMeta): Promise<Shop[]> {
        try {

            const venodors = await User.findAll({ where: { role: Roles.VENDOR }, offset: paginationQuery.offset, limit: paginationQuery.limit })

            let userIds = venodors.map(ven => ven.getDataValue('id'));
            const whereClause: any = { user_id: userIds, ...data };

            const shops = await Shop.findAll({
                where: whereClause,
                include: AdminServiceIncludes.allVendorShopInclude()
            });

            const formattedResponse = shops.map((shopInstance) => {
                const shop = shopInstance.get({ plain: true }) as any;

                const appointments = shop.appointments ?? [];

                const shopServices = shop.shop_services ?? [];

                const serviceNames = shopServices.map((serv: any) => serv.name);

                let totalEarnings = 0;

                for (const appointment of appointments) {
                    const services = appointment.services ?? [];

                    totalEarnings += services.reduce(
                        (sum: number, service: any) => sum + (service.price ?? 0),
                        0
                    );
                }

                const shopOwner = shop.shop_user;

                const shopOwnerName = `${shopOwner.first_name} ${shopOwner.last_name}`;
                const shopOwnerMobile = shop.mobile;

                delete shop.appointments;
                delete shop.services;
                delete shop.shop_services;
                delete shop.shop_user;

                return {
                    ...shop,
                    shop_owner_name: shopOwnerName,
                    shop_owner_mobile: shopOwnerMobile,
                    services: serviceNames,
                    total_earning: totalEarnings,
                };
            });

            return formattedResponse;
        } catch (error) {
            throw new AppErrors(error);
        }
    }

    static async verifyVendorShop(shopId: string): Promise<void> {
        try {
            const shop = await Shop.findOne({ where: { id: shopId } });
            if (!shop) {
                throw new AppErrors("No shop exist with the given Id")
            }

            shop.isVerified = !shop.isVerified;
            await shop.save();
        } catch (error: any) {
            throw new AppErrors(error.message)
        }
    }

    static async getShopDetailById(shopId: string): Promise<any> {
        try {

            const shop = await Shop.findOne({
                where: { id: shopId },
                include: AdminServiceIncludes.shopDetailByIdInclude()
            });
            if (!shop) {
                throw new AppErrors("No shop exist with the given Id")
            }


            const shopPlain = shop.get({ plain: true });

            const totalShopCount = shopPlain.shop_owner.shops.length;
            delete shopPlain.shop_owner.shops;


            const response = {
                shop_details: {
                    id: shopPlain.id,
                    has_verified_bank: shopPlain.shop_bank_details !== null || shopPlain.shop_bank_details !== undefined,
                    has_verified_kyc: shopPlain.shop_kyc_details !== null || shopPlain.shop_kyc_details !== undefined,
                    isVerified: shopPlain.isVerified,
                    status: shopPlain.status,
                    weekly_off_day: shopPlain.weekly_off_day,
                    opening_time: shopPlain.opening_time,
                    closing_time: shopPlain.closing_time,
                    shop_name: shopPlain.shop_name,
                    shop_description: shopPlain.shop_description,
                    total_shop_count: totalShopCount,
                    createdAt: shopPlain.createdAt,
                    updatedAt: shopPlain.updatedAt,
                },
                // recent_appointments: recentAppointments,
                shop_owner: {
                    ...shopPlain.shop_owner,

                },
                shop_location: shopPlain.shop_location,
                shop_kyc_details: shopPlain.shop_kyc_details,
                shop_bank_details: shopPlain.shop_bank_details,
                shop_barbers: shopPlain.shop_barbers,
                shop_services: shopPlain.shop_services,

            };

            return response;
        } catch (error: any) {
            throw new AppErrors(error.message)
        }
    }


    static async getAllCustomers(data: any, paginationQuery: PaginationReqMeta): Promise<User[]> {
        try {

            let whereClause: any = { role: Roles.CUSTOMER, ...data };
            const customers = await User.findAll({
                where: whereClause,
                include: AdminServiceIncludes.allCustomerInclude(),
                attributes: {
                    exclude: ['route', "is_onboarding_completed"],

                },
                offset: paginationQuery.offset,
                limit: paginationQuery.limit,
            })

            const formattedResponse = customers.map((custInstance) => {
                const customer = custInstance.get({ plain: true }) as any;

                const appointments = customer.appointments ?? [];
                const lastIndex = appointments.length - 1;
                const lastVisit = appointments[lastIndex].appointment_date;

                let totalSpend = 0;

                let servicesCount = 0;
                for (const appointment of appointments) {
                    const services = appointment.services;
                    servicesCount = servicesCount + services.length;
                    totalSpend += services.reduce(
                        (sum: number, service: any) => (service.price ?? 0),
                        0
                    );
                }

                delete customer.appointments;
                delete customer.services;
                delete customer.location;
                return {
                    ...customer,
                    total_spend: totalSpend,
                    last_visit: lastVisit,
                    appointments_count: appointments.length,
                    services_count: servicesCount,
                }
            })
            return formattedResponse;
        } catch (error) {
            throw new AppErrors(error);
        }

    }

    static async getAllAppointments(data: any, paginationQuery: PaginationReqMeta): Promise<any> {

        try {

            let whereClause: any = {};

            if (data.status) {
                whereClause.status = data.status;
            }
            if (data.gender) {
                whereClause.gender = data.gender;
            }

            if (data.date_range) {
                const [startDate, endDate] = data.date_range.split(":");
                whereClause.appointment_date = {
                    [Op.between]: [
                        HelperFunctions.startOfDay(startDate),
                        HelperFunctions.endOfDay(endDate)
                    ],
                };
            }

            const appointments = await Appointment.findAll({
                include: AdminServiceIncludes.getAllApointmentsInclude(),
                where: whereClause,
                attributes: ['id', 'appointment_date', 'status', "shop_id", 'service_duration', 'extra_duration'],
                offset: paginationQuery.offset,
                limit: paginationQuery.limit,
            });
            const now = new Date();


            const startOfToday = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );
            // Sunday as week start (change if Monday is needed)
            const startOfWeek = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - now.getDay()
            );

            const startOfMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );

            let total_earnings = 0;
            let todays_earnings = 0
            let weekly_earnings = 0;
            let monthly_earnings = 0;
            const formattedResponse = appointments.map((aptInstance) => {

                const appointementsInstance = aptInstance.get({ plain: true }) as any;
                const shopName = appointementsInstance.shop.shop_name;
                const customerName = `${appointementsInstance.customer.first_name} ${appointementsInstance.customer.last_name}`

                const customerMobile = appointementsInstance.customer.mobile;
                const serviceInstance = appointementsInstance.services;
                const barber = appointementsInstance.barber;
                const duration = appointementsInstance.service_duration + (appointementsInstance.extra_duration || 0);

                const appointmentAmt = serviceInstance.reduce(
                    (sum: number, service: any) => sum + (service.price ?? 0),
                    0
                );
                total_earnings += appointmentAmt;

                const createdAt = new Date(appointementsInstance.appointment_date);


                if (createdAt >= startOfToday) {
                    todays_earnings += serviceInstance.reduce(
                        (sum: number, service: any) => sum + (service.price ?? 0),
                        0
                    );
                }


                if (createdAt >= startOfWeek) {
                    weekly_earnings += serviceInstance.reduce(
                        (sum: number, service: any) => sum + (service.price ?? 0),
                        0
                    );
                }

                if (createdAt >= startOfMonth) {
                    monthly_earnings += serviceInstance.reduce(
                        (sum: number, service: any) => sum + (service.price ?? 0),
                        0
                    );
                }

                let serviceList = [];
                for (const service of serviceInstance) {

                    serviceList.push({ id: service.service.id, name: service.service.name });
                }

                delete appointementsInstance.service_duration;
                delete appointementsInstance.extra_duration;
                delete appointementsInstance.shop;
                delete appointementsInstance.customer;
                delete appointementsInstance.services;
                delete appointementsInstance.barber;
                return {
                    ...appointementsInstance,
                    customer_name: customerName,
                    customer_mobile: customerMobile,
                    service_duration: duration,
                    barber_name: barber ? barber.name : null,
                    shop_name: shopName,
                    appointment_amt: appointmentAmt,
                    services_count: serviceList.length,
                    services: serviceList,
                }
            })
            return {
                total_earnings,
                todays_earnings,
                weekly_earnings,
                monthly_earnings,
                total_appointments_count: formattedResponse.length,
                appointments: formattedResponse
            }
        } catch (error: any) {
            throw new AppErrors(error.message);
        }
    }


    static async getAppointmentByShopId(shopId: string, paginationQuery: PaginationReqMeta): Promise<any> {
        try {
            const appointments = await Appointment.findAll({
                where: { shop_id: shopId },
                offset: paginationQuery.offset, limit: paginationQuery.limit,
                include: AdminServiceIncludes.getAllApointmentsInclude(),
                attributes: ['id', 'appointment_date', 'status', "shop_id", 'service_duration', 'extra_duration'],
            });

            const formattedResponse = appointments.map((aptInstance) => {

                const appointementsInstance = aptInstance.get({ plain: true }) as any;
                const shopName = appointementsInstance.shop.shop_name;
                const customerName = `${appointementsInstance.customer.first_name} ${appointementsInstance.customer.last_name}`

                const customerMobile = appointementsInstance.customer.mobile;
                const serviceInstance = appointementsInstance.services;
                const barber = appointementsInstance.barber;
                const duration = appointementsInstance.service_duration + (appointementsInstance.extra_duration || 0);

                const appointmentAmt = serviceInstance.reduce(
                    (sum: number, service: any) => sum + (service.price ?? 0),
                    0
                );

                let serviceList = [];
                for (const service of serviceInstance) {

                    serviceList.push({ id: service.service.id, name: service.service.name });
                }

                delete appointementsInstance.service_duration;
                delete appointementsInstance.extra_duration;
                delete appointementsInstance.shop;
                delete appointementsInstance.customer;
                delete appointementsInstance.services;
                delete appointementsInstance.barber;
                return {
                    ...appointementsInstance,
                    customer_name: customerName,
                    customer_mobile: customerMobile,
                    service_duration: duration,
                    barber_name: barber ? barber.name : null,
                    shop_name: shopName,
                    appointment_amt: appointmentAmt,
                    services_count: serviceList.length,
                    services: serviceList,
                }
            })
            return formattedResponse;
        } catch (error: any) {
            throw new AppErrors(error.message);
        }
    }

    static async updateShopStatus(shopId: string, status: Status): Promise<any> {
        try {
            const shop = await Shop.findOne({ where: { id: shopId } });
            if (!shop) {
                throw new AppErrors("No shop exist with the given Id")
            }

            shop.status = status;
            await shop.save();
            let message = `Shop has been ${status} successfully`;

            if (status === Status.ACTIVE) {
                message = "Shop has been activated successfully"
            } else if (status === Status.BLOCKED) {
                message = "Shop has been blocked successfully"
            } else if (status === Status.DEACTIVED) {
                message = "Shop has been de-activated successfully"
            } else if (status === Status.FROZEN) {
                message = "Shop has been frozen successfully"
            }

            return message;
        } catch (error: any) {
            throw new AppErrors(error.message)
        }
    }


}



class AdminServiceIncludes {

    static allVendorShopInclude() {
        return [
            {
                model: Appointment,
                as: "appointments",
                include: [
                    {
                        model: AppointmentService,
                        as: "services",
                    },
                ],
            },
            {
                model: Service,
                as: "shop_services"
            },
            {
                model: User,
                as: "shop_user"
            },
            {
                model: ShopLocation,
                as: "shop_location",
                attributes: { exclude: ['shop_id', 'user_id', 'createdAt', 'updatedAt'] },
            }
        ];
    }

    static allCustomerInclude() {
        return [
            {
                model: Appointment,
                as: "appointments",
                include: [
                    {
                        model: AppointmentService,
                        as: "services",
                    }
                ]
            }
        ];
    }

    static shopDetailByIdInclude() {
        return [
            {
                model: User,
                as: "shop_owner",
                attributes: ['first_name', 'last_name', 'mobile', 'email'],
                include: [
                    {
                        model: Shop,
                        as: "shops"
                    }
                ]
            },
            {
                model: ShopLocation,
                as: "shop_location",
                attributes: { exclude: ['shop_id', 'user_id', 'createdAt', 'updatedAt'] },

            },
            {
                model: Service,
                as: "shop_services",
                attributes: ['name', 'price']
            },
            {
                model: Barber,
                as: "shop_barbers",
                attributes: {
                    exclude: ['user_id', 'shop_id', 'role', 'available', 'username', 'login_pin']
                }
            },
            {
                model: ShopBankDetails,
                as: "shop_bank_details",
                attributes: {
                    exclude: ['shop_id', 'user_id', '']
                }
            },
            {
                model: ShopKycDetail,
                as: "shop_kyc_details",
                attributes: {
                    exclude: ['shop_id', 'user_id', '']
                }
            },
            // {
            //     model: Appointment,
            //     as: "appointments",
            //     include: [
            //         {
            //             model: AppointmentService,
            //             as: "services",
            //             include: [
            //                 {
            //                     model: Service,
            //                     as: "service"
            //                 }
            //             ]
            //         },
            //         {
            //             model: User,
            //             as: "customer"
            //         }
            //     ],
            // },
        ];
    }

    static getAllApointmentsInclude() {
        return [
            {
                model: Barber,
                as: "barber",
                attributes: ['id', 'name', "email", "mobile", "email", 'status']
            },
            {
                model: User,
                as: "customer",
                attributes: ['id', 'first_name', "last_name", "mobile", "email"]
            },
            {
                model: Shop,
                as: "shop",
                attributes: ['id', 'shop_name',]
            },

            {
                model: AppointmentService,
                as: "services",

                include: [
                    {
                        model: Service,
                        as: "service",
                        attributes: ["id", "name", "price", "duration"], // choose fields
                    },
                ],
            },
        ];
    }

}