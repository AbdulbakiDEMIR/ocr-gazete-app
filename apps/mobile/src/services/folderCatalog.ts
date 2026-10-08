import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import {
  CatalogRecordDTO,
  FolderManifestDTO,
  ImageFolderItemDTO,
  ImageStatus,
  OcrReviewDTO,
} from '../types';

const STORAGE_KEYS = {
  FOLDER_PATH: '@ocr_gazete:folder_path',
  FOLDER_SAF_URI: '@ocr_gazete:folder_saf_uri',
  IMAGE_ITEMS: '@ocr_gazete:image_items',
  CATALOG_RECORDS: '@ocr_gazete:catalog_records',
};

const MANIFEST_FILE_NAME = 'ocr_gazete_manifest.json';
function safeDecodeUri(uri: string): string {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
}

function isImageFileOrUri(uri: string, fileName: string): boolean {
  const combined = `${safeDecodeUri(uri)} ${fileName}`.toLowerCase();
  // 1. Standart resim uzantıları
  if (/\.(jpe?g|png|webp|bmp|heic|tiff?)/i.test(combined)) {
    return true;
  }
  // 2. Android MediaStore document URIs (ör: document/image%3A12345)
  if (
    combined.includes('image:') ||
    combined.includes('image%3a') ||
    combined.includes('/images/') ||
    combined.includes('document/image')
  ) {
    return true;
  }
  return false;
}

function extractFileNameFromUri(uri: string, index: number = 0): string {
  const decoded = safeDecodeUri(uri);
  const lastPart = decoded.split('/').filter(Boolean).pop() || '';
  const cleanPart = lastPart.split(':').pop() || lastPart;

  if (
    cleanPart &&
    cleanPart.length > 0 &&
    !cleanPart.startsWith('document') &&
    !cleanPart.startsWith('tree')
  ) {
    if (cleanPart.includes('.')) {
      return cleanPart;
    }
    return `${cleanPart}.jpg`;
  }
  return `gazete_sayfa_${index + 1}.jpg`;
}

async function scanDirectoryRecursive(
  dirUri: string,
  depth: number = 0,
  maxDepth: number = 2
): Promise<{ fileName: string; fileUri: string; fileSizeBytes?: number }[]> {
  const results: { fileName: string; fileUri: string; fileSizeBytes?: number }[] = [];
  if (depth > maxDepth) return results;

  try {
    const childUris = await FileSystem.StorageAccessFramework.readDirectoryAsync(dirUri);
    const subDirsToScan: string[] = [];

    for (let i = 0; i < childUris.length; i++) {
      const childUri = childUris[i];
      const fileName = extractFileNameFromUri(childUri, results.length);

      if (isImageFileOrUri(childUri, fileName)) {
        results.push({ fileName, fileUri: childUri });
      } else if (depth < maxDepth && !fileName.includes('.')) {
        subDirsToScan.push(childUri);
      }
    }

    // Yalnızca uzantısı olmayan olası alt klasörleri tara (maksimum 10 alt klasör)
    for (let s = 0; s < Math.min(subDirsToScan.length, 10); s++) {
      try {
        const subResults = await scanDirectoryRecursive(subDirsToScan[s], depth + 1, maxDepth);
        results.push(...subResults);
      } catch {
        // Alt klasör değil
      }
    }
  } catch (err) {
    console.warn(`scanDirectoryRecursive error at depth ${depth}:`, err);
  }

  // Doğal alfabetik/nümerik sıralama (sayfa_1, sayfa_2 ... sayfa_8000)
  results.sort((a, b) =>
    a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: 'base' })
  );

  return results;
}

// 8000+ gazete koleksiyonlarında SQLite CursorWindow limitini aşmamak için bellek önbelleği
let memoryImagesCache: ImageFolderItemDTO[] | null = null;

export class FolderCatalogService {
  /**
   * Cihazdaki durum/manifest dosyasının tam yolunu döner
   */
  static getManifestFilePath(): string {
    return `${FileSystem.documentDirectory || ''}${MANIFEST_FILE_NAME}`;
  }

  /**
   * Kayıtlı klasör yolunu getirir
   */
  static async getSelectedFolderPath(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.FOLDER_PATH);
    } catch {
      return null;
    }
  }

  /**
   * Kayıtlı SAF dizin URI'sini getirir (Android için)
   */
  static async getSelectedFolderSafUri(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.FOLDER_SAF_URI);
    } catch {
      return null;
    }
  }

  /**
   * Seçilen klasör yolunu kaydeder ve durum dosyasını günceller
   */
  static async saveSelectedFolderPath(folderPath: string, safUri?: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.FOLDER_PATH, folderPath);
    if (safUri) {
      await AsyncStorage.setItem(STORAGE_KEYS.FOLDER_SAF_URI, safUri);
    }
    const images = await this.getAllImages();
    await this.syncManifestToFile(images, folderPath);
  }

  /**
   * Seçilen klasördeki görselleri listeye yerleştirir.
   * 8.000+ resimlik dev arşivlerde bile anında çalışır.
   * Daha önce işlenmişse (PROCESSED) durumlarını korur.
   */
  static async setFolderImages(
    folderPath: string,
    safUri: string,
    scannedItems: { fileName: string; fileUri: string; fileSizeBytes?: number }[]
  ): Promise<ImageFolderItemDTO[]> {
    const current = await this.getAllImages();
    const currentMap = new Map(current.map((c) => [c.fileName, c]));

    const mergedList: ImageFolderItemDTO[] = scannedItems.map((item) => {
      const existing = currentMap.get(item.fileName);
      if (existing) {
        return {
          ...existing,
          fileUri: item.fileUri,
          fileSizeBytes: item.fileSizeBytes ?? existing.fileSizeBytes,
          updatedAt: new Date().toISOString(),
        };
      }
      return {
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        fileName: item.fileName,
        fileUri: item.fileUri,
        status: 'UNPROCESSED',
        updatedAt: new Date().toISOString(),
        fileSizeBytes: item.fileSizeBytes,
      };
    });

    // 1. Bellek içi önbelleği güncelle (Anında erişim)
    memoryImagesCache = mergedList;

    // 2. Klasör yolunu kaydet
    await AsyncStorage.setItem(STORAGE_KEYS.FOLDER_PATH, folderPath);
    if (safUri) {
      await AsyncStorage.setItem(STORAGE_KEYS.FOLDER_SAF_URI, safUri);
    }

    // 3. Fiziksel JSON dosyasına yaz (CursorWindow 2MB limiti yoktur)
    await this.syncManifestToFile(mergedList, folderPath);

    // 4. AsyncStorage'a yalnızca küçük listeleri yaz (SQLite patlamasını önler)
    if (mergedList.length <= 400) {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.IMAGE_ITEMS, JSON.stringify(mergedList));
      } catch {}
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.IMAGE_ITEMS);
    }

    return mergedList;
  }

  /**
   * Android SAF veya doğrudan klasör seçimi yapar ve içindeki tüm görselleri tarar.
   */
  static async pickAndScanDirectory(): Promise<{
    success: boolean;
    folderName: string;
    totalFound: number;
    newAdded: number;
    errorMessage?: string;
  }> {
    try {
      if (Platform.OS === 'android') {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          return {
            success: false,
            folderName: '',
            totalFound: 0,
            newAdded: 0,
            errorMessage: 'Klasör izni verilmedi.',
          };
        }

        const dirUri = permissions.directoryUri;
        const decodedUri = safeDecodeUri(dirUri);
        const folderName = decodedUri.split(':').pop() || 'Seçilen Klasör';

        await this.saveSelectedFolderPath(folderName, dirUri);

        // Klasördeki ve alt klasörlerdeki tüm resimleri tara
        const scannedItems = await scanDirectoryRecursive(dirUri, 0, 2);

        if (scannedItems.length === 0) {
          return {
            success: true,
            folderName,
            totalFound: 0,
            newAdded: 0,
            errorMessage: `"${folderName}" klasöründe resim dosyası bulunamadı. Lütfen klasörde .jpg, .jpeg, .png veya .webp formatında dosyalar olduğundan emin olun veya "📂 Dosya" butonuyla resimleri doğrudan seçin.`,
          };
        }

        const currentImages = await this.getAllImages();
        const existingNames = new Set(currentImages.map((c) => c.fileName));
        const newCount = scannedItems.filter((item) => !existingNames.has(item.fileName)).length;

        await this.setFolderImages(folderName, dirUri, scannedItems);

        return {
          success: true,
          folderName,
          totalFound: scannedItems.length,
          newAdded: newCount,
        };
      } else {
        return {
          success: false,
          folderName: '',
          totalFound: 0,
          newAdded: 0,
          errorMessage: 'Doğrudan klasör seçimi Android üzerinde desteklenmektedir.',
        };
      }
    } catch (err: any) {
      console.error('Klasör tarama hatası:', err);
      return {
        success: false,
        folderName: '',
        totalFound: 0,
        newAdded: 0,
        errorMessage: err.message || 'Klasör taranırken bir hata oluştu.',
      };
    }
  }

  /**
   * Kayıtlı klasörü yeniden tarar ve klasöre yeni eklenmiş resimleri listeye dahil eder.
   */
  static async rescanCurrentDirectory(): Promise<{
    success: boolean;
    folderName: string;
    newlyAddedCount: number;
    totalCount: number;
    errorMessage?: string;
  }> {
    try {
      const savedSafUri = await this.getSelectedFolderSafUri();
      const folderName = (await this.getSelectedFolderPath()) || 'Gazete Klasörü';

      if (Platform.OS === 'android' && savedSafUri) {
        const candidateItems = await scanDirectoryRecursive(savedSafUri, 0, 2);

        const currentImages = await this.getAllImages();
        const existingNames = new Set(currentImages.map((c) => c.fileName));
        const existingUris = new Set(currentImages.map((c) => c.fileUri));

        const strictlyNew = candidateItems.filter(
          (c) => !existingNames.has(c.fileName) && !existingUris.has(c.fileUri)
        );

        if (strictlyNew.length > 0) {
          const updated = await this.addImages(strictlyNew);
          return {
            success: true,
            folderName,
            newlyAddedCount: strictlyNew.length,
            totalCount: updated.length,
          };
        }

        return {
          success: true,
          folderName,
          newlyAddedCount: 0,
          totalCount: candidateItems.length > 0 ? candidateItems.length : currentImages.length,
        };
      }

      return {
        success: false,
        folderName,
        newlyAddedCount: 0,
        totalCount: (await this.getAllImages()).length,
        errorMessage: 'Kayıtlı bir klasör dizini bulunamadı. Lütfen önce "Klasör Seç" yapınız.',
      };
    } catch (err: any) {
      console.error('Klasör yenileme hatası:', err);
      return {
        success: false,
        folderName: '',
        newlyAddedCount: 0,
        totalCount: 0,
        errorMessage: err.message || 'Klasör yenilenirken hata oluştu.',
      };
    }
  }

  /**
   * Tüm görselleri getirir (8000+ görselde anında bellekten ve manifest dosyasından döner)
   */
  static async getAllImages(): Promise<ImageFolderItemDTO[]> {
    if (memoryImagesCache && memoryImagesCache.length > 0) {
      return memoryImagesCache;
    }

    try {
      // 1. Fiziksel manifest dosyasından okumayı dene (2MB CursorWindow sınırı yoktur)
      const fromFile = await this.readManifestFromFile();
      if (fromFile && fromFile.images && fromFile.images.length > 0) {
        memoryImagesCache = fromFile.images;
        return fromFile.images;
      }

      // 2. AsyncStorage yedeğinden okumayı dene
      const data = await AsyncStorage.getItem(STORAGE_KEYS.IMAGE_ITEMS);
      if (data) {
        const parsed = JSON.parse(data) as ImageFolderItemDTO[];
        memoryImagesCache = parsed;
        return parsed;
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Durumuna göre görselleri filtreler:
   * 'UNPROCESSED' (OCR Yapılmadı / Bekliyor) veya 'PROCESSED' (OCR Yapıldı)
   */
  static async getImagesByStatus(status: ImageStatus): Promise<ImageFolderItemDTO[]> {
    const all = await this.getAllImages();
    return all.filter((item) => item.status === status);
  }

  /**
   * Yeni görseller ekler, hem veritabanını hem de durum dosyasını günceller
   */
  static async addImages(
    newItems: Omit<ImageFolderItemDTO, 'id' | 'status' | 'updatedAt'>[]
  ): Promise<ImageFolderItemDTO[]> {
    const current = await this.getAllImages();
    const existingFileNames = new Set(current.map((c) => c.fileName));

    const toAdd: ImageFolderItemDTO[] = newItems
      .filter((item) => !existingFileNames.has(item.fileName))
      .map((item) => ({
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        fileName: item.fileName,
        fileUri: item.fileUri,
        status: 'UNPROCESSED',
        updatedAt: new Date().toISOString(),
        fileSizeBytes: item.fileSizeBytes,
      }));

    const updated = [...toAdd, ...current];
    memoryImagesCache = updated;

    if (updated.length <= 400) {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.IMAGE_ITEMS, JSON.stringify(updated));
      } catch {}
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.IMAGE_ITEMS);
    }

    const folderPath = (await this.getSelectedFolderPath()) || 'Cihaz/Klasor';
    await this.syncManifestToFile(updated, folderPath);

    return updated;
  }

  /**
   * Görsel durumunu günceller (Örn: UNPROCESSED -> PROCESSED)
   */
  static async updateImageStatus(
    fileName: string,
    status: ImageStatus,
    ocrSnippet?: string
  ): Promise<void> {
    const current = await this.getAllImages();
    const updated = current.map((item) => {
      if (item.fileName === fileName) {
        return {
          ...item,
          status,
          updatedAt: new Date().toISOString(),
          ocrSnippet: ocrSnippet || item.ocrSnippet,
        };
      }
      return item;
    });

    memoryImagesCache = updated;

    if (updated.length <= 400) {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.IMAGE_ITEMS, JSON.stringify(updated));
      } catch {}
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.IMAGE_ITEMS);
    }

    const folderPath = (await this.getSelectedFolderPath()) || 'Cihaz/Klasor';
    await this.syncManifestToFile(updated, folderPath);
  }

  /**
   * Kullanıcı tarafından onaylanan OCR çıktısını dosya adıyla kataloglar ve kaydeder.
   */
  static async saveApprovedCatalog(review: OcrReviewDTO): Promise<CatalogRecordDTO> {
    const records = await this.getAllCatalogRecords();
    const folderPath = (await this.getSelectedFolderPath()) || 'Yerel Arşiv';

    const finalText = review.editedOcrText || review.rawOcrText;
    const snippet = finalText
      ? finalText.replace(/\s+/g, ' ').trim().slice(0, 120)
      : undefined;

    const newRecord: CatalogRecordDTO = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      fileName: review.fileName,
      sourceDirectory: folderPath,
      originalImageUri: review.originalUri,
      croppedImageUri: review.croppedUri,
      finalText,
      approvedAt: new Date().toISOString(),
      status: 'PROCESSED',
    };

    // Varsa aynı dosya adı için eski kaydı güncelle, yoksa ekle
    const filtered = records.filter((r) => r.fileName !== review.fileName);
    const updatedRecords = [newRecord, ...filtered];

    await AsyncStorage.setItem(STORAGE_KEYS.CATALOG_RECORDS, JSON.stringify(updatedRecords));

    // Görsel durumunu Kullanılan (PROCESSED) olarak işaretle ve durum dosyasına yaz
    await this.updateImageStatus(review.fileName, 'PROCESSED', snippet);

    return newRecord;
  }

  /**
   * Tüm onaylanmış katalog kayıtlarını getirir
   */
  static async getAllCatalogRecords(): Promise<CatalogRecordDTO[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CATALOG_RECORDS);
      if (!data) return [];
      return JSON.parse(data) as CatalogRecordDTO[];
    } catch {
      return [];
    }
  }

  /**
   * Dosya adına göre katalog kaydı arar
   */
  static async getCatalogByFileName(fileName: string): Promise<CatalogRecordDTO | null> {
    const records = await this.getAllCatalogRecords();
    return records.find((r) => r.fileName === fileName) || null;
  }

  /**
   * Klasör Manifest/Durum DTO nesnesini oluşturur
   */
  static async getFolderManifest(): Promise<FolderManifestDTO> {
    const images = await this.getAllImages();
    const folderPath = (await this.getSelectedFolderPath()) || 'Henüz Seçilmedi';
    const folderName = folderPath.split('/').filter(Boolean).pop() || 'Gazete Arşivi';

    const processed = images.filter((i) => i.status === 'PROCESSED').length;
    const unprocessed = images.filter((i) => i.status === 'UNPROCESSED').length;

    return {
      folderName,
      folderPath,
      manifestFilePath: this.getManifestFilePath(),
      lastUpdated: new Date().toISOString(),
      stats: {
        total: images.length,
        processed,
        unprocessed,
      },
      images,
    };
  }

  /**
   * Fiziksel JSON durum dosyasına (ocr_gazete_manifest.json) yazar
   */
  private static async syncManifestToFile(
    images: ImageFolderItemDTO[],
    folderPath: string
  ): Promise<void> {
    try {
      const filePath = this.getManifestFilePath();
      const folderName = folderPath.split('/').filter(Boolean).pop() || 'Gazete Arşivi';
      const processed = images.filter((i) => i.status === 'PROCESSED').length;
      const unprocessed = images.filter((i) => i.status === 'UNPROCESSED').length;

      const manifestPayload: FolderManifestDTO = {
        folderName,
        folderPath,
        manifestFilePath: filePath,
        lastUpdated: new Date().toISOString(),
        stats: {
          total: images.length,
          processed,
          unprocessed,
        },
        images,
      };

      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(manifestPayload, null, 2));
    } catch (err) {
      console.warn('Durum dosyası yazma uyarısı:', err);
    }
  }

  /**
   * Fiziksel JSON durum dosyasını okur
   */
  private static async readManifestFromFile(): Promise<FolderManifestDTO | null> {
    try {
      const filePath = this.getManifestFilePath();
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(filePath);
        return JSON.parse(content) as FolderManifestDTO;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Önceki ve sonraki gazete geçiş yardımcısı
   */
  static getNeighborImages(
    images: ImageFolderItemDTO[],
    currentImageId: string
  ): {
    prevImage: ImageFolderItemDTO | null;
    nextImage: ImageFolderItemDTO | null;
    currentIndex: number;
    totalCount: number;
  } {
    const currentIndex = images.findIndex((img) => img.id === currentImageId);
    if (currentIndex === -1) {
      return { prevImage: null, nextImage: null, currentIndex: -1, totalCount: images.length };
    }

    const prevImage = currentIndex > 0 ? images[currentIndex - 1] : null;
    const nextImage = currentIndex < images.length - 1 ? images[currentIndex + 1] : null;

    return {
      prevImage,
      nextImage,
      currentIndex,
      totalCount: images.length,
    };
  }

  /**
   * Veritabanını sıfırlama (Test / Temizlik için)
   */
  static async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.IMAGE_ITEMS);
    await AsyncStorage.removeItem(STORAGE_KEYS.CATALOG_RECORDS);
    await AsyncStorage.removeItem(STORAGE_KEYS.FOLDER_PATH);
    await AsyncStorage.removeItem(STORAGE_KEYS.FOLDER_SAF_URI);
    try {
      const filePath = this.getManifestFilePath();
      const info = await FileSystem.getInfoAsync(filePath);
      if (info.exists) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
    } catch {}
  }
}
