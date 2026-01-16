import { Request, Response } from "express";
import { AdminServices } from "../../service/admin/AdminServices";
import { ApiResponse } from "../../utils/apiResponse";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { AdminAppointmentsFilterSchema, AdminCustomerFilterSchema, AdminShopFilterSchema } from "../../schema/admin/AdmiinFilterSchema";
import { AuthService } from "../../service/common/auth.service";
import { PaginationUtils } from "../../utils/pagination.utils";

export class AdminController {

    static async getAllVendorShops(req: Request, res: Response) {
        try {
            const requestBody = req.body;

            const paginationQuery = PaginationUtils.getPagination(req.query);
            let query: any = {};
            if (req.query.status) {
                query['status'] = req.query.status;
            }

            if (req.query.isVerified) {
                query['isVerified'] = req.query.isVerified === 'true' ? true : false;
            }
            // const parsedBody = AdminShopFilterSchema.safeParse(requestBody || {});
            // if (!parsedBody.success) {
            //     return ApiResponse.error(parsedBody.error);
            // }
            const vendors = await AdminServices.getAllVendorShops(query, paginationQuery);
            return ApiResponse.success('Vendors retrieved successfully', vendors);
        } catch (error) {
            return ApiResponse.error(error);
        }
    }

    static async verifyVendorShop(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await AdminServices.verifyVendorShop(id);
            return ApiResponse.success("Vendor shop verified successfully", result);
        } catch (error) {
            return ApiResponse.error(error);
        }
    }

    static async getShopDetailById(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const result = await AdminServices.getShopDetailById(id);
            return ApiResponse.success("Shop fetched successfully", result);
        } catch (error) {
            return ApiResponse.error(error);
        }
    }

    static async updateShopStatus(req: AuthRequest, res: Response) {
        try {
            const { id, status } = req.body;
            const result = await AdminServices.updateShopStatus(id, status);
            return ApiResponse.success(result);
        } catch (error) {
            return ApiResponse.error(error);
        }
    }


    static async getAllCustomers(req: Request, res: Response) {
        try {

            const requestBody = req.body || {};

            const paginationQuery = PaginationUtils.getPagination(req.query);

            const parsedBody = AdminCustomerFilterSchema.safeParse(requestBody);
            if (!parsedBody.success) {
                return ApiResponse.error(parsedBody.error);
            }
            const customers = await AdminServices.getAllCustomers(parsedBody.data, paginationQuery);
            return ApiResponse.success('Customers retrieved successfully', customers);
        } catch (error) {
            return ApiResponse.error(error);
        }
    }


    static async getAllAppointments(req: AuthRequest, res: Response) {
        try {

            const requestBody = req.body || {};
            const paginationQuery = PaginationUtils.getPagination(req.query);
            const parsedBody = AdminAppointmentsFilterSchema.safeParse(requestBody);
            if (!parsedBody.success) {
                return ApiResponse.error(parsedBody.error);
            }
            const appointments = await AdminServices.getAllAppointments(parsedBody.data, paginationQuery);
            return ApiResponse.success("All appointments fetched", appointments);
        } catch (error) {
            return ApiResponse.error(error);
        }
    }

    static async getAppointmentByShopId(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const paginationQuery = PaginationUtils.getPagination(req.query);
            const appointment = await AdminServices.getAppointmentByShopId(id, paginationQuery);
            return ApiResponse.success("Appointment fetched successfully", appointment);
        } catch (error) {
            return ApiResponse.error(error);
        }

    }
}