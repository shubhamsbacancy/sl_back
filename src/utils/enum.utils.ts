export enum Roles {
    ADMIN = "admin",
    CUSTOMER = "customer",
    VENDOR = "vendor",
}

export enum ScreenSteps {
    INITIAL_SCREEN = "login_screen",
    OTP_SCREEN = "otp_screen",
    USER_PROFILE_SCREEN = "user_profile_screen",
    CREATE_SHOP_PROFILE_SCREEN = "create_shop_profile_screen",
    ADD_LOCATION_SCREEN = "add_shop_location_screen",
    ADD_SHOP_KYC_SCREEN = "add_shop_kyc_details_screen",
    ADD_BANK_DETAILS_SCREEN = "add_bank_details_screen",
    DASHBOARD_SCREEN = "dashboad_screen",
}


export enum Status {
    ACTIVE = "active",
    BLOCKED = "blocked",
    DEACTIVED = "de-activated",
    FROZEN = "frozen"
}



export enum DeviceType {
    MOBILE = "mobile",
    TABLET = "tablet",
    WEB = "web",
    DESKTOP = "desktop",
    TV = "tv",
    IOT = "iot",
    OTHER = "other"
}

export enum Platform {
    ANDROID = "android",
    IOS = "ios",
    MACOS = "macos",
    WINDOWS = "windows",
    LINUX = "linux",
    CHROMEOS = "chromebook",
    OTHER = "other"
}


export enum BrowserType {
    CHROME = "chrome",
    SAFARI = "safari",
    FIREFOX = "firefox",
    EDGE = "edge",
    OPERA = "opera",
    BRAVE = "brave",
    IE = "ie",
    OTHER = "other"
}


export enum TokenType {
    FCM = "fcm",
    APNS = "apns"
}

export enum Gender {
    MALE = "male",
    FEMALE = "female",
    UNISEX = "unisex",
    OTHERS = "others"
}

export enum AppointmentStatus {
    Pending = "pending",
    Accepted = "accepted",
    InProgress = "in-progress",
    Rejected = "rejected",
    Conmpleted = "completed",
    Cancelled = "cancelled",
}


export enum PaymentStatus {
    Pending = "pending",
    Failed = "failed",
    Success = "succss"
}

export enum PaymentMode {
    Cash = "cash",
    Online = "online",
    Other = "Other"
}


export enum AdminRole {
    Admin = "admin",
    SuperAdmin = "super-admin"
}