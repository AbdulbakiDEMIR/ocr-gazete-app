import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export interface OcrResult {
  text: string;
  confidence: number;
  engineUsed: string;
  blocks?: {
    text: string;
    lines: string[];
  }[];
}

const STORAGE_KEYS = {
  USER_API_KEYS: '@ocr_gazete:user_api_keys',
};

let keyRotationIndex = 0;

export class OcrService {
  private static readonly PUBLIC_API_KEY = 'K88888888888957'; // Ücretsiz genel varsayılan
  private static readonly API_URL = 'https://api.ocr.space/parse/image';

  /**
   * Cihazda yerel saklanan kullanıcı API anahtarlarını getirir
   */
  static async getUserApiKeys(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_API_KEYS);
      if (data) {
        return JSON.parse(data) as string[];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Kullanıcı API anahtarlarını kaydeder (Yalnızca yerel cihaz hafızasında)
   */
  static async saveUserApiKeys(keys: string[]): Promise<void> {
    const cleanKeys = Array.from(new Set(keys.map((k) => k.trim()).filter(Boolean)));
    await AsyncStorage.setItem(STORAGE_KEYS.USER_API_KEYS, JSON.stringify(cleanKeys));
  }

  /**
   * Yeni bir anahtar ekler
   */
  static async addUserApiKey(key: string): Promise<string[]> {
    const current = await this.getUserApiKeys();
    const cleanKey = key.trim();
    if (!cleanKey || current.includes(cleanKey)) return current;
    const updated = [...current, cleanKey];
    await this.saveUserApiKeys(updated);
    return updated;
  }

  /**
   * Anahtarı siler
   */
  static async removeUserApiKey(key: string): Promise<string[]> {
    const current = await this.getUserApiKeys();
    const updated = current.filter((k) => k !== key);
    await this.saveUserApiKeys(updated);
    return updated;
  }

  /**
   * Sıradaki aktif API anahtarını döner (Otomatik Round-Robin Rotasyon)
   */
  static async getNextApiKey(): Promise<{ key: string; isCustom: boolean; totalKeys: number }> {
    const userKeys = await this.getUserApiKeys();
    if (userKeys.length === 0) {
      return { key: this.PUBLIC_API_KEY, isCustom: false, totalKeys: 0 };
    }
    const selectedKey = userKeys[keyRotationIndex % userKeys.length];
    keyRotationIndex = (keyRotationIndex + 1) % userKeys.length;
    return { key: selectedKey, isCustom: true, totalKeys: userKeys.length };
  }

  /**
   * Kırpılmış gazete kupürü görselinden gerçek metinleri okur.
   * Özel anahtarlar varsa otomatik rotasyonla kota ve hız limitlerini aşar.
   */
  static async recognizeText(imageUri: string, fileName?: string): Promise<OcrResult> {
    try {
      const cleanName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'newspaper_crop';
      const keyInfo = await this.getNextApiKey();

      // 1. Görseli Base64 olarak oku
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const bodyParams = new URLSearchParams();
      bodyParams.append('apikey', keyInfo.key);
      bodyParams.append('language', 'tur');
      bodyParams.append('OCREngine', '2');
      bodyParams.append('isOverlayRequired', 'false');
      bodyParams.append('scale', 'true');
      bodyParams.append('detectOrientation', 'true');
      bodyParams.append('base64Image', `data:image/jpeg;base64,${base64}`);

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      if (!response.ok) {
        throw new Error(`OCR Sunucu Hatası: ${response.status}`);
      }

      const data = await response.json();

      if (data.IsErroredOnProcessing) {
        const errorMsg = data.ErrorMessage ? data.ErrorMessage.join(', ') : 'OCR işleme hatası';
        throw new Error(errorMsg);
      }

      if (data.ParsedResults && data.ParsedResults.length > 0) {
        const rawText = data.ParsedResults[0].ParsedText || '';
        const cleaned = this.cleanText(rawText);

        if (cleaned.length > 0) {
          return {
            text: cleaned,
            confidence: 0.95,
            engineUsed: keyInfo.isCustom
              ? `OCR.Space (${keyInfo.totalKeys} Özel Anahtar)`
              : 'OCR.Space Genel Motor',
          };
        }
      }

      // Metin bulunamadıysa kullanıcıya bilgilendirme
      return {
        text: `[Görselde okunabilir metin tespit edilemedi. Lütfen köşe seçimini netleştirip tekrar deneyiniz veya metni buraya yazınız.]\n\nDosya: ${cleanName}`,
        confidence: 0.2,
        engineUsed: 'OCR.Space (Metin Boş)',
      };
    } catch (err: any) {
      console.warn('Gerçek OCR servisi çağrısında hata veya çevrimdışı durum:', err);

      // Çevrimdışı / Hata durumunda kurtarma
      const fallbackTitle = fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') : 'Kupür';
      return {
        text: `[Bağlantı veya OCR Hatası: ${err.message || 'Bilinmiyor'}]\n\nDosya: ${fallbackTitle}\n\n(Lütfen internet bağlantınızı kontrol edin veya gazete metnini buradan düzenleyerek kaydedin.)`,
        confidence: 0.5,
        engineUsed: 'Çevrimdışı Kurtarma Modu',
      };
    }
  }

  /**
   * Türkçe gazete karakter ve satır sonu düzeltmesi
   */
  static cleanText(rawText: string): string {
    return rawText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }
}
