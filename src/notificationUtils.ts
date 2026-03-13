import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const pushNotification = async (
    userId: string,
    title: string,
    message: string,
    type: string,
    orderId?: string,
    icon?: string,
    color?: string
) => {
    if (!userId) {
        console.warn("Attempted to push notification without userId");
        return;
    }
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            title,
            message,
            type,
            orderId: orderId || '',
            icon: icon || '',
            color: color || '',
            read: false,
            createdAt: serverTimestamp(),
        });
        console.log(`Notification pushed to user ${userId}: ${title}`);
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};
