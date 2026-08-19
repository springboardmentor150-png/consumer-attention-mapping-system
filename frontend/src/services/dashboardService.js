import api from "./api";


// Manager dashboard
export const getManagerDashboard = () => {
    return api.get("/dashboard/manager");
};


// Analyst dashboard
export const getAnalystDashboard = () => {
    return api.get("/dashboard/analyst");
};


// Marketing dashboard
export const getMarketingDashboard = () => {
    return api.get("/dashboard/marketing");
};


// Admin dashboard
export const getAdminDashboard = () => {
    return api.get("/dashboard/admin");
};
