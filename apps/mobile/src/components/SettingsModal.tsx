import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { OcrService } from '../services/ocr';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onKeysUpdated?: (count: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onKeysUpdated,
}) => {
  const [keys, setKeys] = useState<string[]>([]);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [showFullKeys, setShowFullKeys] = useState(false);

  useEffect(() => {
    if (visible) {
      loadKeys();
    }
  }, [visible]);

  const loadKeys = async () => {
    try {
      const userKeys = await OcrService.getUserApiKeys();
      setKeys(userKeys);
      onKeysUpdated?.(userKeys.length);
    } catch (err) {
      console.error('Anahtar yükleme hatası:', err);
    }
  };

  const handleAddKey = async () => {
    const trimmed = newKeyInput.trim();
    if (!trimmed) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir API anahtarı giriniz.');
      return;
    }

    if (keys.includes(trimmed)) {
      Alert.alert('Bilgi', 'Bu anahtar zaten listenizde ekli.');
      return;
    }

    try {
      const updated = await OcrService.addUserApiKey(trimmed);
      setKeys(updated);
      setNewKeyInput('');
      onKeysUpdated?.(updated.length);
      Alert.alert(
        'Anahtar Eklendi ✅',
        `Özel API anahtarınız telefonunuza güvenle kaydedildi.\nAktif anahtar sayısı: ${updated.length}`
      );
    } catch (err: any) {
      Alert.alert('Hata', err?.message || 'Anahtar eklenirken hata oluştu.');
    }
  };

  const handleRemoveKey = (keyToRemove: string) => {
    Alert.alert(
      'Anahtarı Sil',
      'Bu API anahtarını cihazınızdan kaldırmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const updated = await OcrService.removeUserApiKey(keyToRemove);
            setKeys(updated);
            onKeysUpdated?.(updated.length);
          },
        },
      ]
    );
  };

  const maskKey = (k: string) => {
    if (k.length <= 6) return '******';
    return `${k.slice(0, 4)}••••${k.slice(-4)}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Başlık Barı */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>⚙️ OCR Ayarları & Anahtarlar</Text>
              <Text style={styles.headerSubtitle}>
                Yalnızca telefonunuzun yerel hafızasında saklanır
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            {/* Güvenlik Güvencesi Kartı */}
            <View style={styles.securityCard}>
              <Text style={styles.securityTitle}>🔒 Sıfır Paylaşım & %100 Cihaz İçi Gizlilik</Text>
              <Text style={styles.securityText}>
                Girdiğiniz API anahtarları hiçbir LLM yapay zekasına, harici bulut sunucusuna veya
                üçüncü tarafa gönderilmez. Yalnızca telefonunuzda saklanır ve gazete taranırken
                doğrudan kullanılır.
              </Text>
            </View>

            {/* Yeni Anahtar Ekleme Alanı */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>🔑 Yeni OCR API Anahtarı Yapıştır:</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: K89472618288957"
                  placeholderTextColor="#64748B"
                  value={newKeyInput}
                  onChangeText={setNewKeyInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddKey}>
                  <Text style={styles.addBtnText}>➕ Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Kayıtlı Anahtarlar Listesi */}
            <View style={styles.listSection}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listHeaderTitle}>
                  Aktif Anahtarlar ({keys.length})
                </Text>
                {keys.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowFullKeys(!showFullKeys)}
                    style={styles.toggleMaskBtn}
                  >
                    <Text style={styles.toggleMaskText}>
                      {showFullKeys ? '🙈 Gizle' : '👁️ Göster'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {keys.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    Henüz özel anahtar eklenmedi. Uygulama şu an varsayılan ücretsiz havuz
                    anahtarını kullanıyor.
                  </Text>
                  <Text style={styles.emptySubText}>
                    Yukarıdan kendi anahtarınızı eklediğinizde anında sizin kotanız devreye girer.
                  </Text>
                </View>
              ) : (
                keys.map((k, index) => (
                  <View key={k} style={styles.keyItemCard}>
                    <View style={styles.keyItemLeft}>
                      <View style={styles.keyIndexBadge}>
                        <Text style={styles.keyIndexText}>#{index + 1}</Text>
                      </View>
                      <Text style={styles.keyText}>
                        {showFullKeys ? k : maskKey(k)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleRemoveKey(k)}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Rotasyon Bilgi Kutusu */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>💡 Çoklu Anahtar (Rotasyon) Nasıl Çalışır?</Text>
              <Text style={styles.infoText}>
                Farklı e-postalardan aldığınız 2 veya 3 anahtarı buraya ekleyebilirsiniz. Sistem
                her gazete okutulduğunda anahtarları sırayla otomatik döndürür (1. sayfa Key 1, 2.
                sayfa Key 2). Biri dakikalık limite takılsa bile diğeri devreye girer ve işlem asla
                durmaz.
              </Text>
            </View>
          </ScrollView>

          {/* Alt Kapat Butonu */}
          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>✓ Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    padding: 14,
  },
  modalContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollArea: {
    padding: 14,
  },
  securityCard: {
    backgroundColor: '#064E3B',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#059669',
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A7F3D0',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 11,
    color: '#D1FAE5',
    lineHeight: 16,
  },
  inputCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  listSection: {
    marginBottom: 14,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  toggleMaskBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleMaskText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  emptySubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  keyItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  keyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  keyIndexBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  keyIndexText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  keyText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
    flex: 1,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 8,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FCD34D',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  bottomRow: {
    padding: 12,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  doneBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
