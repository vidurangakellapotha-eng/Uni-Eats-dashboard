import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a file to Firebase Storage and returns the public URL.
 * @param file The file to upload (from an <input type="file">)
 * @param folder The folder name (e.g., 'profile-pics', 'food-items')
 * @param fileName A custom name for the file. If not provided, uses timestamp.
 */
export const uploadFile = async (file: File, folder: string, fileName?: string): Promise<string> => {
    try {
        const name = fileName || `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `${folder}/${name}`);
        
        // Upload the bytes
        const snapshot = await uploadBytes(storageRef, file);
        
        // Get and return the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

/**
 * Specific utility for Food Menu Images (Admin)
 */
export const uploadFoodImage = async (foodId: string, file: File): Promise<string> => {
    return uploadFile(file, 'menu/items', `${foodId}`);
};
