
import Router from "express";
import { AdminController } from "../../controllers/admin/AdminController";

const router = Router();

router.get('/vendor-shops', AdminController.getAllVendorShops);
router.put('/vendor-shops/verify/:id', AdminController.verifyVendorShop);
router.get('/customers', AdminController.getAllCustomers);
router.get("/get-appointments", AdminController.getAllAppointments);
router.get("/vendor-shops/:id", AdminController.getShopDetailById)
router.get("/get-appointments/:id", AdminController.getAppointmentByShopId)
router.patch("/vendor-shops/status", AdminController.updateShopStatus)



export default router;