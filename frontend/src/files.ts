import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type PickedFile = { name: string; mime: string; size: number; content: string; field: string };

function validateFileSize(size: number, fileName: string): boolean {
  if (size > MAX_FILE_SIZE) {
    Alert.alert(
      "Fayl hajmi juda katta",
      `${fileName} hajmi ${Math.round(size / (1024 * 1024))}MB. Maksimal ruxsat etilgan hajm: 10MB.`
    );
    return false;
  }
  return true;
}

async function uriToBase64(uri: string): Promise<string> {
  try {
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  } catch {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export async function pickDocument(field: string = "document"): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  if (!validateFileSize(asset.size || 0, asset.name || "file")) return null;
  const content = await uriToBase64(asset.uri);
  return {
    name: asset.name || "file",
    mime: asset.mimeType || "application/octet-stream",
    size: asset.size || 0,
    content,
    field,
  };
}

export async function pickImage(field: string = "photo"): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Ruxsat kerak", "Galereyaga ruxsat bering (Sozlamalar → Ilova ruxsatlari).");
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.6,
    base64: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  const content = asset.base64 || (await uriToBase64(asset.uri));
  const size = asset.fileSize || content.length;
  if (!validateFileSize(size, asset.fileName || `${field}_${Date.now()}.jpg`)) return null;
  return {
    name: asset.fileName || `${field}_${Date.now()}.jpg`,
    mime: asset.mimeType || "image/jpeg",
    size,
    content,
    field,
  };
}

export async function takeSelfie(field: string = "selfie"): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    // Fallback to image library
    return pickImage(field);
  }
  const res = await ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.front,
    quality: 0.6,
    base64: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  const content = asset.base64 || (await uriToBase64(asset.uri));
  const size = asset.fileSize || content.length;
  if (!validateFileSize(size, `selfie_${Date.now()}.jpg`)) return null;
  return {
    name: `selfie_${Date.now()}.jpg`,
    mime: "image/jpeg",
    size,
    content,
    field,
  };
}
