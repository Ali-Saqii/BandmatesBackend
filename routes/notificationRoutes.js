const express = require("express")
const router = express.Router()
const auth = require("../middleware/userAuth")
const fControllers = require("../controllers/notificationController")

router.get('/notifications', auth, fControllers.getNotifications)
router.get('/notifications/unread-count', auth, fControllers.getUnreadCount)
router.patch('/notifications/:id/read', auth, fControllers.markAsRead)
router.patch('/notifications/read-all', auth, fControllers.markAllAsRead)
router.delete('/notifications/clear-all', auth, fControllers.clearAllNotifications) 
router.delete('/notifications/:id', auth, fControllers.deleteNotification)
router.get('/get/notification-settings', auth, fControllers.getNotificationSettings);
router.put('/put/notification-settings', auth, fControllers.updateNotificationSettings);
module.exports = router