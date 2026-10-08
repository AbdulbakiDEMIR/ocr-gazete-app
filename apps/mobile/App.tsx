import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { CornerCropper } from './src/components/CornerCropper';
import { ReviewModal } from './src/components/ReviewModal';
import { CatalogListModal } from './src/components/CatalogListModal';
import { SettingsModal } from './src/components/SettingsModal';
import { FolderCatalogService } from './src/services/folderCatalog';
import { OcrService } from './src/services/ocr';
import {
  CatalogRecordDTO,
  CropCoordinatesDTO,
  CropRegionItem,
  FolderManifestDTO,
  ImageFolderItemDTO,
  ImageStatus,
} from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'ALL' | ImageStatus>('ALL');
  const [folderPath, setFolderPath] = useState<string>('Seçilmedi (Cihaz Depolama)');
  const [images, setImages] = useState<ImageFolderItemDTO[]>([]);
  const [catalogRecords, setCatalogRecords] = useState<CatalogRecordDTO[]>([]);
  const [manifestInfo, setManifestInfo] = useState<FolderManifestDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Kırpma Modu Durumu
  const [selectedImage, setSelectedImage] = useState<ImageFolderItemDTO | null>(null);

  // İnceleme & Onay Modu Durumu
  const [isReviewVisible, setIsReviewVisible] = useState(false);
  const [reviewData, setReviewData] = useState<{
    fileName: string;
    originalUri: string;
    croppedUri: string;
    croppedUris?: string[];
    zones?: CropRegionItem[];
    ocrText: string;
    engineUsed?: string;
  } | null>(null);

  // Katalog Modal Durumu
  const [isCatalogModalVisible, setIsCatalogModalVisible] = useState(false);

  // Ayarlar Modal Durumu
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [customKeyCount, setCustomKeyCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const savedPath = await FolderCatalogService.getSelectedFolderPath();
      if (savedPath) setFolderPath(savedPath);

      const allImages = await FolderCatalogService.getAllImages();
      setImages(allImages);

      const records = await FolderCatalogService.getAllCatalogRecords();
      setCatalogRecords(records);

      const manifest = await FolderCatalogService.getFolderManifest();
      setManifestInfo(manifest);

      const userKeys = await OcrService.getUserApiKeys();
      setCustomKeyCount(userKeys.length);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Gerçek Klasör Seçimi (Android SAF)
  const handlePickDirectory = async () => {
    setIsLoading(true);
    try {
      const res = await FolderCatalogService.pickAndScanDirectory();
      if (res.success) {
        setFolderPath(res.folderName);
        await loadData();
        if (res.totalFound > 0) {
          Alert.alert(
            'Klasör Taranıp İçe Aktarıldı ✅',
            `'${res.folderName}' klasörü seçildi.\n${res.totalFound} adet gazete görseli listelendi.\n\nİleride bu klasöre ekleyeceğiniz yeni resimleri almak için "🔄 Yenile / Yeni Ekle" butonunu kullanabilirsiniz.`
          );
        } else {
          Alert.alert(
            'Klasörde Resim Bulunamadı ⚠️',
            res.errorMessage ||
              `'${res.folderName}' klasöründe .jpg/.png resim dosyası bulunamadı. Lütfen içinde gazete resimleri bulunan bir klasör seçin veya "📂 Dosya" butonuyla resimleri doğrudan seçebilirsiniz.`
          );
        }
      } else {
        // Android SAF desteklenmiyorsa veya iptal edildiyse bilgilendir
        Alert.alert(
          'Klasör Seçimi',
          res.errorMessage || 'Klasör seçilemedi. İsterseniz "📂 Dosya" ile çoklu görsel seçebilirsiniz.'
        );
      }
    } catch (err) {
      console.error('Klasör seçme hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Kayıtlı Klasöre Gelen Yeni Resimleri Tara & Ekle
  const handleRescanFolder = async () => {
    setIsLoading(true);
    try {
      const res = await FolderCatalogService.rescanCurrentDirectory();
      if (res.success) {
        await loadData();
        if (res.newlyAddedCount > 0) {
          Alert.alert(
            'Yeni Resimler Eklendi 🎉',
            `'${res.folderName}' klasöründe ${res.newlyAddedCount} adet yeni gazete görseli tespit edilip listeye eklendi! (Toplam ${res.totalCount} görsel)`
          );
        } else {
          Alert.alert(
            'Klasör Güncel ✓',
            `'${res.folderName}' klasöründe yeni resim bulunamadı. Tüm resimler zaten listede (Toplam ${res.totalCount} görsel).`
          );
        }
      } else {
        Alert.alert(
          'Bilgi',
          res.errorMessage || 'Lütfen önce "📁 Klasör Seç" butonu ile cihazınızdan bir gazete klasörü belirleyiniz.'
        );
      }
    } catch (err) {
      console.error('Klasör yenileme hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Alternatif: Cihazdan Çoklu Görsel / Dosya Seçme
  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const firstAsset = result.assets[0];
        let detectedFolder = 'Seçilen Dosyalar';
        if (firstAsset.uri) {
          const parts = firstAsset.uri.split('/');
          if (parts.length > 2) {
            detectedFolder = parts.slice(0, parts.length - 1).join('/') + '/';
          }
        }

        await FolderCatalogService.saveSelectedFolderPath(detectedFolder);
        setFolderPath(detectedFolder);

        const newItems = result.assets.map((asset) => ({
          fileName: asset.name,
          fileUri: asset.uri,
          fileSizeBytes: asset.size,
        }));

        await FolderCatalogService.addImages(newItems);
        await loadData();

        Alert.alert(
          'Görseller Eklendi ✅',
          `${result.assets.length} adet gazete görseli listeye dahil edildi.`
        );
      }
    } catch (err) {
      console.error('Dosya seçme hatası:', err);
      Alert.alert('Hata', 'Görseller seçilirken bir hata oluştu.');
    }
  };

  // Test için Örnek Gazete Paketi Ekleme
  const handleLoadSampleGazettes = async () => {
    const sampleItems = [
      {
        fileName: '1974-07-21_hurriyet_baris_harekati.jpg',
        fileUri: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000',
        fileSizeBytes: 2450000,
      },
      {
        fileName: '1982-11-08_cumhuriyet_anayasa_oylamasi.jpg',
        fileUri: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1000',
        fileSizeBytes: 1890000,
      },
      {
        fileName: '1990-03-15_milliyet_ekonomi_manset.jpg',
        fileUri: 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?w=1000',
        fileSizeBytes: 3120000,
      },
      {
        fileName: '1969-07-20_tercuman_aya_inis.jpg',
        fileUri: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=1000',
        fileSizeBytes: 2100000,
      },
    ];

    setIsLoading(true);
    const demoFolder = 'Cihaz/Belgeler/Tarihi_Gazeteler/';
    await FolderCatalogService.saveSelectedFolderPath(demoFolder);
    setFolderPath(demoFolder);
    const updated = await FolderCatalogService.addImages(sampleItems);
    setImages(updated);
    const manifest = await FolderCatalogService.getFolderManifest();
    setManifestInfo(manifest);
    setIsLoading(false);
    Alert.alert('Örnek Klasör Hazır', '4 adet tarihi gazete sayfası yüklendi ve durum dosyasına işlendi.');
  };

  // Durum Dosyası (Manifest) Bilgi Uyarısı
  const handleShowManifestDetails = () => {
    const path = FolderCatalogService.getManifestFilePath();
    const total = images.length;
    const proc = images.filter((i) => i.status === 'PROCESSED').length;
    const unproc = images.filter((i) => i.status === 'UNPROCESSED').length;

    Alert.alert(
      '📄 Durum Dosyası (Manifest)',
      `Kayıtlı Dosya: ocr_gazete_manifest.json\n\n` +
      `Konum: ${path}\n\n` +
      `Klasör: ${folderPath}\n` +
      `Toplam Gazete: ${total}\n` +
      `✅ OCR Yapılan: ${proc}\n` +
      `⏳ Bekleyen: ${unproc}\n\n` +
      `Her işlemde bu dosya ve yerel veritabanı anlık olarak senkronize edilir.`
    );
  };

  // Bir görsele tıklandığında:
  const handleImagePress = (item: ImageFolderItemDTO) => {
    setSelectedImage(item);
  };

  // 2. Sütunlar Belirlendi ve Kırpma Tamamlandı: Sırayla OCR'a Gönder
  const handleCropComplete = async (
    primaryCroppedUri: string,
    zones: CropRegionItem[],
    _corners: CropCoordinatesDTO
  ) => {
    if (!selectedImage) return;

    setIsLoading(true);
    try {
      const ocrParts: string[] = [];
      const updatedZones: CropRegionItem[] = [];

      // Sütunları gazete okuma sırasıyla ardışık OCR yap
      for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        const targetUri = zone.croppedUri || primaryCroppedUri;
        const ocrRes = await OcrService.recognizeText(
          targetUri,
          `${selectedImage.fileName}_sutun_${i + 1}`
        );

        updatedZones.push({
          ...zone,
          ocrText: ocrRes.text,
        });

        ocrParts.push(
          zones.length > 1
            ? `📰 [${zone.label || `${i + 1}. Sütun`}]\n${ocrRes.text}`
            : ocrRes.text
        );
      }

      const combinedText = ocrParts.join('\n\n' + '─'.repeat(26) + '\n\n');

      setReviewData({
        fileName: selectedImage.fileName,
        originalUri: selectedImage.fileUri,
        croppedUri: primaryCroppedUri,
        croppedUris: zones.map((z) => z.croppedUri!).filter(Boolean),
        zones: updatedZones,
        ocrText: combinedText,
        engineUsed: `OCR.Space (${zones.length} Sütun Sıralı Okundu)`,
      });

      setSelectedImage(null);
      setIsReviewVisible(true);
    } catch (err) {
      console.error('OCR hatası:', err);
      Alert.alert('Hata', 'OCR işlemi gerçekleştirilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Kullanıcı OCR'ı Onayladı: Dosya Adıyla Katalogla ve (İsterse) Sıradaki Gazeteye Geç
  const handleApproveOcr = async (finalText: string, andGoToNext = false) => {
    if (!reviewData) return;

    try {
      const approvedFileName = reviewData.fileName;

      await FolderCatalogService.saveApprovedCatalog({
        fileName: approvedFileName,
        originalUri: reviewData.originalUri,
        croppedUri: reviewData.croppedUri,
        cropCoordinates: {
          topLeft: { x: 0, y: 0 },
          topRight: { x: 0, y: 0 },
          bottomRight: { x: 0, y: 0 },
          bottomLeft: { x: 0, y: 0 },
        },
        rawOcrText: reviewData.ocrText,
        editedOcrText: finalText,
        isApproved: true,
      });

      // Verileri yeniden yükle
      const all = await FolderCatalogService.getAllImages();
      setImages(all);
      const records = await FolderCatalogService.getAllCatalogRecords();
      setCatalogRecords(records);
      const manifest = await FolderCatalogService.getFolderManifest();
      setManifestInfo(manifest);

      if (andGoToNext) {
        // Sıradaki işlenmemiş gazeteyi bul
        const currentIdx = all.findIndex((img) => img.fileName === approvedFileName);
        const nextUnprocessed =
          all.slice(currentIdx + 1).find((img) => img.status === 'UNPROCESSED') ||
          all.find((img) => img.status === 'UNPROCESSED');

        setIsReviewVisible(false);
        setReviewData(null);

        if (nextUnprocessed) {
          setSelectedImage(nextUnprocessed);
        } else {
          Alert.alert(
            'Tebrikler! 🎉',
            `'${approvedFileName}' kataloglandı. Klasördeki tüm gazetelerin OCR işlemi tamamlandı!`
          );
        }
      } else {
        setIsReviewVisible(false);
        setReviewData(null);
        Alert.alert(
          'Kataloglandı! 🎉',
          `'${approvedFileName}' için OCR onaylandı ve katalog kaydı oluşturuldu.`
        );
      }
    } catch (err) {
      console.error('Kataloglama hatası:', err);
      Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu.');
    }
  };

  // Kullanıcı OCR'ı Beğenmedi / Reddetti
  const handleRejectOcr = () => {
    if (reviewData) {
      const currentItem = images.find((i) => i.fileName === reviewData.fileName);
      setIsReviewVisible(false);
      setReviewData(null);
      if (currentItem) {
        setSelectedImage(currentItem);
      }
    } else {
      setIsReviewVisible(false);
      setReviewData(null);
    }
  };

  // Filtrelenmiş ve aranmış görseller (8.000+ görselde anında filtreler)
  const displayedImages = images
    .filter((img) => {
      if (activeTab === 'ALL') return true;
      return img.status === activeTab;
    })
    .filter((img) => {
      if (!searchQuery.trim()) return true;
      return img.fileName.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });

  const unprocessedCount = images.filter((img) => img.status === 'UNPROCESSED').length;
  const processedCount = images.filter((img) => img.status === 'PROCESSED').length;

  // Seçili görselin sıra indeksi ve önceki/sonraki navigasyon hesapları
  const currentImageIndex = selectedImage
    ? images.findIndex((img) => img.id === selectedImage.id)
    : -1;
  const hasPreviousImage = currentImageIndex > 0;
  const hasNextImage = currentImageIndex !== -1 && currentImageIndex < images.length - 1;

  const handlePreviousImage = () => {
    if (hasPreviousImage) {
      setSelectedImage(images[currentImageIndex - 1]);
    }
  };

  const handleNextImage = () => {
    if (hasNextImage) {
      setSelectedImage(images[currentImageIndex + 1]);
    }
  };

  // İnceleme modalı için sonraki gazete var mı kontrolü
  const hasReviewNext = reviewData
    ? images.some(
        (img) => img.fileName !== reviewData.fileName && img.status === 'UNPROCESSED'
      ) || images.length > 1
    : false;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

        {/* Üst Başlık ve Katalog Erişimi */}
        {!selectedImage && (
          <>
            <View style={styles.appHeader}>
              <View>
                <Text style={styles.appTitle}>Gazete OCR & Katalog</Text>
                <Text style={styles.appSubtitle}>Çapraz Seçim • Pinch Zoom • Pratik Arşiv</Text>
              </View>

              <View style={styles.headerRightButtons}>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => setIsSettingsVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.settingsButtonText}>
                    ⚙️ {customKeyCount > 0 ? `${customKeyCount} Key` : 'Ayarlar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.catalogButton}
                  onPress={() => setIsCatalogModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.catalogButtonText}>📚 Katalog ({catalogRecords.length})</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Klasör & Durum Dosyası Çubuğu */}
            <View style={styles.folderCard}>
              <View style={styles.folderTopRow}>
                <View style={styles.folderLeft}>
                  <Text style={styles.folderLabel}>📁 Klasör:</Text>
                  <Text style={styles.folderPathText} numberOfLines={1}>
                    {folderPath}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.manifestFileBadge}
                  onPress={handleShowManifestDetails}
                  activeOpacity={0.8}
                >
                  <Text style={styles.manifestFileBadgeText}>📄 Durum Dosyası</Text>
                </TouchableOpacity>
              </View>

              {/* İstatistikler */}
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillLabel}>Toplam: </Text>
                  <Text style={styles.statPillVal}>{images.length}</Text>
                </View>
                <View style={[styles.statPill, styles.statPillUnproc]}>
                  <Text style={styles.statPillLabel}>⏳ Bekleyen: </Text>
                  <Text style={[styles.statPillVal, { color: '#FCD34D' }]}>{unprocessedCount}</Text>
                </View>
                <View style={[styles.statPill, styles.statPillProc]}>
                  <Text style={styles.statPillLabel}>✅ OCR Yapılan: </Text>
                  <Text style={[styles.statPillVal, { color: '#4ADE80' }]}>{processedCount}</Text>
                </View>
              </View>

              {/* Klasör Ekleme & Yenileme Butonları */}
              <View style={styles.folderActionsRow}>
                <TouchableOpacity
                  style={styles.folderPickBtn}
                  onPress={handlePickDirectory}
                  activeOpacity={0.85}
                >
                  <Text style={styles.folderPickBtnText}>📁 Klasör Seç</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rescanFolderBtn}
                  onPress={handleRescanFolder}
                  activeOpacity={0.85}
                >
                  <Text style={styles.rescanFolderBtnText}>🔄 Yenile / Yeni Ekle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.filesPickBtn}
                  onPress={handlePickDocuments}
                  activeOpacity={0.85}
                >
                  <Text style={styles.filesPickBtnText}>📂 Dosya</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sampleLoadBtn}
                  onPress={handleLoadSampleGazettes}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sampleLoadBtnText}>📰 Örnek</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Aktif Kırpma Modu (Köşeler Belirleniyor) */}
        {selectedImage ? (
          <View style={styles.cropperOverlay}>
            <CornerCropper
              imageUri={selectedImage.fileUri}
              fileName={selectedImage.fileName}
              currentIndex={currentImageIndex}
              totalImages={images.length}
              hasPrevious={hasPreviousImage}
              hasNext={hasNextImage}
              onPrevious={handlePreviousImage}
              onNext={handleNextImage}
              onCropComplete={handleCropComplete}
              onCancel={() => setSelectedImage(null)}
            />
          </View>
        ) : (
          <>
            {/* Sekmeler: Tümü / Bekleyenler / OCR Yapılanlar */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'ALL' && styles.tabButtonActive]}
                onPress={() => setActiveTab('ALL')}
              >
                <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
                  Tümü ({images.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'UNPROCESSED' && styles.tabButtonActive]}
                onPress={() => setActiveTab('UNPROCESSED')}
              >
                <Text style={[styles.tabText, activeTab === 'UNPROCESSED' && styles.tabTextActive]}>
                  ⏳ Bekleyen ({unprocessedCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'PROCESSED' && styles.tabButtonActive]}
                onPress={() => setActiveTab('PROCESSED')}
              >
                <Text style={[styles.tabText, activeTab === 'PROCESSED' && styles.tabTextActive]}>
                  ✅ OCR Yapılan ({processedCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* 8.000+ Gazete İçin Anlık Arama */}
            {images.length > 5 && (
              <View style={styles.searchBarContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder={`🔍 ${images.length} gazete içinde ara (ör: 45)...`}
                  placeholderTextColor="#64748B"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                    <Text style={styles.clearSearchText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Görsel Listesi (8.000+ görsel için yüksek performanslı FlatList) */}
            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#38BDF8" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
              </View>
            ) : displayedImages.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyIcon}>
                  {activeTab === 'PROCESSED' ? '📚' : '🗞️'}
                </Text>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'PROCESSED'
                    ? 'Henüz OCR yapılan görsel yok'
                    : 'Klasörde resim bulunamadı'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'PROCESSED'
                    ? 'Bekleyen görsellerden birine tıklayıp çapraz kutu seçimiyle OCR yapın.'
                    : 'Yukarıdaki "📁 Klasör Seç & Tara" butonuna basarak gazete görsellerinizi içe aktarın.'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={displayedImages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                windowSize={5}
                removeClippedSubviews={true}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={styles.imageCard}
                    onPress={() => handleImagePress(item)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.fileUri }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />

                    <View style={styles.cardInfo}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardIndexText}>#{index + 1}</Text>
                        <Text
                          style={[
                            styles.badge,
                            item.status === 'PROCESSED'
                              ? styles.badgeSuccess
                              : styles.badgePending,
                          ]}
                        >
                          {item.status === 'PROCESSED' ? '✅ OCR Yapıldı' : '⏳ Bekliyor'}
                        </Text>
                      </View>

                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.fileName}
                      </Text>

                      {item.ocrSnippet ? (
                        <Text style={styles.cardSnippet} numberOfLines={2}>
                          "{item.ocrSnippet}"
                        </Text>
                      ) : null}

                      <View style={styles.cardBottomRow}>
                        <Text style={styles.cardActionBtn}>
                          {item.status === 'PROCESSED' ? '🔄 Tekrar Tara / Düzenle ›' : '✂️ Seç & Tara ›'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}

        {/* İnceleme & Kullanıcı Onay Ekranı */}
        {reviewData && (
          <ReviewModal
            visible={isReviewVisible}
            fileName={reviewData.fileName}
            croppedImageUri={reviewData.croppedUri}
            croppedUris={reviewData.croppedUris}
            initialOcrText={reviewData.ocrText}
            engineUsed={reviewData.engineUsed}
            hasNext={hasReviewNext}
            onApprove={handleApproveOcr}
            onReject={handleRejectOcr}
          />
        )}

        {/* Katalog Kayıtları Listesi */}
        <CatalogListModal
          visible={isCatalogModalVisible}
          records={catalogRecords}
          onClose={() => setIsCatalogModalVisible(false)}
        />

        {/* OCR API Ayarları Modalı */}
        <SettingsModal
          visible={isSettingsVisible}
          onClose={() => setIsSettingsVisible(false)}
          onKeysUpdated={(count) => setCustomKeyCount(count)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#0F172A',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  appSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  settingsButtonText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  catalogButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  catalogButtonText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  // Klasör Kartı
  folderCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  folderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  folderLeft: {
    flex: 1,
    marginRight: 8,
  },
  folderLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  folderPathText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '700',
    marginTop: 1,
  },
  manifestFileBadge: {
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  manifestFileBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statPillUnproc: {
    borderColor: '#D97706',
  },
  statPillProc: {
    borderColor: '#059669',
  },
  statPillLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  statPillVal: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
  },
  folderActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  folderPickBtn: {
    flex: 1.4,
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderPickBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  rescanFolderBtn: {
    flex: 1.6,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rescanFolderBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  filesPickBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filesPickBtnText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  sampleLoadBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  sampleLoadBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  // Sekmeler
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 7,
  },
  tabButtonActive: {
    backgroundColor: '#0284C7',
  },
  tabText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Görsel Listesi
  listContainer: {
    paddingHorizontal: 14,
    paddingBottom: 20,
    gap: 10,
  },
  imageCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 90,
  },
  cardImage: {
    width: 85,
    height: '100%',
    backgroundColor: '#020617',
  },
  cardInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIndexText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginVertical: 3,
  },
  cardSnippet: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cardActionBtn: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSuccess: {
    backgroundColor: '#064E3B',
    color: '#4ADE80',
  },
  badgePending: {
    backgroundColor: '#78350F',
    color: '#FCD34D',
  },
  cropperOverlay: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 14,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 320,
  },
  // Arama Çubuğu
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 12,
    paddingVertical: 7,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
});
