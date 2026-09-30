package com.deliveryplatform.backend.service;

import com.deliveryplatform.backend.model.Notification;
import com.deliveryplatform.backend.model.Shipment;
import com.deliveryplatform.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SmsService smsService;

    public NotificationService(NotificationRepository notificationRepository, SmsService smsService) {
        this.notificationRepository = notificationRepository;
        this.smsService = smsService;
    }

    @Transactional
    public void notifyShipmentStatusChange(Shipment shipment) {
        if (shipment == null || shipment.getStatus() == null) {
            return;
        }
        String status = shipment.getStatus().name();
        String title = "Shipment " + status;
        String message = "Shipment " + nullSafe(shipment.getTrackingNumber())
                + " is now " + status + ".";

        // Notify the customer
        if (shipment.getCustomerId() != null) {
            Notification notification = new Notification();
            notification.setUserId(shipment.getCustomerId());
            notification.setShipmentId(shipment.getId());
            notification.setTitle(title);
            notification.setMessage(message);
            notificationRepository.save(notification);
        }

        // Notify the assigned driver when a shipment is offered or assigned
        if (shipment.getAssignedDriverId() != null &&
                (shipment.getStatus() == Shipment.ShipmentStatus.DRIVER_ASSIGNED)) {
            Notification driverNotification = new Notification();
            driverNotification.setUserId(shipment.getAssignedDriverId());
            driverNotification.setShipmentId(shipment.getId());
            driverNotification.setTitle("New delivery offer");
            driverNotification.setMessage("You have a new delivery offer for shipment "
                    + nullSafe(shipment.getTrackingNumber()) + ". Please accept or decline.");
            notificationRepository.save(driverNotification);
        }

        if (shipment.getRecipientPhone() != null && !shipment.getRecipientPhone().isBlank()) {
            smsService.sendSms(shipment.getRecipientPhone(), message);
        }
    }

    public List<Notification> getForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long unreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFlagFalse(userId);
    }

    @Transactional
    public Notification markRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalStateException("Cannot mark another user's notification as read");
        }
        notification.setReadFlag(true);
        return notificationRepository.save(notification);
    }

    private static String nullSafe(String value) {
        return value == null ? "" : value;
    }
}
