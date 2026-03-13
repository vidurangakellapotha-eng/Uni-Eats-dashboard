import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const pushNotification = async (
    userId: string,
    title: string,
    message: string,
    type: string,
    orderId?: string
) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            title,
            message,
            type,
            orderId: orderId || '',
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};
